/**
 * Push notification test page for needonev2.
 * Uses the dedicated SW (/push-test-sw.js).
 * Subscribe: POST /api/push/subscribe (Supabase, requires auth)
 * Send:      POST /api/push-test/send-db (Supabase, requires auth)
 * Remove this file once push is fully integrated.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

type StepStatus = 'idle' | 'loading' | 'ok' | 'error'
interface Step { label: string; status: StepStatus; detail?: string; ts?: string }

function nowStr() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

function detectIOS() {
  if (typeof navigator === 'undefined') return { isIOS: false, isStandalone: false }
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = !!(window.navigator as Navigator & { standalone?: boolean }).standalone
  return { isIOS, isStandalone }
}

export function getServerSideProps() {
  if (process.env.NODE_ENV === 'production') return { notFound: true }
  return { props: {} }
}

export default function PushTestPage() {
  const { session, loading: authLoading } = useAuth()
  const [steps, setSteps] = useState<Step[]>([
    { label: '1. Service worker registered', status: 'idle' },
    { label: '2. Notification permission granted', status: 'idle' },
    { label: '3. Push subscription created', status: 'idle' },
    { label: '4. Subscription saved to Supabase', status: 'idle' },
  ])
  const [sendTitle, setSendTitle] = useState('needone')
  const [sendBody, setSendBody] = useState('Test push from needonev2!')
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [subCount, setSubCount] = useState<string | null>(null)
  const [swInfo, setSwInfo] = useState('')
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [ios, setIos] = useState({ isIOS: false, isStandalone: false })

  const setStep = (i: number, patch: Partial<Step>) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch, ts: nowStr() } : s))

  useEffect(() => {
    const ctx = detectIOS()
    setIos(ctx)

    if (!('serviceWorker' in navigator)) {
      setSwInfo('Service workers not supported')
      return
    }

    navigator.serviceWorker.getRegistration('/push-test-sw.js').then(reg => {
      if (reg) {
        setSwInfo(`SW active | scope: ${reg.scope}`)
        setStep(0, { status: 'ok', detail: reg.scope })
      } else {
        setSwInfo('No SW registered yet — click Subscribe')
      }
    })

    setDebugInfo(JSON.stringify({
      notificationSupported: typeof Notification !== 'undefined',
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable',
      swSupported: 'serviceWorker' in navigator,
      pushSupported: 'PushManager' in window,
      vapidKeySet: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      ...ctx,
    }, null, 2))
  }, [])

  // Refresh DB sub count when session is available
  useEffect(() => {
    if (!session) return
    fetchDbSubCount(session.access_token)
  }, [session])

  async function fetchDbSubCount(token: string) {
    try {
      // Direct Supabase query via the subscribe endpoint would require a GET — use send-db GET instead.
      // For now, display count from subscribe response or send-db response.
      setSubCount('checking…')
      // We don't have a dedicated GET endpoint — count will update after subscribe/send.
      setSubCount(null)
    } catch {
      setSubCount(null)
    }
  }

  async function handleSubscribe() {
    if (!session) return

    setStep(0, { status: 'loading' })
    let reg: ServiceWorkerRegistration
    try {
      reg = await navigator.serviceWorker.register('/push-test-sw.js')
      await navigator.serviceWorker.ready
      setStep(0, { status: 'ok', detail: reg.scope })
    } catch (err) {
      setStep(0, { status: 'error', detail: String(err) })
      return
    }

    setStep(1, { status: 'loading' })
    if (typeof Notification === 'undefined') {
      setStep(1, { status: 'error', detail: 'Notification API unavailable — see instructions above' })
      return
    }
    let permission: NotificationPermission
    try {
      permission = await Notification.requestPermission()
    } catch (err) {
      setStep(1, { status: 'error', detail: String(err) })
      return
    }
    if (permission !== 'granted') {
      setStep(1, { status: 'error', detail: `Permission: ${permission}` })
      return
    }
    setStep(1, { status: 'ok', detail: 'granted' })

    setStep(2, { status: 'loading' })
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      setStep(2, { status: 'error', detail: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY not set' })
      return
    }
    let sub: PushSubscription
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON()
      setStep(2, { status: 'ok', detail: `…${sub.endpoint.slice(-30)} | p256dh: ${json.keys?.p256dh?.slice(0, 10)}…` })
    } catch (err) {
      setStep(2, { status: 'error', detail: String(err) })
      return
    }

    setStep(3, { status: 'loading' })
    try {
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(sub.toJSON()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? res.statusText)
      console.log('[push-test] saved to Supabase')
      setStep(3, { status: 'ok', detail: 'Saved to Supabase push_subscriptions' })
      setSubCount('1+ (check Supabase Studio)')
    } catch (err) {
      setStep(3, { status: 'error', detail: String(err) })
    }
  }

  async function handleSend() {
    if (!session) return
    setSendResult('Sending…')
    try {
      const res = await fetch('/api/push-test/send-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: sendTitle, body: sendBody }),
      })
      const data = await res.json()
      console.log('[push-test] send-db:', data)
      setSendResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setSendResult(`Error: ${err}`)
    }
  }

  const icon = (s: StepStatus) => ({ ok: '✅', error: '❌', loading: '⏳', idle: '⬜' }[s])
  const subscribeDisabled = (ios.isIOS && !ios.isStandalone) || !session

  if (authLoading) {
    return (
      <div style={{ fontFamily: 'monospace', maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
        <p style={{ color: '#888', fontSize: 13 }}>Checking auth…</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>needonev2 — Push Test</h1>
      <p style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>
        Uses /push-test-sw.js + Supabase push_subscriptions.
      </p>

      {/* Auth status */}
      {session ? (
        <p style={{ fontSize: 11, color: '#16a34a', marginBottom: 20 }}>
          ✓ Logged in as {session.user.email}
        </p>
      ) : (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
          <strong>Not logged in</strong> — <a href="/auth" style={{ color: '#92400e' }}>Sign in first</a> to use push subscriptions
        </div>
      )}

      {/* iOS banner */}
      {ios.isIOS && !ios.isStandalone && (
        <div style={{ background: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13 }}>
          <strong>Add to Home Screen first</strong>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Tap the <strong>Share</strong> button at the bottom of your browser</li>
            <li>Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></li>
            <li>Open the app from your Home Screen icon</li>
            <li>Then tap Subscribe</li>
          </ol>
        </div>
      )}

      {swInfo && <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>{swInfo}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={handleSubscribe}
          disabled={subscribeDisabled}
          style={{
            background: subscribeDisabled ? '#999' : '#1a1a1a', color: '#fff',
            border: 'none', padding: '10px 20px', borderRadius: 8,
            cursor: subscribeDisabled ? 'not-allowed' : 'pointer', fontSize: 14,
          }}
        >
          Subscribe
        </button>
        {subCount !== null && (
          <span style={{ fontSize: 13, color: '#666' }}>{subCount}</span>
        )}
      </div>

      <div style={{ marginBottom: 32 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{icon(step.status)} {step.label}</div>
            {step.detail && <div style={{ fontSize: 11, color: '#555', marginTop: 3, wordBreak: 'break-all' }}>{step.detail}</div>}
            {step.ts && step.status !== 'idle' && <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{step.ts}</div>}
          </div>
        ))}
      </div>

      <hr style={{ marginBottom: 24 }} />
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Send Test Push</h2>
      {!session && (
        <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>Log in to send pushes.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <input value={sendTitle} onChange={e => setSendTitle(e.target.value)} placeholder="Title"
          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} />
        <input value={sendBody} onChange={e => setSendBody(e.target.value)} placeholder="Body"
          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} />
        <button
          onClick={handleSend}
          disabled={!session}
          style={{
            background: session ? '#1a1a1a' : '#999', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: 8, cursor: session ? 'pointer' : 'not-allowed',
            fontSize: 14, alignSelf: 'flex-start',
          }}
        >
          Send Push (Supabase)
        </button>
      </div>

      {sendResult && (
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, fontSize: 11, overflowX: 'auto' }}>
          {sendResult}
        </pre>
      )}

      <hr style={{ marginTop: 32, marginBottom: 16 }} />
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#888' }}>Debug info</summary>
        <pre style={{ fontSize: 11, marginTop: 8 }}>{debugInfo ?? 'loading…'}</pre>
      </details>
    </div>
  )
}

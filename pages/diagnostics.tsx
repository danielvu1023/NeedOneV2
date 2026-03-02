/**
 * Diagnostics page — no auth required.
 * Useful for mobile debugging without USB. Shows Supabase health, env vars,
 * session state, browser capabilities, and captured error log.
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getErrors, logError } from '@/lib/errorLog'


interface HealthResult {
  ok: boolean
  latencyMs: number
  status?: number
  error?: string
}

interface EnvStatus {
  NEXT_PUBLIC_SUPABASE_URL: boolean
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean
  NEXT_PUBLIC_MAPBOX_TOKEN: boolean
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: boolean
}

interface BrowserCaps {
  notificationAPI: boolean
  serviceWorker: boolean
  pushManager: boolean
  standalone: boolean
  ios: boolean
  permission: string
}

interface PushSubStatus {
  permission: string
  swRegistered: boolean
  endpoint: string | null
  loading: boolean
}

export function getServerSideProps() {
  if (process.env.NODE_ENV === 'production') return { notFound: true }
  return { props: {} }
}

export default function DiagnosticsPage() {
  const [health, setHealth] = useState<HealthResult | null>(null)
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [sessionInfo, setSessionInfo] = useState<string>('checking…')
  const [browserCaps, setBrowserCaps] = useState<BrowserCaps | null>(null)
  const [errors, setErrors] = useState<ReturnType<typeof getErrors>>([])
  const [refreshCount, setRefreshCount] = useState(0)
  const [loadTime, setLoadTime] = useState('')
  const [pushSub, setPushSub] = useState<PushSubStatus>({ permission: 'checking…', swRegistered: false, endpoint: null, loading: false })

  useEffect(() => {
    setLoadTime(new Date().toISOString())
  }, [])

  useEffect(() => {
    // Env vars
    setEnvStatus({
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_MAPBOX_TOKEN: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    // Browser capabilities
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = !!(window.navigator as Navigator & { standalone?: boolean }).standalone ||
      window.matchMedia('(display-mode: standalone)').matches
    setBrowserCaps({
      notificationAPI: typeof Notification !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      standalone: isStandalone,
      ios: isIOS,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable',
    })

    // Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionInfo(`user: ${session.user.id.slice(0, 8)}… | email: ${session.user.email}`)
      } else {
        setSessionInfo('no session')
      }
    })

    // Supabase health
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const start = Date.now()
      fetch(`${supabaseUrl}/auth/v1/health`, { cache: 'no-store' })
        .then(async (r) => {
          const latencyMs = Date.now() - start
          setHealth({ ok: r.ok, latencyMs, status: r.status })
        })
        .catch((err) => {
          setHealth({ ok: false, latencyMs: Date.now() - start, error: String(err) })
        })
    } else {
      setHealth({ ok: false, latencyMs: 0, error: 'NEXT_PUBLIC_SUPABASE_URL not set' })
    }
  }, [refreshCount])

  // Poll error log every 2s
  useEffect(() => {
    setErrors(getErrors())
    const interval = setInterval(() => setErrors(getErrors()), 2000)
    return () => clearInterval(interval)
  }, [])

  // Check push subscription status
  const checkPushSub = useCallback(async () => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      setPushSub({ permission: 'unavailable', swRegistered: false, endpoint: null, loading: false })
      return
    }
    const permission = Notification.permission
    let swRegistered = false
    let endpoint: string | null = null
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      // Check all SW states — active may not be set right after registration
      const swUrlMatch = (r: ServiceWorkerRegistration) =>
        r.scope.includes('push-scope') ||
        [r.active, r.waiting, r.installing].some((sw) => sw?.scriptURL?.includes('push-sw'))
      swRegistered = regs.some(swUrlMatch)
      // Find endpoint from any registration that has an active push subscription
      for (const r of regs) {
        const sub = await r.pushManager.getSubscription()
        if (sub) {
          endpoint = sub.endpoint.slice(0, 40) + '…'
          break
        }
      }
    } catch {
      // ignore
    }
    setPushSub({ permission, swRegistered, endpoint, loading: false })
  }, [])

  useEffect(() => {
    checkPushSub()
  }, [checkPushSub, refreshCount])

  const resubscribe = useCallback(async () => {
    setPushSub((s) => ({ ...s, loading: true }))
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        logError('push', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')
        setPushSub((s) => ({ ...s, loading: false }))
        return
      }
      logError('push', 'registering push-sw.js')
      const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/push-scope/' })
      logError('push', 'push-sw.js registered')

      function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
        return outputArray.buffer as ArrayBuffer
      }

      let sub = await reg.pushManager.getSubscription()
      if (sub) {
        logError('push', 'existing subscription found — re-saving to DB', sub.endpoint.slice(0, 30))
      } else {
        logError('push', 'no existing subscription — creating new')
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        logError('push', 'subscribed', 'endpoint=' + sub.endpoint.slice(0, 30))
      }

      const json = sub.toJSON()
      if (json.keys) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
          })
          if (!res.ok) logError('push', 'subscription save failed', await res.text())
        } else {
          logError('push', 're-subscribe: no session — subscription not saved to DB')
        }
      }
    } catch (err) {
      logError('push', 're-subscribe error', err)
    } finally {
      await checkPushSub()
    }
  }, [checkPushSub])

  const row = (label: string, value: React.ReactNode, ok?: boolean) => (
    <tr key={label}>
      <td style={{ padding: '6px 10px 6px 0', color: '#888', fontSize: 12, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '6px 0', fontSize: 12, wordBreak: 'break-all' }}>
        {ok !== undefined && (
          <span style={{ color: ok ? '#16a34a' : '#dc2626', marginRight: 6 }}>{ok ? '✓' : '✗'}</span>
        )}
        {value}
      </td>
    </tr>
  )

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 640, margin: '0 auto', padding: '24px 16px', background: '#0f1e0c', minHeight: '100vh', color: '#e8f0e0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>needone diagnostics</h1>
        <button
          onClick={() => setRefreshCount(c => c + 1)}
          style={{ fontSize: 11, padding: '4px 10px', background: '#1e3a1e', border: '1px solid #2d5a2d', borderRadius: 6, color: '#98c52c', cursor: 'pointer' }}
        >
          refresh
        </button>
        <button
          onClick={async () => {
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations()
              await Promise.all(regs.map(r => r.unregister()))
            }
            const keys = await caches.keys()
            await Promise.all(keys.map(k => caches.delete(k)))
            window.location.reload()
          }}
          style={{ fontSize: 11, padding: '4px 10px', background: '#3a1e1e', border: '1px solid #5a2d2d', borderRadius: 6, color: '#f87171', cursor: 'pointer' }}
        >
          clear cache &amp; reload
        </button>
        <a href="/auth" style={{ fontSize: 11, color: '#6b9f3f', textDecoration: 'none' }}>← auth</a>
      </div>
      <p style={{ fontSize: 10, color: '#4a6a3a', marginBottom: 20 }}>
        loaded: {loadTime || '…'}
      </p>

      {/* Supabase Health */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#98c52c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Supabase</h2>
        <div style={{ background: '#1a2e1a', borderRadius: 8, padding: '12px 14px' }}>
          {health === null ? (
            <span style={{ fontSize: 12, color: '#888' }}>checking…</span>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {row('health endpoint', health.ok ? `${health.status} OK` : (health.error ?? `${health.status} error`), health.ok)}
                {row('latency', `${health.latencyMs}ms`)}
                {row('url', process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)')}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Env Vars */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#98c52c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Env Vars</h2>
        <div style={{ background: '#1a2e1a', borderRadius: 8, padding: '12px 14px' }}>
          {envStatus === null ? (
            <span style={{ fontSize: 12, color: '#888' }}>checking…</span>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {(Object.entries(envStatus) as [string, boolean][]).map(([key, val]) =>
                  row(key, val ? 'set' : 'MISSING', val)
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Session */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#98c52c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Session</h2>
        <div style={{ background: '#1a2e1a', borderRadius: 8, padding: '12px 14px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {row('session', sessionInfo, sessionInfo !== 'no session' && sessionInfo !== 'checking…' ? true : sessionInfo === 'no session' ? false : undefined)}
            </tbody>
          </table>
        </div>
      </section>

      {/* Browser Capabilities */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#98c52c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Browser</h2>
        <div style={{ background: '#1a2e1a', borderRadius: 8, padding: '12px 14px' }}>
          {browserCaps === null ? (
            <span style={{ fontSize: 12, color: '#888' }}>checking…</span>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {row('Notification API', String(browserCaps.notificationAPI), browserCaps.notificationAPI)}
                {row('permission', browserCaps.permission, browserCaps.permission === 'granted')}
                {row('serviceWorker', String(browserCaps.serviceWorker), browserCaps.serviceWorker)}
                {row('PushManager', String(browserCaps.pushManager), browserCaps.pushManager)}
                {row('standalone mode', String(browserCaps.standalone))}
                {row('iOS', String(browserCaps.ios))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Push Subscription */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#98c52c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Push Subscription</h2>
        <div style={{ background: '#1a2e1a', borderRadius: 8, padding: '12px 14px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 10 }}>
            <tbody>
              {row('permission', pushSub.permission, pushSub.permission === 'granted')}
              {row('push-sw.js registered', String(pushSub.swRegistered), pushSub.swRegistered)}
              {row('active endpoint', pushSub.endpoint ?? 'none', pushSub.endpoint !== null)}
            </tbody>
          </table>
          <button
            onClick={resubscribe}
            disabled={pushSub.loading}
            style={{ fontSize: 11, padding: '4px 10px', background: '#1e3a1e', border: '1px solid #2d5a2d', borderRadius: 6, color: '#98c52c', cursor: pushSub.loading ? 'not-allowed' : 'pointer', opacity: pushSub.loading ? 0.6 : 1 }}
          >
            {pushSub.loading ? 'subscribing…' : 'Re-subscribe'}
          </button>
        </div>
      </section>

      {/* Error Log */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#98c52c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Error Log ({errors.length})
        </h2>
        <div style={{ background: '#1a2e1a', borderRadius: 8, padding: '12px 14px' }}>
          {errors.length === 0 ? (
            <span style={{ fontSize: 12, color: '#888' }}>no errors captured</span>
          ) : (
            [...errors].reverse().map((e, i) => (
              <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < errors.length - 1 ? '1px solid #2d5a2d' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap' }}>{e.ts.slice(11, 19)}</span>
                  <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>[{e.tag}]</span>
                  <span style={{ fontSize: 12 }}>{e.message}</span>
                </div>
                {e.detail && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, paddingLeft: 8, wordBreak: 'break-all' }}>{e.detail}</div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <p style={{ fontSize: 10, color: '#4a6a3a', textAlign: 'center' }}>
        Error log resets on page reload · auto-refresh every 2s
      </p>
    </div>
  )
}

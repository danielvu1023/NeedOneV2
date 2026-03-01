/**
 * Diagnostics page — no auth required.
 * Useful for mobile debugging without USB. Shows Supabase health, env vars,
 * session state, browser capabilities, and captured error log.
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getErrors } from '@/lib/errorLog'


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

export default function DiagnosticsPage() {
  const [health, setHealth] = useState<HealthResult | null>(null)
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [sessionInfo, setSessionInfo] = useState<string>('checking…')
  const [browserCaps, setBrowserCaps] = useState<BrowserCaps | null>(null)
  const [errors, setErrors] = useState<ReturnType<typeof getErrors>>([])
  const [refreshCount, setRefreshCount] = useState(0)
  const [loadTime, setLoadTime] = useState('')

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

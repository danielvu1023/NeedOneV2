import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { logError } from '@/lib/errorLog'

// ─── iOS detection helpers ────────────────────────────────────────────────────
// On iOS every browser (Chrome, Firefox, Edge) is a WebKit wrapper — the
// Notification API is only available in Safari, and only when the PWA is
// installed to the Home Screen (standalone mode).

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // CriOS = Chrome on iOS, FxiOS = Firefox on iOS, EdgiOS = Edge on iOS
  return isIOS() && /safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // navigator.standalone is iOS Safari-specific
  return !!(window.navigator as Navigator & { standalone?: boolean }).standalone
}
// ─────────────────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export type PermissionState = 'unknown' | 'granted' | 'blocked' | 'dismissed' | 'unsupported'

const PUSH_STATE_KEY = 'push_permission_state'
const PUSH_DISMISSED_KEY = 'push_dismissed_at'
const LOCATION_STATE_KEY = 'location_permission_state'
const LOCATION_DISMISSED_KEY = 'location_dismissed_at'
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

function readStoredState(stateKey: string, dismissedKey: string): PermissionState {
  if (typeof window === 'undefined') return 'unknown'
  const stored = localStorage.getItem(stateKey) as PermissionState | null
  if (!stored) return 'unknown'
  if (stored === 'dismissed') {
    const dismissedAt = parseInt(localStorage.getItem(dismissedKey) ?? '0', 10)
    if (Date.now() - dismissedAt > DISMISS_COOLDOWN_MS) return 'unknown'
  }
  return stored
}

export function usePushPermission() {
  const { session } = useAuth()
  const [pushState, setPushState] = useState<PermissionState>(() =>
    readStoredState(PUSH_STATE_KEY, PUSH_DISMISSED_KEY)
  )
  const [locationState, setLocationState] = useState<PermissionState>(() =>
    readStoredState(LOCATION_STATE_KEY, LOCATION_DISMISSED_KEY)
  )
  const [subscribing, setSubscribing] = useState(false)

  // iOS context — set once on mount (client-only)
  const [iosContext, setIosContext] = useState<{
    isIOS: boolean
    isSafari: boolean
    isStandalone: boolean
  }>({ isIOS: false, isSafari: false, isStandalone: false })

  useEffect(() => {
    setIosContext({ isIOS: isIOS(), isSafari: isIOSSafari(), isStandalone: isStandalone() })
  }, [])

  useEffect(() => {
    // Sync actual browser permission state
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      setPushState('unsupported')
    } else {
      const actual = Notification.permission
      if (actual === 'granted') {
        setPushState('granted')
        localStorage.setItem(PUSH_STATE_KEY, 'granted')
        // Auto-restore: if permission was already granted (e.g. fresh session, cleared localStorage),
        // re-register push-sw.js and re-save the subscription to DB if one exists.
        ;(async () => {
          try {
            const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/push-scope/' })
            const existing = await reg.pushManager.getSubscription()
            if (existing) {
              logError('push', 'auto-restore: found existing sub on load', existing.endpoint.slice(0, 40))
              const json = existing.toJSON()
              if (!json.keys) return
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) return
              await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ endpoint: existing.endpoint, keys: json.keys }),
              })
            } else {
              logError('push', 'auto-restore: no existing sub')
            }
          } catch {
            // Silently ignore — auto-restore is best-effort
          }
        })()
      } else if (actual === 'denied') {
        setPushState('blocked')
        localStorage.setItem(PUSH_STATE_KEY, 'blocked')
      } else {
        setPushState(readStoredState(PUSH_STATE_KEY, PUSH_DISMISSED_KEY))
      }
    }

    if (!('geolocation' in navigator)) {
      setLocationState('unsupported')
    } else {
      // Can't read geolocation permission synchronously without Permissions API
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            setLocationState('granted')
            localStorage.setItem(LOCATION_STATE_KEY, 'granted')
          } else if (result.state === 'denied') {
            setLocationState('blocked')
            localStorage.setItem(LOCATION_STATE_KEY, 'blocked')
          } else {
            setLocationState(readStoredState(LOCATION_STATE_KEY, LOCATION_DISMISSED_KEY))
          }
        })
      } else {
        setLocationState(readStoredState(LOCATION_STATE_KEY, LOCATION_DISMISSED_KEY))
      }
    }
  }, [])

  async function requestPush() {
    if (!session || typeof Notification === 'undefined') return
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState('blocked')
        localStorage.setItem(PUSH_STATE_KEY, 'blocked')
        return
      }
      setPushState('granted')
      localStorage.setItem(PUSH_STATE_KEY, 'granted')

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        logError('push', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push subscription skipped')
        return
      }

      logError('push', 'registering push-sw.js')
      const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/push-scope/' })
      logError('push', 'push-sw.js registered')

      // Check for existing subscription before creating a new one
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
      if (!json.keys) {
        logError('push', 'Push subscription missing keys')
        return
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) return

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      })
      if (!res.ok) {
        logError('push', 'subscription save failed', await res.text())
      }
    } catch (err) {
      logError('push', 'Push subscription error', err)
    } finally {
      setSubscribing(false)
    }
  }

  function dismissPush() {
    setPushState('dismissed')
    localStorage.setItem(PUSH_STATE_KEY, 'dismissed')
    localStorage.setItem(PUSH_DISMISSED_KEY, Date.now().toString())
  }

  function dismissLocation() {
    setLocationState('dismissed')
    localStorage.setItem(LOCATION_STATE_KEY, 'dismissed')
    localStorage.setItem(LOCATION_DISMISSED_KEY, Date.now().toString())
  }

  async function requestLocation() {
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationState('granted')
          localStorage.setItem(LOCATION_STATE_KEY, 'granted')
          resolve()
        },
        () => {
          setLocationState('blocked')
          localStorage.setItem(LOCATION_STATE_KEY, 'blocked')
          resolve()
        }
      )
    })
  }

  const resetDismissed = useCallback((type: 'push' | 'location') => {
    if (type === 'push') {
      localStorage.removeItem(PUSH_DISMISSED_KEY)
      localStorage.removeItem(PUSH_STATE_KEY)
      setPushState('unknown')
    } else {
      localStorage.removeItem(LOCATION_DISMISSED_KEY)
      localStorage.removeItem(LOCATION_STATE_KEY)
      setLocationState('unknown')
    }
  }, [])

  // Legacy compat
  const state = pushState
  const requestPermission = requestPush

  return {
    state,
    pushState,
    locationState,
    subscribing,
    iosContext,
    requestPermission,
    requestPush,
    requestLocation,
    dismissPush,
    dismissLocation,
    resetDismissed,
  }
}

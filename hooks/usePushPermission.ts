import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

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
  const [pushState, setPushState] = useState<PermissionState>('unknown')
  const [locationState, setLocationState] = useState<PermissionState>('unknown')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    // Sync actual browser permission state
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushState('unsupported')
    } else {
      const actual = Notification.permission
      if (actual === 'granted') {
        setPushState('granted')
        localStorage.setItem(PUSH_STATE_KEY, 'granted')
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
    if (!session || !('Notification' in window)) return
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

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push subscription skipped')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })
      const json = sub.toJSON()
      if (!json.keys) return

      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) return

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      })
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
    requestPermission,
    requestPush,
    requestLocation,
    dismissPush,
    dismissLocation,
    resetDismissed,
  }
}

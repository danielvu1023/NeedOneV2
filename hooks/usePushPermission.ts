import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export type PushPermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported'

export function usePushPermission() {
  const { session } = useAuth()
  const [state, setState] = useState<PushPermissionState>('unknown')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported')
      return
    }
    setState(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
  }, [])

  async function requestPermission() {
    if (!session || !('Notification' in window)) return
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }
      setState('granted')

      // Register service worker and get push subscription
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

  return { state, subscribing, requestPermission }
}


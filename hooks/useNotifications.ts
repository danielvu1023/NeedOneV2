import { useEffect } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/lib/types'

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!actor_id(*), park:parks!park_id(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as Notification[]
}

export function useNotifications() {
  const { session } = useAuth()
  const { data, mutate } = useSWR(
    session ? ['notifications', session.user.id] : null,
    ([, userId]) => fetchNotifications(userId)
  )

  // Realtime: refetch when a new notification arrives
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        () => { mutate() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session, mutate])

  async function markRead(notificationId: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    mutate()
  }

  async function markAllRead() {
    if (!session) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false)
    mutate()
  }

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, markRead, markAllRead, mutate }
}

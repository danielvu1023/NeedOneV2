import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useMapStore } from '@/store/mapStore'
import type { CheckIn } from '@/lib/types'

export function useCheckIn() {
  const { session } = useAuth()
  const { upsertCheckIn, removeCheckIn } = useMapStore()
  const [currentCheckIn, setCurrentCheckIn] = useState<CheckIn | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) { setCurrentCheckIn(null); return }

    async function load() {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('check_ins')
        .select('*, profile:profiles!user_id(*), park:parks!park_id(*)')
        .eq('user_id', session!.user.id)
        .gt('expires_at', now)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        setCurrentCheckIn(data as CheckIn)
        upsertCheckIn(data as CheckIn) // also seed the map store
      }
    }
    load()
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  async function checkIn(parkId: string) {
    if (!session) return
    setLoading(true)
    try {
      // Remove any existing check-ins first
      await supabase.from('check_ins').delete().eq('user_id', session.user.id)

      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      const { error: insertError } = await supabase
        .from('check_ins')
        .insert({ user_id: session.user.id, park_id: parkId, expires_at: expiresAt })

      if (insertError) throw insertError

      // Fetch the new check-in separately with FK joins (more reliable than insert+select)
      const { data, error: selectError } = await supabase
        .from('check_ins')
        .select('*, profile:profiles!user_id(*), park:parks!park_id(*)')
        .eq('user_id', session.user.id)
        .gt('expires_at', new Date().toISOString())
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (selectError) throw selectError
      if (!data) return

      const ci = data as CheckIn
      setCurrentCheckIn(ci)
      upsertCheckIn(ci) // immediately show on map without waiting for Realtime
    } finally {
      setLoading(false)
    }
  }

  async function checkOut() {
    if (!session || !currentCheckIn) return
    setLoading(true)
    try {
      await supabase.from('check_ins').delete().eq('user_id', session.user.id)
      removeCheckIn(currentCheckIn.id) // immediately remove from map
      setCurrentCheckIn(null)
    } finally {
      setLoading(false)
    }
  }

  return { currentCheckIn, checkIn, checkOut, loading }
}

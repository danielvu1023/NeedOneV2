import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMapStore } from '@/store/mapStore'
import type { CheckIn, Park } from '@/lib/types'

export function useRealtimeCheckIns() {
  const { setParks, setActiveCheckIns, upsertCheckIn, removeCheckIn } = useMapStore()

  // Initial load
  useEffect(() => {
    async function loadData() {
      // Load parks
      const { data: parksData } = await supabase.from('parks').select('*')
      if (parksData) setParks(parksData as Park[])

      // Load active check-ins
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('check_ins')
        .select('*, profile:profiles!user_id(*), park:parks!park_id(*)')
        .gt('expires_at', now)

      if (data) setActiveCheckIns(data as CheckIn[])
    }
    loadData()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('check_ins_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_ins' },
        async (payload) => {
          // Fetch full check-in with profile + park
          const { data } = await supabase
            .from('check_ins')
            .select('*, profile:profiles!user_id(*), park:parks!park_id(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) upsertCheckIn(data as CheckIn)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'check_ins' },
        (payload) => {
          removeCheckIn(payload.old.id)
        }
      )
      .subscribe()

    // Client-side expiry sweep — runs every 60s as a safety net between cron runs
    const expirySweep = setInterval(() => {
      const now = new Date().toISOString()
      const { activeCheckIns } = useMapStore.getState()
      activeCheckIns
        .filter((c) => c.expires_at <= now)
        .forEach((c) => removeCheckIn(c.id))
    }, 60_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(expirySweep)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

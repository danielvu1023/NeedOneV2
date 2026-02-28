import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useFriendships } from '@/hooks/useFriendships'
import { getDisplayName } from '@/lib/profileUtils'
import type { Profile } from '@/lib/types'

export function useDiscoverPeople() {
  const { session } = useAuth()
  const { friendships } = useFriendships()
  const [search, setSearch] = useState('')
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setLoading(true)
    const run = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .order('first_name')
          .limit(500)
        if (!cancelled) setAllProfiles((data ?? []) as Profile[])
      } catch {
        // silently show empty list on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [session?.user.id])

  const connectedIds = useMemo(() => {
    const ids = new Set<string>()
    if (session) ids.add(session.user.id)
    for (const f of friendships) {
      ids.add(f.requester_id)
      ids.add(f.addressee_id)
    }
    return ids
  }, [friendships, session])

  const people = useMemo(() => {
    const unconnected = (allProfiles ?? []).filter((p) => !connectedIds.has(p.id))
    const q = search.trim().toLowerCase()
    if (!q) return unconnected
    return unconnected.filter((p) => {
      const name = getDisplayName(p).toLowerCase()
      return name.includes(q)
    })
  }, [allProfiles, connectedIds, search])

  return { people, loading, search, setSearch }
}

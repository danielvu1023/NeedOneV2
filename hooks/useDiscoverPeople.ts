import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useFriendships } from '@/hooks/useFriendships'
import { getDisplayName } from '@/lib/profileUtils'
import type { Profile } from '@/lib/types'

async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .not('first_name', 'is', null)
    .order('first_name')
    .limit(500)
  if (error) throw error
  return data ?? []
}

export function useDiscoverPeople() {
  const { session } = useAuth()
  const { friendships } = useFriendships()
  const [search, setSearch] = useState('')

  const { data: allProfiles, isLoading } = useSWR(
    session ? 'discover_people' : null,
    fetchAllProfiles
  )

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

  return { people, loading: isLoading, search, setSearch }
}

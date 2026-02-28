import { useEffect } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Friendship, Profile } from '@/lib/types'

export interface FriendWithProfile extends Friendship {
  requester?: Profile
  addressee?: Profile
}

async function fetchFriendships(userId: string): Promise<FriendWithProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  if (error) throw error
  return data ?? []
}

export function useFriendships() {
  const { session } = useAuth()
  const { data, mutate } = useSWR(
    session ? ['friendships', session.user.id] : null,
    ([, userId]) => fetchFriendships(userId)
  )

  // Realtime: refetch when friendships change
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('friendships_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        mutate()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session, mutate])

  async function sendRequest(addresseeId: string) {
    if (!session) return
    await supabase.from('friendships').insert({
      requester_id: session.user.id,
      addressee_id: addresseeId,
    })
    mutate()
  }

  async function acceptRequest(friendshipId: string) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    mutate()
  }

  async function rejectRequest(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    mutate()
  }

  const friendships = data ?? []
  const accepted = friendships.filter((f) => f.status === 'accepted')
  const pending = friendships.filter(
    (f) => f.status === 'pending' && f.addressee_id === session?.user.id
  )

  return { friendships, accepted, pending, sendRequest, acceptRequest, rejectRequest }
}

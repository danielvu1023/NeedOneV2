import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useFriendships } from '@/hooks/useFriendships'
import { useMapStore } from '@/store/mapStore'
import { formatCheckInDuration } from '@/lib/timeUtils'
import BottomNav from '@/components/BottomNav'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { FriendWithProfile } from '@/hooks/useFriendships'
import type { Profile } from '@/lib/types'

function getOtherProfile(friendship: FriendWithProfile, myId: string) {
  return friendship.requester_id === myId ? friendship.addressee : friendship.requester
}

function Avatar({ profile }: { profile: Profile }) {
  return (
    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.username ?? ''} className="w-full h-full object-cover" />
      ) : (
        <InitialsAvatar username={profile.username ?? '?'} userId={profile.id} size={44} />
      )}
    </div>
  )
}

export default function FriendsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const { accepted, pending, friendships, acceptRequest, rejectRequest, sendRequest } = useFriendships()
  const { activeCheckIns } = useMapStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [session, loading, router])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) { setSearchResults([]); return }

    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${q}%`)
        .neq('id', session?.user.id ?? '')
        .limit(10)
      setSearchResults((data ?? []) as Profile[])
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, session])

  function getFriendStatusForUser(userId: string) {
    const f = friendships.find(
      (f) => f.requester_id === userId || f.addressee_id === userId
    )
    if (!f) return 'none'
    return f.status
  }

  function getCheckIn(userId: string) {
    return activeCheckIns.find((c) => c.user_id === userId) ?? null
  }

  async function handleSendRequest(userId: string) {
    await sendRequest(userId)
    setRequestSent((prev) => new Set(prev).add(userId))
  }

  if (loading || !session) return null

  const showSearch = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-lg mx-auto px-4">
        <div className="pt-14 pb-4">
          <h1 className="text-2xl font-bold mb-4">Friends</h1>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find by username…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {showSearch && (
          <section className="mb-6">
            {searching ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-6">No users found</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((profile) => {
                  const status = getFriendStatusForUser(profile.id)
                  const sent = requestSent.has(profile.id)
                  const checkIn = getCheckIn(profile.id)
                  return (
                    <div key={profile.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3">
                      <Avatar profile={profile} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{profile.username ?? '?'}</p>
                        {checkIn?.park && (
                          <p className="text-zinc-500 text-xs mt-0.5">
                            {checkIn.park.name} · {formatCheckInDuration(checkIn.checked_in_at)}
                          </p>
                        )}
                      </div>
                      {status === 'accepted' ? (
                        <span className="text-green-400 text-xs font-medium">Friends</span>
                      ) : status === 'pending' || sent ? (
                        <span className="text-zinc-500 text-xs">Sent</span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(profile.id)}
                          className="bg-white text-black text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-zinc-100 transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Pending requests */}
        {!showSearch && pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Requests · {pending.length}
            </h2>
            <div className="space-y-2">
              {pending.map((f) => {
                const other = getOtherProfile(f, session.user.id)
                if (!other) return null
                return (
                  <div key={f.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3">
                    <Avatar profile={other} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{other.username ?? '?'}</p>
                      <p className="text-zinc-500 text-xs">wants to be friends</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => rejectRequest(f.id)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button onClick={() => acceptRequest(f.id)} className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-400 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Friends list */}
        {!showSearch && (
          <section>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Friends · {accepted.length}
            </h2>
            {accepted.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-zinc-600 text-sm">No friends yet</p>
                <p className="text-zinc-700 text-xs mt-1">Search by username above, or tap a head on the map</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accepted.map((f) => {
                  const other = getOtherProfile(f, session.user.id)
                  if (!other) return null
                  const checkIn = getCheckIn(other.id)
                  return (
                    <div key={f.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3">
                      <div className="relative flex-shrink-0">
                        <Avatar profile={other} />
                        {checkIn && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{other.username ?? '?'}</p>
                        {checkIn?.park ? (
                          <p className="text-green-400 text-xs mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />
                            {checkIn.park.name} · {formatCheckInDuration(checkIn.checked_in_at)}
                          </p>
                        ) : (
                          <p className="text-zinc-600 text-xs mt-0.5">Not at a park</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

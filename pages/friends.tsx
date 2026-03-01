import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { useFriendships } from '@/hooks/useFriendships'
import { useDiscoverPeople } from '@/hooks/useDiscoverPeople'
import { useMapStore } from '@/store/mapStore'
import { formatCheckInDuration } from '@/lib/timeUtils'
import { getDisplayName } from '@/lib/profileUtils'
import BottomNav from '@/components/BottomNav'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { FriendWithProfile } from '@/hooks/useFriendships'
import type { Profile } from '@/lib/types'

function getOtherProfile(friendship: FriendWithProfile, myId: string) {
  return friendship.requester_id === myId ? friendship.addressee : friendship.requester
}

function Avatar({ profile }: { profile: Profile }) {
  const displayName = getDisplayName(profile)
  return (
    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
      ) : (
        <InitialsAvatar name={displayName} userId={profile.id} size={44} />
      )}
    </div>
  )
}

export default function FriendsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const { accepted, pending, friendships, acceptRequest, rejectRequest, sendRequest } = useFriendships()
  const { people: discoverPeople, loading: discoverLoading, search: discoverSearch, setSearch: setDiscoverSearch } = useDiscoverPeople()
  const { activeCheckIns } = useMapStore()
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [session, loading, router])

  function getCheckIn(userId: string) {
    return activeCheckIns.find((c) => c.user_id === userId) ?? null
  }

  async function handleSendRequest(userId: string) {
    await sendRequest(userId)
    setRequestSent((prev) => new Set(prev).add(userId))
  }

  // Check if other user already sent me a request (to show Accept button in discovery)
  function getInboundRequest(userId: string) {
    return pending.find((f) => f.requester_id === userId) ?? null
  }

  function getDiscoverButtonState(userId: string) {
    const sent = requestSent.has(userId)
    const existing = friendships.find(
      (f) => f.requester_id === userId || f.addressee_id === userId
    )
    if (sent || existing?.status === 'pending') return 'sent'
    if (existing?.status === 'accepted') return 'friends'
    return 'add'
  }

  if (loading || !session) return null

  return (
    <div className="flex flex-col bg-sage text-forest" style={{ height: '100dvh' }}>
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4">
        <div className="pb-4" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}>
          <h1 className="text-2xl font-display font-bold mb-4">Friends</h1>

          {/* Pending requests */}
          {pending.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-display font-bold text-moss uppercase tracking-wider mb-3">
                Requests · {pending.length}
              </h2>
              <div className="space-y-2">
                {pending.map((f) => {
                  const other = getOtherProfile(f, session.user.id)
                  if (!other) return null
                  const displayName = getDisplayName(other)
                  return (
                    <div key={f.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                      <Avatar profile={other} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-forest">{displayName}</p>
                        <p className="text-moss text-xs">wants to be friends</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => rejectRequest(f.id)} className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-moss hover:text-forest transition-colors">
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
          <section className="mb-8">
            <h2 className="text-xs font-display font-bold text-moss uppercase tracking-wider mb-3">
              Friends · {accepted.length}
            </h2>
            {accepted.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-moss text-sm">No friends yet — find people below</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accepted.map((f) => {
                  const other = getOtherProfile(f, session.user.id)
                  if (!other) return null
                  const displayName = getDisplayName(other)
                  const checkIn = getCheckIn(other.id)
                  return (
                    <div key={f.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                      <div className="relative flex-shrink-0">
                        <Avatar profile={other} />
                        {checkIn && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-forest">{displayName}</p>
                        {checkIn?.park ? (
                          <p className="text-green-600 text-xs mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-green-500 inline-block" />
                            {checkIn.park.name} · {formatCheckInDuration(checkIn.checked_in_at)}
                          </p>
                        ) : (
                          <p className="text-moss text-xs mt-0.5">Not at a park</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Find Friends */}
          <section>
            <h2 className="text-xs font-display font-bold text-moss uppercase tracking-wider mb-3">Find Friends</h2>
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full bg-white border border-sage-mid rounded-xl pl-9 pr-4 py-2.5 text-sm text-forest placeholder-moss focus:outline-none focus:border-moss transition-colors"
              />
              {discoverSearch && (
                <button onClick={() => setDiscoverSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-moss">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {discoverLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-sage-mid border-t-forest rounded-full animate-spin" />
              </div>
            ) : discoverPeople.length === 0 ? (
              <p className="text-moss text-sm text-center py-6">
                {discoverSearch ? 'No one found' : 'No new people to discover'}
              </p>
            ) : (
              <div className="space-y-2">
                {discoverPeople.map((person) => {
                  const displayName = getDisplayName(person)
                  const btnState = getDiscoverButtonState(person.id)
                  const inboundReq = getInboundRequest(person.id)
                  return (
                    <div key={person.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <InitialsAvatar name={displayName} userId={person.id} size={44} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-forest truncate">{displayName}</p>
                        {getCheckIn(person.id)?.park && (
                          <p className="text-moss text-xs mt-0.5">
                            {getCheckIn(person.id)!.park!.name} · {formatCheckInDuration(getCheckIn(person.id)!.checked_in_at)}
                          </p>
                        )}
                      </div>
                      {btnState === 'friends' ? (
                        <span className="text-green-600 text-xs font-medium">Friends</span>
                      ) : btnState === 'sent' ? (
                        <span className="text-moss text-xs">Sent ✓</span>
                      ) : inboundReq ? (
                        <button
                          onClick={() => acceptRequest(inboundReq.id)}
                          className="bg-green-500 text-forest text-xs font-display font-bold rounded-lg px-3 py-1.5 hover:bg-green-400 transition-colors"
                        >
                          Accept
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(person.id)}
                          className="bg-green-500 text-forest text-xs font-display font-bold rounded-lg px-3 py-1.5 hover:bg-green-400 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
      </div>

      <BottomNav />
    </div>
  )
}

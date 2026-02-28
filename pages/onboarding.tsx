import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useFriendships } from '@/hooks/useFriendships'
import { useDiscoverPeople } from '@/hooks/useDiscoverPeople'
import InitialsAvatar from '@/components/InitialsAvatar'
import InstallBanner from '@/components/InstallBanner'
import { getDisplayName } from '@/lib/profileUtils'

export default function OnboardingPage() {
  const { session, profile, loading } = useAuth()
  const router = useRouter()
  const { sendRequest, friendships } = useFriendships()
  const { people, loading: discoverLoading, search, setSearch } = useDiscoverPeople()
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set())
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [session, loading, router])

  useEffect(() => {
    if (!loading && profile?.onboarding_completed) {
      router.replace('/')
    }
  }, [loading, profile, router])

  async function handleAddFriend(userId: string) {
    await sendRequest(userId)
    setRequestSent((prev) => new Set(prev).add(userId))
  }

  async function handleContinue() {
    if (!session) return
    setCompleting(true)
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', session.user.id)
    router.replace('/')
  }

  function getButtonState(userId: string) {
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
    <div className="min-h-screen bg-sage flex flex-col" style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))' }}>
      {/* Header */}
      <div className="px-6 pt-16 pb-6">
        <h1 className="text-3xl font-display font-bold text-forest leading-tight">Find your fourth.</h1>
        <p className="text-moss text-sm mt-2">See who&apos;s already on NeedOne</p>
      </div>

      {/* PWA install nudge */}
      <InstallBanner />

      {/* Search */}
      <div className="px-6 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full bg-white border border-sage-mid rounded-xl pl-9 pr-4 py-2.5 text-sm text-forest placeholder-moss focus:outline-none focus:border-moss transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-moss">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto px-6">
        {discoverLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-sage-mid border-t-forest rounded-full animate-spin" />
          </div>
        ) : people.length === 0 ? (
          <p className="text-moss text-sm text-center py-10">
            {search ? 'No one found' : 'No one to discover yet'}
          </p>
        ) : (
          <div className="space-y-2">
            {people.map((person) => {
              const displayName = getDisplayName(person)
              const btnState = getButtonState(person.id)
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
                  </div>
                  {btnState === 'friends' ? (
                    <span className="text-green-600 text-xs font-medium">Friends</span>
                  ) : btnState === 'sent' ? (
                    <span className="text-moss text-xs">Sent ✓</span>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(person.id)}
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
      </div>

      {/* Pinned Continue button */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 bg-sage border-t border-sage-mid"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleContinue}
          disabled={completing}
          className="w-full mt-4 bg-forest text-court font-display font-bold rounded-xl py-3.5 text-sm hover:bg-forest/90 transition-colors disabled:opacity-50"
        >
          {completing ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

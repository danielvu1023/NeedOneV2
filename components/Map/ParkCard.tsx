import BottomSheet from '@/components/BottomSheet'
import InitialsAvatar from '@/components/InitialsAvatar'
import { getDisplayName } from '@/lib/profileUtils'
import { formatCheckInDuration } from '@/lib/timeUtils'
import { useAuth } from '@/hooks/useAuth'
import { useFriendships } from '@/hooks/useFriendships'
import type { Park, CheckIn } from '@/lib/types'

interface ParkCardProps {
  park: Park | null
  checkIns: CheckIn[]
  isCheckedIn: boolean
  currentParkId: string | null
  onCheckIn: () => void
  onCheckOut: () => void
  onClose: () => void
  // Player detail view
  selectedCheckIn: CheckIn | null
  onPlayerTap: (checkIn: CheckIn) => void
  onBackFromPlayer: () => void
}

export default function ParkCard({
  park,
  checkIns,
  isCheckedIn,
  currentParkId,
  onCheckIn,
  onCheckOut,
  onClose,
  selectedCheckIn,
  onPlayerTap,
  onBackFromPlayer,
}: ParkCardProps) {
  const { session } = useAuth()
  const { friendships, sendRequest } = useFriendships()

  if (!park) return null

  const isCheckedInHere = isCheckedIn && currentParkId === park.id
  const playerCount = checkIns.length

  function getFriendStatus(userId: string): 'self' | 'accepted' | 'pending' | 'none' {
    if (!session) return 'none'
    if (userId === session.user.id) return 'self'
    const f = friendships.find(
      (f) => f.requester_id === userId || f.addressee_id === userId
    )
    if (!f) return 'none'
    return f.status as 'pending' | 'accepted'
  }

  const showPlayer = !!selectedCheckIn

  return (
    <BottomSheet open={!!park} onClose={onClose}>
      {showPlayer ? (
        /* ── Player detail view ─────────────────────── */
        (() => {
          const profile = selectedCheckIn.profile
          const displayName = getDisplayName(profile)
          const friendStatus = getFriendStatus(selectedCheckIn.user_id)
          return (
            <div className="flex flex-col" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
              {/* Header row */}
              <div className="flex items-center justify-between px-5 pt-3 pb-4">
                <button
                  onClick={onBackFromPlayer}
                  className="flex items-center gap-1.5 text-moss hover:text-forest transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">{park.name}</span>
                </button>
                <button onClick={onClose} className="text-moss hover:text-forest transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Profile row */}
              <div className="flex items-center gap-4 px-5 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <InitialsAvatar name={displayName} userId={selectedCheckIn.user_id} size={64} />
                  )}
                </div>
                <div>
                  <p className="text-forest text-lg font-display font-bold leading-tight">{displayName}</p>
                  <p className="text-moss text-sm mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {park.name}
                    <span className="text-sage-mid">·</span>
                    {formatCheckInDuration(selectedCheckIn.checked_in_at)}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="px-5">
                {friendStatus === 'self' ? (
                  <p className="text-moss text-sm text-center py-2">That&apos;s you!</p>
                ) : friendStatus === 'accepted' ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm py-2 font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Already friends
                  </div>
                ) : friendStatus === 'pending' ? (
                  <button disabled className="w-full bg-sage border border-sage-mid text-moss rounded-xl py-4 text-sm font-display font-bold tracking-wide">
                    Request sent ✓
                  </button>
                ) : (
                  <button
                    onClick={() => { sendRequest(selectedCheckIn.user_id); onBackFromPlayer() }}
                    className="w-full bg-forest text-court rounded-xl py-4 text-sm font-display font-bold tracking-wide hover:bg-forest/90 transition-colors"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            </div>
          )
        })()
      ) : (
        /* ── Park list view ─────────────────────────── */
        <>
          {/* Fixed header */}
          <div className="px-5 pt-3 pb-3 border-b border-sage-mid/60">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-forest text-lg font-display font-bold leading-tight">{park.name}</h2>
                {park.description && (
                  <p className="text-moss text-xs mt-0.5 truncate">{park.description}</p>
                )}
              </div>
              <button onClick={onClose} className="text-moss hover:text-forest transition-colors p-1 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${playerCount > 0 ? 'bg-green-500' : 'bg-sage-mid'}`} />
              <span className="text-forest/60 text-xs">
                {playerCount === 0 ? 'No one here right now' : `${playerCount} player${playerCount === 1 ? '' : 's'} here`}
              </span>
            </div>
          </div>

          {/* Scrollable player list */}
          <div className="overflow-y-auto" style={{ maxHeight: '38vh' }}>
            {playerCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-6">
                <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-moss text-sm text-center">Be the first to check in</p>
              </div>
            ) : (
              <div className="py-2">
                {checkIns.map((ci) => {
                  const displayName = getDisplayName(ci.profile)
                  return (
                    <button
                      key={ci.id}
                      onClick={() => onPlayerTap(ci)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-sage/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {ci.profile?.avatar_url ? (
                          <img src={ci.profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <InitialsAvatar name={displayName} userId={ci.user_id} size={40} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-forest text-sm font-medium truncate">{displayName}</p>
                        <p className="text-moss text-xs mt-0.5">{formatCheckInDuration(ci.checked_in_at)}</p>
                      </div>
                      <svg className="w-4 h-4 text-sage-mid flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pinned action button */}
          <div className="px-5 pt-3 border-t border-sage-mid/60" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            {isCheckedInHere ? (
              <button
                onClick={() => { onCheckOut(); onClose() }}
                className="w-full bg-white border-2 border-forest text-forest rounded-xl py-3.5 text-sm font-display font-bold tracking-wide hover:bg-sage transition-colors"
              >
                Check Out
              </button>
            ) : isCheckedIn ? (
              <button
                onClick={() => { onCheckIn(); onClose() }}
                className="w-full bg-green-500 text-forest rounded-xl py-3.5 text-sm font-display font-bold tracking-wide hover:bg-green-400 transition-colors"
              >
                Move Here
              </button>
            ) : (
              <button
                onClick={() => { onCheckIn(); onClose() }}
                className="w-full bg-green-500 text-forest rounded-xl py-3.5 text-sm font-display font-bold tracking-wide hover:bg-green-400 transition-colors"
              >
                Check In
              </button>
            )}
          </div>
        </>
      )}
    </BottomSheet>
  )
}

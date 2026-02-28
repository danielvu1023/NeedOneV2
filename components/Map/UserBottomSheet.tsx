import InitialsAvatar from '@/components/InitialsAvatar'
import { formatCheckInDuration } from '@/lib/timeUtils'
import type { CheckIn } from '@/lib/types'

interface UserBottomSheetProps {
  checkIn: CheckIn | null
  onClose: () => void
  onBack: () => void   // returns to park card
  onAddFriend: (userId: string) => void
  friendStatus: 'none' | 'pending' | 'accepted' | 'self'
}

export default function UserBottomSheet({
  checkIn,
  onClose,
  onBack,
  onAddFriend,
  friendStatus,
}: UserBottomSheetProps) {
  const profile = checkIn?.profile

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${checkIn ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-zinc-700" />
      </div>

      {profile && (
        <div className="px-5 pb-8 pt-2">
          {/* Header row: back + close */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username ?? ''} className="w-full h-full object-cover" />
              ) : (
                <InitialsAvatar username={profile.username ?? '?'} userId={profile.id} size={64} />
              )}
            </div>
            <div>
              <p className="text-white text-lg font-bold leading-tight">{profile.username ?? 'Anonymous'}</p>
              {checkIn?.park && (
                <p className="text-zinc-400 text-sm mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {checkIn.park.name}
                  <span className="text-zinc-600">·</span>
                  <span>{formatCheckInDuration(checkIn.checked_in_at)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action */}
          {friendStatus === 'self' ? (
            <p className="text-zinc-500 text-sm text-center py-2">That&apos;s you!</p>
          ) : friendStatus === 'accepted' ? (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Already friends
            </div>
          ) : friendStatus === 'pending' ? (
            <button disabled className="w-full bg-zinc-800 text-zinc-500 rounded-xl py-3.5 text-sm font-medium">
              Request sent
            </button>
          ) : (
            <button
              onClick={() => { onAddFriend(profile.id); onClose() }}
              className="w-full bg-white text-black rounded-xl py-3.5 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Add friend
            </button>
          )}
        </div>
      )}
    </div>
  )
}

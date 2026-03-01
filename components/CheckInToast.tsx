import { useEffect, useState } from 'react'
import InitialsAvatar from '@/components/InitialsAvatar'
import { getDisplayName } from '@/lib/profileUtils'
import { useMapStore } from '@/store/mapStore'

export default function CheckInToast() {
  const { pendingToast, setPendingToast } = useMapStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!pendingToast) { setVisible(false); return }
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setPendingToast(null), 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [pendingToast, setPendingToast])

  if (!pendingToast) return null

  const profile = pendingToast.profile
  const displayName = getDisplayName(profile)
  const parkName = pendingToast.park?.name ?? 'a park'

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => setPendingToast(null), 300) }}
      className={`absolute left-4 right-4 z-40 cursor-pointer transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      style={{ top: 'max(4.5rem, calc(env(safe-area-inset-top) + 4rem))' }}
    >
      <div className="bg-white rounded-2xl shadow-lg border border-sage-mid px-4 py-3 flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <InitialsAvatar name={displayName} userId={pendingToast.user_id} size={40} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-forest text-sm font-semibold leading-tight truncate">
            {displayName}
          </p>
          <p className="text-moss text-xs mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-court inline-block flex-shrink-0" />
            Checked in at {parkName}
          </p>
        </div>
      </div>
    </div>
  )
}

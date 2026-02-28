import { Marker } from 'react-map-gl'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { CheckIn } from '@/lib/types'

interface AvatarHeadProps {
  checkIn: CheckIn
  lat: number
  lng: number
  isFriend?: boolean
  isSelf?: boolean
  onClick: (checkIn: CheckIn) => void
}

export default function AvatarHead({ checkIn, lat, lng, isFriend, isSelf, onClick }: AvatarHeadProps) {
  const profile = checkIn.profile

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onClick(checkIn)
      }}
    >
      <div className="cursor-pointer hover:scale-110 transition-transform">
        <div
          className="w-11 h-11 rounded-full border-2 overflow-hidden"
          style={isSelf ? {
            borderColor: '#3b82f6',
            boxShadow: '0 0 0 2px #3b82f6, 0 0 12px 4px rgba(59, 130, 246, 0.5)',
          } : isFriend ? {
            borderColor: '#22c55e',
            boxShadow: '0 0 0 2px #22c55e, 0 0 12px 4px rgba(34, 197, 94, 0.5)',
          } : {
            borderColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4)',
          }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <InitialsAvatar
              username={profile?.username ?? '?'}
              userId={checkIn.user_id}
              size={44}
            />
          )}
        </div>
        <div
          className="w-0 h-0 mx-auto"
          style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${isSelf ? '#3b82f6' : isFriend ? '#22c55e' : 'white'}`,
          }}
        />
      </div>
    </Marker>
  )
}

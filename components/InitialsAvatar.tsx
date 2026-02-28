import { getInitials, getAvatarColor } from '@/lib/avatarUtils'

interface InitialsAvatarProps {
  username: string
  userId: string
  size?: number
  className?: string
}

export default function InitialsAvatar({ username, userId, size = 40, className = '' }: InitialsAvatarProps) {
  const bg = getAvatarColor(userId)
  const initials = getInitials(username)

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  )
}

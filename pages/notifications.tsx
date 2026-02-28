import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useFriendships } from '@/hooks/useFriendships'
import InitialsAvatar from '@/components/InitialsAvatar'
import BottomNav from '@/components/BottomNav'
import { getDisplayName } from '@/lib/profileUtils'
import type { Notification } from '@/lib/types'

function NotificationItem({
  notification,
  onAccept,
  onReject,
}: {
  notification: Notification
  onAccept?: () => void
  onReject?: () => void
}) {
  const actor = notification.actor
  const displayName = getDisplayName(actor)
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  let message = ''
  if (notification.type === 'friend_request') message = 'sent you a friend request'
  if (notification.type === 'friend_accepted') message = 'accepted your friend request'
  if (notification.type === 'friend_checkin') message = `checked in at ${notification.park?.name ?? 'a park'}`

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${notification.read ? 'bg-white/50' : 'bg-white'}`}>
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        {actor?.avatar_url ? (
          <img src={actor.avatar_url} alt={displayName} className="w-full h-full object-cover" />
        ) : actor ? (
          <InitialsAvatar name={displayName} userId={actor.id} size={40} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-sage-mid" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-forest text-sm">
          <span className="font-semibold">{displayName}</span>{' '}
          <span className="text-moss">{message}</span>
        </p>
        <p className="text-moss text-xs mt-0.5">{timeAgo}</p>

        {notification.type === 'friend_request' && onAccept && onReject && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onReject}
              className="flex-1 bg-sage text-moss rounded-lg py-2 text-xs font-medium hover:bg-sage-mid transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 bg-green-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-green-400 transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-rally flex-shrink-0 mt-1.5" />
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const { notifications, markRead, markAllRead } = useNotifications()
  const { pending, acceptRequest, rejectRequest } = useFriendships()

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [session, loading, router])

  // Map pending friendship to notification for accept/reject actions
  function getFriendshipId(actorId: string | null) {
    if (!actorId) return null
    return pending.find((f) => f.requester_id === actorId)?.id ?? null
  }

  if (loading || !session) return null

  return (
    <div className="min-h-screen bg-sage text-forest pb-nav">
      <div className="max-w-lg mx-auto px-4">
        <div className="pb-4 flex items-center justify-between" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}>
          <h1 className="text-2xl font-display font-bold">Notifications</h1>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-moss text-sm hover:text-forest transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-moss text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const friendshipId = n.type === 'friend_request' ? getFriendshipId(n.actor_id) : null
              return (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onAccept={
                    friendshipId
                      ? async () => { await acceptRequest(friendshipId); await markRead(n.id) }
                      : undefined
                  }
                  onReject={
                    friendshipId
                      ? async () => { await rejectRequest(friendshipId); await markRead(n.id) }
                      : undefined
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

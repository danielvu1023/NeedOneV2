import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useFriendships } from '@/hooks/useFriendships'
import InitialsAvatar from '@/components/InitialsAvatar'
import BottomNav from '@/components/BottomNav'
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
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  let message = ''
  if (notification.type === 'friend_request') message = 'sent you a friend request'
  if (notification.type === 'friend_accepted') message = 'accepted your friend request'
  if (notification.type === 'friend_checkin') message = `checked in at ${notification.park?.name ?? 'a park'}`

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${notification.read ? 'bg-zinc-900/50' : 'bg-zinc-900'}`}>
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        {actor?.avatar_url ? (
          <img src={actor.avatar_url} alt={actor.username ?? ''} className="w-full h-full object-cover" />
        ) : actor ? (
          <InitialsAvatar username={actor.username ?? '?'} userId={actor.id} size={40} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-700" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          <span className="font-semibold">{actor?.username ?? 'Someone'}</span>{' '}
          <span className="text-zinc-300">{message}</span>
        </p>
        <p className="text-zinc-500 text-xs mt-0.5">{timeAgo}</p>

        {notification.type === 'friend_request' && onAccept && onReject && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onReject}
              className="flex-1 bg-zinc-800 text-zinc-300 rounded-lg py-2 text-xs font-medium hover:bg-zinc-700 transition-colors"
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
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
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
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-lg mx-auto px-4">
        <div className="pt-14 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-zinc-400 text-sm hover:text-white transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">No notifications yet</p>
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

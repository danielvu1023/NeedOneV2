import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

let webpush: typeof import('web-push') | null = null
try {
  webpush = require('web-push')
  if (webpush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@needone.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }
} catch {
  // web-push optional
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify Bearer JWT
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.slice(7)

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = user.id
  const { parkId } = req.body

  if (!parkId || !UUID_RE.test(parkId)) return res.status(400).json({ error: 'Invalid parkId' })

  // Fetch actor name + park name
  const [profileResult, parkResult] = await Promise.all([
    supabaseServer.from('profiles').select('first_name').eq('id', userId).single(),
    supabaseServer.from('parks').select('name').eq('id', parkId).single(),
  ])

  const actorName = profileResult.data?.first_name ?? 'Someone'
  const parkName = parkResult.data?.name ?? 'a park'

  // Fetch accepted friends
  const { data: friendships } = await supabaseServer
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (!friendships || friendships.length === 0) return res.status(200).json({ notified: 0 })

  const friendIds = friendships.map((f) => f.requester_id === userId ? f.addressee_id : f.requester_id)

  const title = `${actorName.slice(0, 50)} is at ${parkName.slice(0, 50)}`
  const body = 'They just checked in'
  const safeTitle = title.slice(0, 100)
  const safeBody = body.slice(0, 200)
  const payload = webpush ? JSON.stringify({ title: safeTitle, body: safeBody, url: '/' }) : null

  let notified = 0

  await Promise.allSettled(
    friendIds.map(async (friendId) => {
      // Insert in-app notification
      await supabaseServer.from('notifications').insert({
        type: 'friend_checkin',
        user_id: friendId,
        actor_id: userId,
        park_id: parkId,
        read: false,
      })

      // Send push notification if available
      if (!webpush || !payload) return

      const { data: subs } = await supabaseServer
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', friendId)

      if (!subs || subs.length === 0) return

      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush!.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          } catch (err: unknown) {
            if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
              await supabaseServer.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
          }
        })
      )

      notified++
    })
  )

  return res.status(200).json({ notified })
}

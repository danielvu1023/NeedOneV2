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

  const requesterId = user.id
  const { addresseeId } = req.body

  if (!addresseeId || !UUID_RE.test(addresseeId)) {
    return res.status(400).json({ error: 'Invalid addresseeId' })
  }

  // Fetch requester's name
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('first_name')
    .eq('id', requesterId)
    .single()

  const requesterName = profile?.first_name ?? 'Someone'

  // Insert in-app notification
  await supabaseServer.from('notifications').insert({
    type: 'friend_request',
    user_id: addresseeId,
    actor_id: requesterId,
    read: false,
  })

  // Send push notification if available
  if (!webpush) return res.status(200).json({ notified: 0, warning: 'web-push not installed' })

  const { data: subs } = await supabaseServer
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', addresseeId)

  if (!subs || subs.length === 0) return res.status(200).json({ notified: 0 })

  const payload = JSON.stringify({
    title: `${requesterName.slice(0, 50)} wants to be friends`,
    body: 'Tap to accept their request',
    url: '/friends',
  })

  let notified = 0
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush!.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        notified++
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          await supabaseServer.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    })
  )

  return res.status(200).json({ notified })
}

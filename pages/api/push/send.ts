import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

// Requires: npm install web-push
// And VAPID keys in .env.local:
//   VAPID_PUBLIC_KEY=...
//   VAPID_PRIVATE_KEY=...
//   VAPID_SUBJECT=mailto:you@example.com
// Generate keys: npx web-push generate-vapid-keys

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
  console.warn('web-push not installed — push notifications disabled. Run: npm install web-push')
}

const COOLDOWN_MS = 60 * 1000 // 1 minute cooldown per notifier→recipient pair
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isRelativePath(u: unknown): boolean {
  return typeof u === 'string' && u.startsWith('/') && !u.startsWith('//')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Internal only — verify service role key
  const secret = req.headers['x-service-key']
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { userId, notifierId, title, body, url } = req.body

  if (!userId || !UUID_RE.test(userId)) return res.status(400).json({ error: 'Invalid userId' })
  if (notifierId && !UUID_RE.test(notifierId)) return res.status(400).json({ error: 'Invalid notifierId' })

  // Sanitise push payload fields
  const safeTitle = typeof title === 'string' ? title.slice(0, 100) : 'NeedOne'
  const safeBody = typeof body === 'string' ? body.slice(0, 200) : ''
  const safeUrl = isRelativePath(url) ? url : '/'

  // Rate limiting: if notifierId provided, check cooldown
  if (notifierId) {
    const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString()
    const { data: cooldown } = await supabaseServer
      .from('push_cooldowns')
      .select('sent_at')
      .eq('notifier_id', notifierId)
      .eq('recipient_id', userId)
      .single()

    if (cooldown && cooldown.sent_at > cutoff) {
      return res.status(200).json({ sent: 0, skipped: 'cooldown' })
    }
  }

  // Get all push subscriptions for this user
  const { data: subs } = await supabaseServer
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 })

  if (!webpush) {
    return res.status(200).json({ sent: 0, warning: 'web-push not installed' })
  }

  const payload = JSON.stringify({ title: safeTitle, body: safeBody, url: safeUrl })
  let sent = 0

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush!.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        // Remove invalid subscriptions
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          await supabaseServer.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    })
  )

  // Update cooldown record after successful send
  if (notifierId && sent > 0) {
    await supabaseServer
      .from('push_cooldowns')
      .upsert({ notifier_id: notifierId, recipient_id: userId, sent_at: new Date().toISOString() })
  }

  return res.status(200).json({ sent })
}

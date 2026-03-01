import type { NextApiRequest, NextApiResponse } from 'next'
import webPush from 'web-push'
import { supabaseServer } from '@/lib/supabaseServer'

const tag = '[push-test/send-db]'

const vapidSubject = process.env.VAPID_SUBJECT
const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY

if (!vapidSubject || !vapidPublic || !vapidPrivate) {
  console.error(tag, 'VAPID env vars missing — check .env.local')
} else {
  webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })
  if (!UUID_RE.test(user.id)) return res.status(400).json({ error: 'Invalid user id' })

  const { title = 'needone', body = 'Test push from needonev2!' } = req.body ?? {}
  const safeTitle = String(title).slice(0, 100)
  const safeBody = String(body).slice(0, 200)

  // Read subscriptions from DB
  const { data: subs, error: dbError } = await supabaseServer
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)
    .limit(20)

  if (dbError) return res.status(500).json({ error: dbError.message })

  const total = subs?.length ?? 0
  console.log(tag, `sending "${safeTitle}" to ${total} subscription(s) for user ${user.id.slice(0, 8)}…`)

  if (total === 0) {
    return res.status(400).json({ error: 'No subscriptions found in DB for this user', total: 0 })
  }

  const results: { ok: boolean; endpoint: string; statusCode?: number; error?: string }[] = []
  const staleEndpoints: string[] = []

  await Promise.allSettled(
    (subs ?? []).map(async (row) => {
      const sub: webPush.PushSubscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }
      const short = '…' + row.endpoint.slice(-40)
      try {
        const response = await webPush.sendNotification(
          sub,
          JSON.stringify({ title: safeTitle, body: safeBody, url: '/' })
        ) as { statusCode: number }
        console.log(tag, `✓ sent to ${short} | status: ${response.statusCode}`)
        results.push({ ok: true, endpoint: short, statusCode: response.statusCode })
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string }
        if (e.statusCode === 410) {
          console.warn(tag, `✗ 410 Gone — removing stale sub ${short}`)
          staleEndpoints.push(row.endpoint)
        } else {
          console.error(tag, `✗ failed ${short} | status: ${e.statusCode} | ${e.message}`)
        }
        results.push({ ok: false, endpoint: short, statusCode: e.statusCode, error: e.message })
      }
    })
  )

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await supabaseServer
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
    console.log(tag, `removed ${staleEndpoints.length} stale sub(s)`)
  }

  console.log(tag, 'done —', results.filter(r => r.ok).length, 'ok,', results.filter(r => !r.ok).length, 'failed')
  return res.status(200).json({ results, total, staleRemoved: staleEndpoints.length })
}

import type { NextApiRequest, NextApiResponse } from 'next'
import webPush from 'web-push'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), '.push-test-subscriptions.json')
const tag = '[push-test/send]'

type SubRecord = Record<string, webPush.PushSubscription>

function readSubs(): SubRecord {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch { return {} }
}
function writeSubs(subs: SubRecord) {
  fs.writeFileSync(DB_PATH, JSON.stringify(subs, null, 2))
}

const vapidSubject = process.env.VAPID_SUBJECT
const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY

if (!vapidSubject || !vapidPublic || !vapidPrivate) {
  console.error(tag, 'VAPID env vars missing — check .env.local')
} else {
  webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  console.log(tag, 'VAPID configured. Public key prefix:', vapidPublic.slice(0, 12) + '…')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { title = 'needone', body = 'Test push from needonev2!' } = req.body ?? {}
  const subs = readSubs()
  const entries = Object.values(subs)

  console.log(tag, `sending "${title}" to ${entries.length} subscription(s)`)

  if (entries.length === 0) {
    console.warn(tag, 'no subscriptions found')
    return res.status(400).json({ error: 'No subscriptions stored' })
  }

  const results: { ok: boolean; endpoint: string; statusCode?: number; error?: string }[] = []
  const staleEndpoints: string[] = []

  await Promise.allSettled(
    entries.map(async (sub) => {
      const short = '…' + sub.endpoint.slice(-40)
      try {
        const response = await webPush.sendNotification(sub, JSON.stringify({ title, body, url: '/' })) as { statusCode: number }
        console.log(tag, `✓ sent to ${short} | status: ${response.statusCode}`)
        results.push({ ok: true, endpoint: short, statusCode: response.statusCode })
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string }
        if (e.statusCode === 410) {
          console.warn(tag, `✗ 410 Gone — removing stale sub ${short}`)
          staleEndpoints.push(sub.endpoint)
        } else {
          console.error(tag, `✗ failed ${short} | status: ${e.statusCode} | ${e.message}`)
        }
        results.push({ ok: false, endpoint: short, statusCode: e.statusCode, error: e.message })
      }
    })
  )

  if (staleEndpoints.length > 0) {
    const fresh = readSubs()
    for (const ep of staleEndpoints) delete fresh[ep]
    writeSubs(fresh)
    console.log(tag, `removed ${staleEndpoints.length} stale sub(s), ${Object.keys(fresh).length} remaining`)
  }

  console.log(tag, 'done —', results.filter(r => r.ok).length, 'ok,', results.filter(r => !r.ok).length, 'failed')
  return res.status(200).json({ results, staleRemoved: staleEndpoints.length })
}

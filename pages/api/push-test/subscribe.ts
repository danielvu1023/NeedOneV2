import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// File-based storage — no Supabase, for isolated push testing only
const DB_PATH = path.join(process.cwd(), '.push-test-subscriptions.json')
const tag = '[push-test/subscribe]'

function readSubs(): Record<string, object> {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch { return {} }
}
function writeSubs(subs: Record<string, object>) {
  fs.writeFileSync(DB_PATH, JSON.stringify(subs, null, 2))
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const sub = req.body
    if (!sub?.endpoint) {
      console.error(tag, 'missing endpoint. body:', JSON.stringify(req.body))
      return res.status(400).json({ error: 'Missing endpoint' })
    }
    if (!sub?.keys?.p256dh || !sub?.keys?.auth) {
      console.error(tag, 'missing keys:', JSON.stringify(Object.keys(sub.keys ?? {})))
      return res.status(400).json({ error: 'Missing keys (p256dh / auth)' })
    }

    const subs = readSubs()
    const isNew = !subs[sub.endpoint]
    subs[sub.endpoint] = sub
    writeSubs(subs)

    const total = Object.keys(subs).length
    console.log(
      tag, isNew ? 'NEW subscription' : 'refreshed subscription',
      `| endpoint: …${sub.endpoint.slice(-40)}`,
      `| p256dh: ${sub.keys.p256dh.slice(0, 12)}…`,
      `| total: ${total}`
    )
    return res.status(200).json({ ok: true, total })
  }

  if (req.method === 'GET') {
    const total = Object.keys(readSubs()).length
    console.log(tag, 'GET — total:', total)
    return res.status(200).json({ total })
  }

  return res.status(405).end()
}

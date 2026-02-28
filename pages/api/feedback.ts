import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

const VALID_CATEGORIES = ['bug', 'feature', 'feedback'] as const
type Category = typeof VALID_CATEGORIES[number]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { category, message } = req.body

  // Validate category
  if (!VALID_CATEGORIES.includes(category as Category)) {
    return res.status(400).json({ error: 'Invalid category' })
  }

  // Validate message
  const safeMessage = typeof message === 'string' ? message.trim().slice(0, 2000) : ''
  if (!safeMessage) return res.status(400).json({ error: 'Message required' })

  // Resolve user from Bearer token if present (optional — feedback can be anonymous)
  let userId: string | null = null
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabaseServer.auth.getUser(token)
    userId = user?.id ?? null
  }

  const { error } = await supabaseServer.from('feedback').insert({
    user_id: userId,
    category,
    message: safeMessage,
  })

  if (error) return res.status(500).json({ error: 'Failed to submit' })

  return res.status(200).json({ ok: true })
}

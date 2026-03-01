import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

type Category = 'bug' | 'feature' | 'feedback'

const CATEGORIES: { id: Category; label: string; hint: string }[] = [
  { id: 'bug', label: 'Bug', hint: 'Something is broken' },
  { id: 'feature', label: 'Idea', hint: 'A feature request' },
  { id: 'feedback', label: 'Feedback', hint: 'General thoughts' },
]

const PLACEHOLDERS: Record<Category, string> = {
  bug: 'Describe what happened and what you expected…',
  feature: "Describe the feature you'd love to see…",
  feedback: "Share whatever's on your mind…",
}

export default function FeedbackPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [category, setCategory] = useState<Category>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [session, loading, router])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  if (loading || !session) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const { data: { session: s } } = await supabase.auth.getSession()
      if (s) headers['Authorization'] = `Bearer ${s.access_token}`

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({ category, message: trimmed }),
      })

      if (res.ok) {
        setSubmitted(true)
        setMessage('')
        setTimeout(() => router.back(), 2000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col bg-sage text-forest" style={{ height: '100dvh' }}>
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4">
        <div className="pb-6 flex items-center gap-3" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}>
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sage-mid transition-colors -ml-1"
          >
            <svg className="w-4 h-4 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-display font-bold">Send feedback</h1>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-forest font-display font-bold text-base">Got it, thanks!</p>
              <p className="text-moss text-sm mt-1">We read every submission.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category pills */}
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-display font-bold transition-all ${
                    category === c.id
                      ? 'bg-forest text-court shadow-sm'
                      : 'bg-white text-moss hover:bg-sage-mid'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="text-moss text-xs">{CATEGORIES.find(c => c.id === category)?.hint}</p>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={PLACEHOLDERS[category]}
              maxLength={2000}
              rows={6}
              className="w-full bg-white rounded-xl px-4 py-3 text-sm text-forest placeholder-moss focus:outline-none focus:ring-2 focus:ring-forest/20 resize-none"
            />
            <div className="text-right">
              <span className="text-moss text-[10px]">{message.length}/2000</span>
            </div>

            <button
              type="submit"
              disabled={!message.trim() || submitting}
              className="w-full bg-forest text-court font-display font-bold rounded-xl py-3.5 text-sm hover:bg-forest/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-court/30 border-t-court rounded-full animate-spin" />
              ) : (
                <>
                  Send
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}
      </div>
      </div>

      <BottomNav />
    </div>
  )
}

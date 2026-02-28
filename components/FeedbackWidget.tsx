import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type Category = 'bug' | 'feature' | 'feedback'

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    id: 'bug',
    label: 'Bug',
    hint: 'Something is broken',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    id: 'feature',
    label: 'Idea',
    hint: 'A feature request',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    id: 'feedback',
    label: 'Feedback',
    hint: 'General thoughts',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
]

const PLACEHOLDERS: Record<Category, string> = {
  bug: 'Describe what happened and what you expected…',
  feature: "Describe the feature you'd love to see…",
  feedback: "Share whatever's on your mind…",
}

export default function FeedbackWidget() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus textarea when sheet opens
  useEffect(() => {
    if (open && !submitted) {
      const t = setTimeout(() => textareaRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
  }, [open, submitted])

  function handleOpen() {
    setSubmitted(false)
    setMessage('')
    setCategory('bug')
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
  }

  async function handleSubmit() {
    const trimmed = message.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session) {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s) headers['Authorization'] = `Bearer ${s.access_token}`
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({ category, message: trimmed }),
      })

      if (res.ok) {
        setSubmitted(true)
        setMessage('')
        setTimeout(() => setOpen(false), 2200)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Trigger button — positioned to the left of the notification bell */}
      <button
        onClick={handleOpen}
        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-sage-mid flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        aria-label="Send feedback"
      >
        <svg className="w-4.5 h-4.5 text-forest" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-forest/40 backdrop-blur-[2px]"
          onClick={handleClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-sage-mid" />
        </div>

        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center px-6 py-10 gap-4">
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
          <div className="px-5 pt-1 pb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-forest text-base font-display font-bold">Send feedback</h2>
              <button onClick={handleClose} className="w-7 h-7 rounded-full bg-sage flex items-center justify-center text-moss hover:text-forest transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 mb-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-bold transition-all ${
                    category === c.id
                      ? 'bg-forest text-court shadow-sm'
                      : 'bg-sage text-moss hover:bg-sage-mid'
                  }`}
                >
                  <span className={category === c.id ? 'text-court' : 'text-moss'}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Hint */}
            <p className="text-moss text-xs mb-2">{CATEGORIES.find(c => c.id === category)?.hint}</p>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={PLACEHOLDERS[category]}
              maxLength={2000}
              rows={4}
              className="w-full bg-sage rounded-xl px-4 py-3 text-sm text-forest placeholder-moss focus:outline-none focus:ring-2 focus:ring-forest/20 resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-1 mb-3">
              <span className="text-moss text-[10px]">{message.length}/2000</span>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
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
          </div>
        )}
      </div>
    </>
  )
}

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-sage flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-display font-black text-forest tracking-tight">needone</h1>
          <p className="text-moss mt-2 text-sm">find who&apos;s at the park</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-forest font-semibold">Check your email</p>
            <p className="text-moss text-sm mt-1">We sent a link to <span className="text-forest font-medium">{email}</span></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-white border border-sage-mid text-forest placeholder-moss rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-moss transition-colors"
              />
            </div>
            {error && (
              <p className="text-rally text-xs">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-forest font-display font-bold rounded-xl py-3.5 text-sm disabled:opacity-50 hover:bg-green-400 transition-all"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

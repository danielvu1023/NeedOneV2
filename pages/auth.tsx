import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      console.log('[auth] verifyOtp result:', { error, session: data?.session })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      console.error('[auth] verifyOtp threw:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error — please try again')
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setCode('')
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  }

  return (
    <div className="min-h-screen bg-sage flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-display font-black text-forest tracking-tight">NeedOne</h1>
          <p className="text-moss mt-2 text-sm">find who&apos;s at the park</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
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
            {error && <p className="text-rally text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-forest font-display font-bold rounded-xl py-3.5 text-sm disabled:opacity-50 hover:bg-green-400 transition-all"
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-forest font-semibold">Check your email</p>
              <p className="text-moss text-sm mt-1">
                We sent a 6-digit code to <span className="text-forest font-medium">{email}</span>
              </p>
            </div>
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full bg-white border border-sage-mid text-forest placeholder-moss rounded-xl px-4 py-3.5 text-sm text-center tracking-[0.3em] focus:outline-none focus:border-moss transition-colors"
              />
            </div>
            {error && <p className="text-rally text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-green-500 text-forest font-display font-bold rounded-xl py-3.5 text-sm disabled:opacity-50 hover:bg-green-400 transition-all"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <p className="text-center text-xs text-moss">
              Didn&apos;t get it?{' '}
              <button type="button" onClick={handleResend} className="text-forest underline">
                Resend
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

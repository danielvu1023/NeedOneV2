import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/errorLog'
import AuthInstallNudge from '@/components/AuthInstallNudge'


export default function AuthPage() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
      console.log('[auth] verifyOtp result:', { error, session: data?.session?.user?.id })
      if (error) {
        logError('auth', 'verifyOtp error', error.message)
        setError(error.message)
        setLoading(false)
      } else if (!data.session) {
        const msg = 'Verification succeeded but no session returned — try sending a new code'
        logError('auth', 'verifyOtp no session', { user: data.user?.id })
        setError(msg)
        setLoading(false)
      } else {
        // Soft navigation — avoids hard reload before session write is durable on Safari.
        // For fully set up users this lands on '/'. For new/incomplete users,
        // onAuthStateChange SIGNED_IN handler in useAuth intercepts first.
        router.replace('/')
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
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 82 72" className="w-16 h-16" aria-hidden="true">
              <g fill="#0f1e0c">
                <path d="M66.8 36.2 C 66.8 50.3 55.4 61.7 41.3 61.7 27.3 61.7 15.9 50.3 15.9 36.2 15.9 22.2 27.3 10.8 41.3 10.8 55.4 10.8 66.8 22.2 66.8 36.2 Z M32.2 60.5  M59.2 36.1 C 59.2 26 51.1 17.9 41 17.9 31 17.9 22.8 26 22.8 36.1 22.8 46.1 31 54.3 41 54.3 51.1 54.3 59.2 46.1 59.2 36.1 Z M49.7 51.9 "/>
              </g>
              <g fill="#98c52c">
                <path d="M63.1 36 C 63.1 48.2 53.2 58.1 41 58.1 28.8 58.1 18.9 48.2 18.9 36 18.9 23.8 28.8 14 41 14 53.2 14 63.1 23.8 63.1 36 Z M33.2 56.9  m 9.4 -20 c 1 -1.7 -1.3 -3.6 -2.7 -2.2 -1.2 1.2 -0.4 3.3 1.1 3.3 0.5 0 1.2 -0.5 1.6 -1.1 z "/>
              </g>
              <g fill="#ccfe48">
                <path d="M62.1 36 C 62.1 47.7 52.7 57.2 41 57.2 29.3 57.2 19.9 47.7 19.9 36 19.9 24.4 29.3 14.9 41 14.9 52.7 14.9 62.1 24.4 62.1 36 Z M32.4 55.6  M56.9 36.1 C 56.9 27.3 49.8 20.2 41 20.2 32.2 20.2 25.1 27.3 25.1 36.1 25.1 44.9 32.2 52 41 52 49.8 52 56.9 44.9 56.9 36.1 Z M47.9 50.5 "/>
                <path d="M54.7 36 C 54.7 43.6 48.5 49.7 40.9 49.7 33.3 49.7 27.2 43.6 27.2 36 27.2 28.4 33.3 22.2 40.9 22.2 48.5 22.2 54.7 28.4 54.7 36 Z M34.2 48  M48.9 36 C 48.9 31.7 45.4 28.1 41 28.1 36.7 28.1 33.1 31.7 33.1 36 33.1 40.4 36.7 43.9 41 43.9 45.4 43.9 48.9 40.4 48.9 36 Z M46.5 41.5 "/>
                <path d="M 37 40 c -1.1 -1.1 -2 -2.9 -2 -4 0 -2.6 3.4 -6 6 -6 2.6 0 6 3.4 6 6 0 1.1 -0.9 2.9 -2 4 -1.1 1.1 -2.9 2 -4 2 -1.1 0 -2.9 -0.9 -4 -2 z "/>
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-black text-forest tracking-tight">NeedOne</h1>
          <p className="text-moss mt-2 text-sm">find who&apos;s at the park</p>
        </div>

        <AuthInstallNudge />

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-white border border-sage-mid text-forest placeholder-moss rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-moss transition-colors"
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
                className="w-full bg-white border border-sage-mid text-forest placeholder-moss rounded-xl px-4 py-3.5 text-base text-center tracking-[0.3em] focus:outline-none focus:border-moss transition-colors"
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

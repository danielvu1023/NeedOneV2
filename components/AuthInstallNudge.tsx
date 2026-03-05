import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

const DISMISSED_KEY = 'auth_install_nudge_v1'

// Animated iOS share icon — bobs upward to mimic "tap the share button"
function ShareIcon() {
  return (
    <span style={{ display: 'inline-flex', animation: 'nudge-bob 1.6s ease-in-out infinite' }}>
      <svg
        width="14" height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-court inline-block"
        style={{ verticalAlign: 'middle', marginTop: -2 }}
      >
        <path d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15" />
        <path d="M12 3v13m0-13l-3 3m3-3l3 3" />
      </svg>
    </span>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-5 h-5 rounded-full bg-electric/15 flex items-center justify-center flex-shrink-0 text-[10px] font-display font-bold text-electric"
      >
        {n}
      </span>
      <span className="text-xs text-moss leading-snug">{children}</span>
    </div>
  )
}

export default function AuthInstallNudge() {
  const { installState } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem(DISMISSED_KEY) === '1') setDismissed(true)
  }, [])

  if (!mounted || dismissed || installState !== 'ios') return null

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <>
      <style>{`
        @keyframes nudge-bob {
          0%, 100% { transform: translateY(0); }
          40%       { transform: translateY(-3px); }
          60%       { transform: translateY(-1px); }
        }
      `}</style>

      <div className="mb-6 rounded-2xl overflow-hidden bg-white border border-sage-mid">
        {/* Header row */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-moss mb-0.5">
              iPhone tip
            </p>
            <h3 className="text-sm font-display font-bold text-forest leading-tight">
              Install first, sign in once
            </h3>
            <p className="text-xs text-moss mt-1 leading-relaxed">
              iOS doesn&apos;t share sign-ins between the browser and an installed app.
              Install now so you only do this once.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-sage transition-colors"
            style={{ marginTop: 1 }}
          >
            <svg className="w-3 h-3 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-sage-mid" />

        {/* Steps */}
        <div className="px-4 py-3 space-y-2.5">
          <Step n={1}>
            Tap the <ShareIcon /> share button at the bottom of Safari
          </Step>
          <Step n={2}>
            Scroll down → tap{' '}
            <strong className="text-forest font-semibold">Add to Home Screen</strong>
          </Step>
          <Step n={3}>
            Open NeedOne from your home screen, then sign in here
          </Step>
        </div>

        {/* Skip link */}
        <div className="px-4 pb-3.5 pt-0.5 text-center">
          <button
            onClick={handleDismiss}
            className="text-[11px] text-moss hover:text-forest transition-colors"
          >
            Skip — sign in from the browser instead
          </button>
        </div>
      </div>
    </>
  )
}

import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function InstallBanner() {
  const { installState, shouldShow, install, dismiss, installing } = usePWAInstall()

  if (!shouldShow) return null

  return (
    <div className="mx-6 mb-5 rounded-2xl overflow-hidden bg-forest text-court shadow-xl">
      {/* Top strip */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-court/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-court" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0 -mt-0.5 -mr-0.5"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5 text-court/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 className="text-sm font-display font-bold text-court mt-3 leading-snug">
          Add to your home screen
        </h3>
        <p className="text-court/60 text-xs mt-1 leading-relaxed">
          Push notifications only work when NeedOne is installed as an app — not in the browser.
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-5" />

      {/* Platform-specific instructions */}
      <div className="px-5 py-4">
        {installState === 'ios' ? (
          <div className="space-y-2.5">
            <p className="text-court/50 text-[10px] font-display font-bold uppercase tracking-wider">In Safari</p>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-court/15 flex items-center justify-center flex-shrink-0">
                <span className="text-court text-[10px] font-bold">1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-court/80 text-xs">Tap</span>
                {/* iOS Share icon */}
                <svg className="w-4 h-4 text-court" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                </svg>
                <span className="text-court/80 text-xs">in the bottom bar</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-court/15 flex items-center justify-center flex-shrink-0">
                <span className="text-court text-[10px] font-bold">2</span>
              </div>
              <p className="text-court/80 text-xs">Scroll down → <span className="font-semibold text-court">Add to Home Screen</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-court/15 flex items-center justify-center flex-shrink-0">
                <span className="text-court text-[10px] font-bold">3</span>
              </div>
              <p className="text-court/80 text-xs">Tap <span className="font-semibold text-court">Add</span> in the top right</p>
            </div>

            <button
              onClick={dismiss}
              className="w-full mt-1 bg-court text-forest font-display font-bold text-xs rounded-xl py-3 hover:bg-court/90 transition-colors"
            >
              Done, I added it ✓
            </button>
          </div>
        ) : installState === 'promptable' ? (
          <div className="space-y-3">
            <p className="text-court/60 text-xs leading-relaxed">
              Install the app in one tap — faster loads, full notifications.
            </p>
            <button
              onClick={install}
              disabled={installing}
              className="w-full bg-court text-forest font-display font-bold text-xs rounded-xl py-3 hover:bg-court/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {installing ? (
                <div className="w-4 h-4 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
              {installing ? 'Installing…' : 'Install NeedOne'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

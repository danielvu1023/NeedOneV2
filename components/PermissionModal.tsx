import { useState, useEffect } from 'react'
import { usePushPermission } from '@/hooks/usePushPermission'

type Step = 'notifications' | 'location' | null

export default function PermissionModal() {
  const { pushState, locationState, subscribing, requestPush, requestLocation, dismissPush, dismissLocation } = usePushPermission()
  const [step, setStep] = useState<Step>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Determine which step to show
    if (pushState === 'unknown') {
      setStep('notifications')
    } else if (locationState === 'unknown') {
      setStep('location')
    } else {
      setStep(null)
    }
  }, [mounted, pushState, locationState])

  async function handleEnableNotifications() {
    await requestPush()
    // Move to location step
    if (locationState === 'unknown') {
      setStep('location')
    } else {
      setStep(null)
    }
  }

  function handleDismissNotifications() {
    dismissPush()
    if (locationState === 'unknown') {
      setStep('location')
    } else {
      setStep(null)
    }
  }

  async function handleEnableLocation() {
    await requestLocation()
    setStep(null)
  }

  function handleDismissLocation() {
    dismissLocation()
    setStep(null)
  }

  if (!step) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-forest/60" />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {step === 'notifications' ? (
          <>
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-forest mb-1">Know when friends check in</h2>
              <p className="text-moss text-sm">Get notified the moment a friend arrives at a park near you.</p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              <button
                onClick={handleEnableNotifications}
                disabled={subscribing}
                className="w-full bg-green-500 text-forest font-display font-bold rounded-xl py-3.5 text-sm hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {subscribing ? 'Enabling…' : 'Enable notifications'}
              </button>
              <button
                onClick={handleDismissNotifications}
                className="w-full text-moss text-sm py-2 hover:text-forest transition-colors"
              >
                Not now
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-forest mb-1">See yourself on the map</h2>
              <p className="text-moss text-sm">Allow location access to show your position and find nearby parks.</p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              <button
                onClick={handleEnableLocation}
                className="w-full bg-blue-500 text-white font-display font-bold rounded-xl py-3.5 text-sm hover:bg-blue-400 transition-colors"
              >
                Enable location
              </button>
              <button
                onClick={handleDismissLocation}
                className="w-full text-moss text-sm py-2 hover:text-forest transition-colors"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

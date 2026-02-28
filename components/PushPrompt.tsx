import { useState, useEffect } from 'react'
import { usePushPermission } from '@/hooks/usePushPermission'

export default function PushPrompt() {
  const { state, subscribing, requestPermission } = usePushPermission()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('push_prompt_dismissed') === '1') setDismissed(true)
  }, [])

  function dismiss() {
    localStorage.setItem('push_prompt_dismissed', '1')
    setDismissed(true)
  }

  if (dismissed || state !== 'unknown') return null

  return (
    <div className="absolute top-16 left-4 right-4 z-20 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Know when friends check in</p>
          <p className="text-zinc-400 text-xs mt-0.5">Get notified when a friend arrives at a park</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermission}
              disabled={subscribing}
              className="bg-white text-black text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {subscribing ? 'Enabling…' : 'Enable'}
            </button>
            <button
              onClick={dismiss}
              className="text-zinc-500 text-xs px-2 py-1.5 hover:text-zinc-300 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

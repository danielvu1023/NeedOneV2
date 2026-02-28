import { useState, useEffect } from 'react'

export type InstallState = 'standalone' | 'promptable' | 'ios' | 'unavailable'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa_install_dismissed'

export function usePWAInstall() {
  const [installState, setInstallState] = useState<InstallState>('unavailable')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true

    if (isStandalone) {
      setInstallState('standalone')
      return
    }

    if (localStorage.getItem(DISMISSED_KEY) === '1') {
      setDismissed(true)
    }

    // iOS Safari — no install prompt API, must use manual instructions
    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|edgios/i.test(ua)
    if (isIOS && isSafari) {
      setInstallState('ios')
      return
    }

    // Android/Chrome — capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallState('promptable')
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => setInstallState('standalone'))

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function install() {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstallState('standalone')
        setDismissed(true)
      }
    } finally {
      setDeferredPrompt(null)
      setInstalling(false)
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  const shouldShow =
    !dismissed &&
    installState !== 'standalone' &&
    installState !== 'unavailable'

  return { installState, shouldShow, install, dismiss, installing }
}

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getDisplayName } from '@/lib/profileUtils'
import { usePushPermission } from '@/hooks/usePushPermission'
import InitialsAvatar from '@/components/InitialsAvatar'
import BottomNav from '@/components/BottomNav'

function PermissionRow({
  label,
  state,
  onEnable,
  requiresStandalone,
  isStandalone,
}: {
  label: string
  state: string
  onEnable: () => void
  requiresStandalone?: boolean
  isStandalone?: boolean
}) {
  if (state === 'granted') {
    return (
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5">
        <span className="text-sm text-forest">{label}</span>
        <span className="text-green-600 text-xs font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Enabled
        </span>
      </div>
    )
  }

  if (state === 'blocked') {
    return (
      <div className="bg-white rounded-xl px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-forest">{label}</span>
          <span className="text-rally text-xs font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.98L13.75 4a2 2 0 00-3.5 0L3.25 16.02A2 2 0 005.07 19z" />
            </svg>
            Blocked
          </span>
        </div>
        <p className="text-moss text-xs mt-1.5">Open browser settings → Site Settings → {label} → Allow</p>
      </div>
    )
  }

  if (requiresStandalone && !isStandalone) {
    return (
      <div className="bg-white rounded-xl px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-forest">{label}</span>
          <span className="text-moss text-xs">Off</span>
        </div>
        <p className="text-moss text-xs mt-1.5">Install the app to enable push notifications</p>
      </div>
    )
  }

  return (
    <button
      onClick={onEnable}
      className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3.5 hover:bg-sage-mid transition-colors"
    >
      <span className="text-sm text-forest">{label}</span>
      <span className="text-moss text-xs hover:text-forest transition-colors">Off — tap to enable</span>
    </button>
  )
}

export default function ProfilePage() {
  const { session, profile, loading, authError, signOut } = useAuth()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { pushState, locationState, resetDismissed } = usePushPermission()
  const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [session, loading, router])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/avatar.${ext}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', session.user.id)
      router.reload()
    } finally {
      setUploading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-sage flex flex-col items-center justify-center gap-2">
      <div className="w-6 h-6 border-2 border-sage-mid border-t-forest rounded-full animate-spin" />
      <p className="text-xs text-moss font-mono">loading session…</p>
    </div>
  )
  if (!session) return (
    <div className="min-h-screen bg-sage flex flex-col items-center justify-center gap-2">
      <p className="text-xs text-moss font-mono">no session — redirecting…</p>
    </div>
  )
  if (!profile) return (
    <div className="min-h-screen bg-sage flex flex-col items-center justify-center gap-2">
      {authError ? (
        <>
          <p className="text-xs text-rally font-mono px-6 text-center">{authError}</p>
          <a href="/diagnostics" className="text-xs text-moss underline font-mono">diagnostics</a>
        </>
      ) : (
        <>
          <div className="w-6 h-6 border-2 border-sage-mid border-t-forest rounded-full animate-spin" />
          <p className="text-xs text-moss font-mono">loading profile…</p>
        </>
      )}
    </div>
  )

  const displayName = getDisplayName(profile)

  return (
    <div className="flex flex-col bg-sage text-forest" style={{ height: '100dvh' }}>
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4">
        <div className="pb-6" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}>
          <h1 className="text-2xl font-display font-bold">Profile</h1>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            disabled={uploading}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <InitialsAvatar name={displayName} userId={profile.id} size={96} />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-forest/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

          <div className="text-center">
            <p className="text-xl font-display font-bold text-forest">{displayName}</p>
            <p className="text-moss text-sm mt-0.5">{session.user.email}</p>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-2 mb-8">
          <button
            onClick={() => router.push('/profile-setup?edit=1')}
            className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3.5 hover:bg-sage-mid transition-colors"
          >
            <span className="text-sm text-forest">Edit profile</span>
            <svg className="w-4 h-4 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => router.push('/notifications')}
            className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3.5 hover:bg-sage-mid transition-colors"
          >
            <span className="text-sm text-forest">Notifications</span>
            <svg className="w-4 h-4 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Permissions */}
        <div className="mb-8">
          <h2 className="text-xs font-display font-bold text-moss uppercase tracking-wider mb-3">Permissions</h2>
          <div className="space-y-2">
            <PermissionRow
              label="Notifications"
              state={pushState}
              onEnable={() => resetDismissed('push')}
              requiresStandalone
              isStandalone={isStandalone}
            />
            <PermissionRow
              label="Location"
              state={locationState}
              onEnable={() => resetDismissed('location')}
            />
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-2">
          <button
            onClick={signOut}
            className="w-full bg-white border border-sage-mid text-rally rounded-xl py-3.5 text-sm font-medium hover:bg-sage transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* TODO: remove — dev only */}
        <div className="mt-6 pt-4 border-t border-sage-mid">
          <a
            href="/push-test"
            className="block w-full text-center bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-xl py-3 text-xs font-mono"
          >
            🔔 Push Notification Test (dev only)
          </a>
        </div>
      </div>
      </div>

      <BottomNav />
    </div>
  )
}

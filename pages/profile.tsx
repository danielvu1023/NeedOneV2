import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import InitialsAvatar from '@/components/InitialsAvatar'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const { session, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  if (loading || !session || !profile) return null

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-lg mx-auto px-4">
        <div className="pt-14 pb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        {/* Avatar + username */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            disabled={uploading}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username ?? ''} className="w-full h-full object-cover" />
              ) : (
                <InitialsAvatar username={profile.username ?? '?'} userId={profile.id} size={96} />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
            <p className="text-xl font-bold">{profile.username ?? 'Set username'}</p>
            <p className="text-zinc-500 text-sm mt-0.5">{session.user.email}</p>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-2">
          <button
            onClick={() => router.push('/profile-setup')}
            className="w-full flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3.5 hover:bg-zinc-800 transition-colors"
          >
            <span className="text-sm">Edit profile</span>
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => router.push('/notifications')}
            className="w-full flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3.5 hover:bg-zinc-800 transition-colors"
          >
            <span className="text-sm">Notifications</span>
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Sign out */}
        <div className="mt-8">
          <button
            onClick={signOut}
            className="w-full bg-zinc-900 border border-zinc-800 text-red-400 rounded-xl py-3.5 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

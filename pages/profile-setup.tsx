import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function ProfileSetupPage() {
  const { session, profile } = useAuth()
  const router = useRouter()
  const isEditing = router.query.edit === '1'
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setLoading(true)
    setError('')

    try {
      let avatar_url: string | null = null

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${session.user.id}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = urlData.publicUrl
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          username: firstName.trim().toLowerCase().replace(/\s+/g, '_'),
          avatar_url,
        })

      if (upsertError) throw upsertError

      router.replace(isEditing ? '/profile' : '/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sage flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {isEditing && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-moss hover:text-forest transition-colors mb-6 -ml-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        )}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-display font-bold text-forest">
            {isEditing ? 'Edit profile' : "What's your name?"}
          </h1>
          <p className="text-moss text-sm mt-1">How you&apos;ll appear on the map</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-sage-mid flex items-center justify-center overflow-hidden hover:border-moss transition-colors"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
            <p className="text-moss text-xs">Tap to add photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* First name */}
          <div>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              minLength={1}
              maxLength={50}
              className="w-full bg-white border border-sage-mid text-forest placeholder-moss rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-moss transition-colors"
            />
          </div>

          {/* Last name */}
          <div>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name (optional)"
              maxLength={50}
              className="w-full bg-white border border-sage-mid text-forest placeholder-moss rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-moss transition-colors"
            />
          </div>

          {error && <p className="text-rally text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading || !firstName.trim()}
            className="w-full bg-green-500 text-forest font-display font-bold rounded-xl py-3.5 text-sm disabled:opacity-50 hover:bg-green-400 transition-all"
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

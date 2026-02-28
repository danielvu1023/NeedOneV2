import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

const EXEMPT_PATHS = ['/auth', '/profile-setup', '/onboarding']

interface AuthContextType {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    return data as Profile | null
  }

  function redirectIfNeeded(p: Profile | null, pathname: string) {
    if (!p || EXEMPT_PATHS.includes(pathname)) return
    if (!p.first_name) {
      router.replace('/profile-setup')
    } else if (!p.onboarding_completed) {
      router.replace('/onboarding')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const p = await loadProfile(session.user.id)
        redirectIfNeeded(p, router.pathname)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session) {
        const p = await loadProfile(session.user.id)
        if (event === 'SIGNED_IN') {
          redirectIfNeeded(p, router.pathname)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

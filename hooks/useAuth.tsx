import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/errorLog'
import type { Profile } from '@/lib/types'

const EXEMPT_PATHS = ['/auth', '/profile-setup', '/onboarding', '/push-test', '/diagnostics', '/design', '/spline-test', '/']

interface AuthContextType {
  session: Session | null
  profile: Profile | null
  loading: boolean
  authError: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  authError: null,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  // Returns the profile, null if genuinely not found, or throws symbol LOAD_FAILED on error
  const LOAD_FAILED = Symbol('LOAD_FAILED')

  async function loadProfile(userId: string): Promise<Profile | null | typeof LOAD_FAILED> {
    console.log('[useAuth] loadProfile start userId=', userId.slice(0, 8) + '…')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, username, onboarding_completed, created_at')
        .eq('id', userId)
        .single()
      if (error) {
        // PGRST116 = no rows found — genuinely no profile yet
        if (error.code === 'PGRST116') {
          console.log('[useAuth] loadProfile not found')
          setAuthError(null)
          setProfile(null)
          return null
        }
        const msg = error.message
        console.error('[useAuth] loadProfile error:', msg)
        logError('useAuth', 'loadProfile failed', msg)
        setAuthError(msg)
        return LOAD_FAILED
      }
      console.log('[useAuth] loadProfile ok')
      setAuthError(null)
      setProfile(data)
      return data as Profile
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[useAuth] loadProfile threw:', msg)
      logError('useAuth', 'loadProfile threw', msg)
      setAuthError(msg)
      return LOAD_FAILED
    }
  }

  function redirectIfNeeded(p: Profile | null, pathname: string) {
    if (EXEMPT_PATHS.includes(pathname)) return
    if (!p || !p.first_name) {
      console.log('[useAuth] → /profile-setup from', pathname)
      logError('useAuth', 'redirect → /profile-setup', { from: pathname, hasProfile: !!p })
      router.replace('/profile-setup')
    } else if (!p.onboarding_completed) {
      console.log('[useAuth] → /onboarding from', pathname)
      logError('useAuth', 'redirect → /onboarding', { from: pathname })
      router.replace('/onboarding')
    }
  }

  useEffect(() => {
    console.log('[useAuth] getSession start')
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        console.log('[useAuth] session found userId=', session.user.id.slice(0, 8) + '…')
      } else {
        console.log('[useAuth] no session')
      }
      setSession(session)
      if (session) {
        const p = await loadProfile(session.user.id)
        if (p !== LOAD_FAILED) redirectIfNeeded(p, router.pathname)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session) {
        // On sign-in, hold loading=true while we check the profile so pages
        // show a spinner instead of flashing content before the redirect fires.
        if (event === 'SIGNED_IN') setLoading(true)
        // Non-async callback — SDK awaits subscribers, so an async callback here
        // blocks verifyOtp from ever resolving. Use .then() to fire-and-forget.
        loadProfile(session.user.id).then((p) => {
          if (event === 'SIGNED_IN' && p !== LOAD_FAILED) {
            // Can't use redirectIfNeeded here — router.pathname is still '/auth'
            // (exempt) when this .then() runs, so the path check would bail out.
            // For incomplete users, redirect now before auth.tsx's router.replace('/')
            // wins the race. For fully set up users, let auth.tsx handle it (Safari
            // soft-nav: avoids hard reload before session write is durable).
            if (!p || !p.first_name) {
              router.replace('/profile-setup')
            } else if (!p.onboarding_completed) {
              router.replace('/onboarding')
            }
          }
          setLoading(false)
        })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshProfile() {
    const currentSession = (await supabase.auth.getSession()).data.session
    if (currentSession) {
      const p = await loadProfile(currentSession.user.id)
      if (p !== LOAD_FAILED) setProfile(p)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, authError, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

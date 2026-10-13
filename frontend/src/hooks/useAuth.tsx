import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { api } from '@/lib/api'
import { DEMO_MODE } from '@/lib/config'
import { demoSignIn, demoSignInAs, demoSignOut, getDemoUserId, onDemoAuthChange } from '@/lib/demo/auth'
import type { Me } from '@/lib/types'

interface AuthSession {
  userId: string
}

interface AuthState {
  session: AuthSession | null
  /** True until the stored session (if any) has been restored. */
  initializing: boolean
  me: Me | undefined
  meLoading: boolean
  meError: Error | null
  signIn: (email: string, password: string) => Promise<void>
  /** Demo mode only: sign in as a sample user without a password. */
  signInAs: (userId: string) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [initializing, setInitializing] = useState(true)
  const qc = useQueryClient()

  useEffect(() => {
    if (DEMO_MODE) {
      const id = getDemoUserId()
      setSession(id ? { userId: id } : null)
      setInitializing(false)
      const unsubscribe = onDemoAuthChange((uid) => {
        if (!uid) qc.clear()
        setSession(uid ? { userId: uid } : null)
      })
      return () => void unsubscribe()
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { userId: data.session.user.id } : null)
      setInitializing(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ? { userId: s.user.id } : null)
      if (event === 'SIGNED_OUT') qc.clear()
    })
    return () => sub.subscription.unsubscribe()
  }, [qc])

  const userId = session?.userId
  const meQuery = useQuery({
    queryKey: ['me', userId],
    queryFn: api.me,
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const value = useMemo<AuthState>(
    () => ({
      session,
      initializing,
      me: meQuery.data,
      meLoading: Boolean(userId) && meQuery.isPending,
      meError: meQuery.error,
      signIn: async (email, password) => {
        if (DEMO_MODE) return demoSignIn(email, password)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signInAs: (id) => {
        if (DEMO_MODE) demoSignInAs(id)
      },
      signOut: async () => {
        if (DEMO_MODE) return demoSignOut()
        await supabase.auth.signOut()
      },
    }),
    [session, initializing, meQuery.data, meQuery.isPending, meQuery.error, userId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

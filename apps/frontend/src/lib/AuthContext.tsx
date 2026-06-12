import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase.js'

interface AuthContextValue {
  session: Session | null
  user: User | null
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.access_token) {
        sessionStorage.setItem('access_token', data.session.access_token)
      } else {
        sessionStorage.removeItem('access_token')
      }
      setIsInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.access_token) {
        sessionStorage.setItem('access_token', newSession.access_token)
      } else {
        sessionStorage.removeItem('access_token')
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  async function signIn(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session) {
      sessionStorage.setItem('access_token', data.session.access_token)
    }
  }

  async function signUp(email: string, password: string, fullName: string): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    if (data.session) {
      sessionStorage.setItem('access_token', data.session.access_token)
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    sessionStorage.removeItem('access_token')
  }

  return (
    <AuthContext.Provider value={{ session, user, isInitialized, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

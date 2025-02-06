import { create } from 'zustand'
import { supabase } from '../supabaseClient'
import { User, Session } from '@supabase/supabase-js'
import { Profile } from '../types'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  partner: Profile | null
  loading: boolean
  initialized: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile) => void
  setPartner: (partner: Profile) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

type AuthStore = ReturnType<typeof createAuthStore>

const createAuthStore = (set: (fn: (state: AuthState) => Partial<AuthState>) => void, get: () => AuthState) => ({
  session: null,
  user: null,
  profile: null,
  partner: null,
  loading: true,
  initialized: false,

  setSession: (session: Session | null) => {
    set((state) => ({
      session,
      user: session?.user ?? null,
      loading: false
    }))
  },

  setProfile: (profile: Profile) => {
    set(() => ({ profile }))
  },

  setPartner: (partner: Profile) => {
    set(() => ({ partner }))
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set(() => ({
      session: null,
      user: null,
      profile: null,
      partner: null
    }))
  },

  initialize: async () => {
    if (get().initialized) return

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      get().setSession(session)

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        get().setSession(session)
      })

      // Get profile and partner if logged in
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          get().setProfile(profile as Profile)

          // Get partner if exists
          const { data: pairing } = await supabase
            .from('pairings')
            .select('*')
            .or(`user_id.eq.${session.user.id},partner_id.eq.${session.user.id}`)
            .eq('status', 'approved')
            .single()

          if (pairing) {
            const partnerId = pairing.user_id === session.user.id
              ? pairing.partner_id
              : pairing.user_id

            const { data: partner } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', partnerId)
              .single()

            if (partner) {
              get().setPartner(partner as Profile)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set(() => ({ initialized: true, loading: false }))
    }
  }
})

export const useAuthStore = create<AuthState>()(createAuthStore) 
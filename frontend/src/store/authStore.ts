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
  refreshProfile: () => Promise<void>
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
        const currentSession = get().session
        // Only update if the session actually changed
        if (session?.access_token !== currentSession?.access_token) {
          get().setSession(session)
          if (session) {
            get().refreshProfile()
          }
        }
      })

      // Get profile and partner if logged in
      if (session?.user) {
        await get().refreshProfile()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set(() => ({ initialized: true, loading: false }))
    }
  },

  refreshProfile: async () => {
    const { session } = get()
    if (!session?.user) return

    try {
      // First get the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        get().setProfile(profile as Profile)

        // Then check for any approved pairing
        const { data: pairing } = await supabase
          .from('pairings')
          .select('*')
          .or(`user_id.eq.${session.user.id},partner_id.eq.${session.user.id}`)
          .eq('status', 'approved')
          .single()

        if (pairing) {
          // Get the partner's ID
          const partnerId = pairing.user_id === session.user.id
            ? pairing.partner_id
            : pairing.user_id

          // Get the partner's profile
          const { data: partner } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .single()

          if (partner) {
            get().setPartner(partner as Profile)
            
            // If we found an approved pairing but profile.paired is false,
            // update it to true
            if (!profile.paired) {
              const { data: updatedProfile } = await supabase
                .from('profiles')
                .update({ paired: true })
                .eq('id', session.user.id)
                .select()
                .single()
              
              if (updatedProfile) {
                get().setProfile(updatedProfile as Profile)
              }
            }
          }
        } else if (profile.paired) {
          // If no approved pairing found but profile says paired,
          // update it to false
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({ paired: false })
            .eq('id', session.user.id)
            .select()
            .single()
          
          if (updatedProfile) {
            get().setProfile(updatedProfile as Profile)
          }
          get().setPartner(null)
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }
})

export const useAuthStore = create<AuthState>()(createAuthStore) 
import { create } from 'zustand'
import { supabase } from '../supabaseClient'
import { useAuthStore } from './authStore'

interface PairingStore {
  loading: boolean
  error: string | null
  pendingRequest: {
    requesterId: string
    requesterEmail: string
  } | null
  generateCode: () => Promise<void>
  pairWithPartner: (code: string) => Promise<void>
  acceptPairing: () => Promise<void>
  checkPendingRequest: () => Promise<void>
}

export const usePairingStore = create<PairingStore>((set, get) => ({
  loading: false,
  error: null,
  pendingRequest: null,

  generateCode: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/generate-pairing-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to generate pairing code')
      }

      const data = await response.json()
      console.log('Generated code response:', data)

      // Refresh profile to get the new code
      await useAuthStore.getState().refreshProfile()
    } catch (error) {
      console.error('Error generating code:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to generate pairing code' })
    } finally {
      set({ loading: false })
    }
  },

  pairWithPartner: async (code: string) => {
    set({ loading: true, error: null })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ partner_code: code })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to pair with partner')
      }

      const data = await response.json()
      console.log('Pairing response:', data)

      if (data.status === 'pending') {
        set({ error: 'Pairing request sent. Waiting for partner to accept.' })
      }

      // Refresh profile to get the updated pairing status
      await useAuthStore.getState().refreshProfile()
    } catch (error) {
      console.error('Error pairing:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to pair with partner' })
    } finally {
      set({ loading: false })
    }
  },

  acceptPairing: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/accept-pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to accept pairing')
      }

      const data = await response.json()
      console.log('Accept pairing response:', data)

      // Clear pending request
      set({ pendingRequest: null })

      // Refresh profile to get the updated pairing status
      await useAuthStore.getState().refreshProfile()
    } catch (error) {
      console.error('Error accepting pair:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to accept pairing' })
    } finally {
      set({ loading: false })
    }
  },

  checkPendingRequest: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/pending-pair`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to check pending requests')
      }

      const data = await response.json()
      console.log('Pending request response:', data)

      if (data.has_pending) {
        set({
          pendingRequest: {
            requesterId: data.requester.id,
            requesterEmail: data.requester.email
          }
        })
      } else {
        set({ pendingRequest: null })
      }
    } catch (error) {
      console.error('Error checking pending requests:', error)
    }
  }
})) 
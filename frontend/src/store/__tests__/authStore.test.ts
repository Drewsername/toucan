import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

const mockSession = {
  access_token: 'test-token',
  refresh_token: 'test-refresh',
  user: {
    id: '123',
    email: 'test@example.com'
  }
}

const mockProfile = {
  id: '123',
  email: 'test@example.com',
  pair_code: 'ABC123',
  points: 100,
  created_at: new Date().toISOString()
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      partner: null,
      loading: true,
      initialized: false
    })
  })

  it('should initialize with empty state', () => {
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.partner).toBeNull()
    expect(state.loading).toBe(true)
    expect(state.initialized).toBe(false)
  })

  it('should set session', () => {
    const { setSession } = useAuthStore.getState()
    setSession(mockSession as any)
    
    const state = useAuthStore.getState()
    expect(state.session).toBe(mockSession)
    expect(state.user).toBe(mockSession.user)
    expect(state.loading).toBe(false)
  })

  it('should set profile', () => {
    const { setProfile } = useAuthStore.getState()
    setProfile(mockProfile)
    
    const state = useAuthStore.getState()
    expect(state.profile).toBe(mockProfile)
  })

  it('should set partner', () => {
    const { setPartner } = useAuthStore.getState()
    setPartner(mockProfile)
    
    const state = useAuthStore.getState()
    expect(state.partner).toBe(mockProfile)
  })

  it('should sign out', async () => {
    const { signOut } = useAuthStore.getState()
    
    // Set some initial state
    useAuthStore.setState({
      session: mockSession as any,
      user: mockSession.user as any,
      profile: mockProfile,
      partner: mockProfile
    })
    
    await signOut()
    
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.partner).toBeNull()
  })

  it('should initialize auth state', async () => {
    // Mock successful auth responses
    server.use(
      http.get('*/auth/session', () => {
        return HttpResponse.json({ data: { session: mockSession } })
      }),
      http.get('*/profiles', () => {
        return HttpResponse.json({ data: mockProfile })
      }),
      http.get('*/pairings', () => {
        return HttpResponse.json({ data: { 
          user_id: '123',
          partner_id: '456',
          status: 'approved'
        }})
      })
    )

    const { initialize } = useAuthStore.getState()
    await initialize()
    
    const state = useAuthStore.getState()
    expect(state.session).toEqual(mockSession)
    expect(state.user).toEqual(mockSession.user)
    expect(state.profile).toEqual(mockProfile)
    expect(state.initialized).toBe(true)
    expect(state.loading).toBe(false)
  })

  it('should handle initialization errors', async () => {
    // Mock error response
    server.use(
      http.get('*/auth/session', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { initialize } = useAuthStore.getState()
    await initialize()
    
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.initialized).toBe(true)
    expect(state.loading).toBe(false)
  })
}) 
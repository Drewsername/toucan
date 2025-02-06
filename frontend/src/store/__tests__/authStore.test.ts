import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import { supabase } from '../../supabaseClient'
import { Session, User, AuthError } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn()
  }
}))

const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString()
}

const mockSession: Session = {
  access_token: 'test-token',
  refresh_token: 'test-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser
}

const mockProfile = {
  id: '123',
  email: 'test@example.com',
  pair_code: 'ABC123',
  points: 100,
  created_at: new Date().toISOString()
}

const mockPartner = {
  id: '456',
  email: 'partner@example.com',
  pair_code: 'XYZ789',
  points: 200,
  created_at: new Date().toISOString()
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      partner: null,
      loading: true,
      initialized: false
    })

    // Default mock implementations
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    })

    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      callback('SIGNED_IN', mockSession)
      return { data: { subscription: { unsubscribe: vi.fn(), id: '123', callback } } }
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    } as any)
  })

  it('should initialize with empty state', () => {
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.partner).toBeNull()
  })

  it('should set session', () => {
    useAuthStore.getState().setSession(mockSession)
    const state = useAuthStore.getState()
    expect(state.session).toEqual(mockSession)
    expect(state.user).toEqual(mockSession.user)
  })

  it('should set profile', () => {
    useAuthStore.getState().setProfile(mockProfile)
    const state = useAuthStore.getState()
    expect(state.profile).toEqual(mockProfile)
  })

  it('should set partner', () => {
    useAuthStore.getState().setPartner(mockPartner)
    const state = useAuthStore.getState()
    expect(state.partner).toEqual(mockPartner)
  })

  it('should sign out', async () => {
    useAuthStore.setState({
      session: mockSession,
      user: mockSession.user,
      profile: mockProfile,
      partner: mockPartner
    })

    await useAuthStore.getState().signOut()
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.partner).toBeNull()
  })

  it('should initialize auth state', async () => {
    // Mock getSession to return our mock session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ 
      data: { session: mockSession }, 
      error: null 
    })

    // Mock database queries
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      })
    } as any))

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { user_id: '123', partner_id: '456', status: 'approved' },
        error: null
      })
    } as any))

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockPartner,
        error: null
      })
    } as any))

    await useAuthStore.getState().initialize()

    const state = useAuthStore.getState()
    expect(state.session).toEqual(mockSession)
    expect(state.user).toEqual(mockSession.user)
    expect(state.profile).toEqual(mockProfile)
    expect(state.partner).toEqual(mockPartner)
    expect(state.initialized).toBe(true)
    expect(state.loading).toBe(false)
  })

  it('should handle initialization errors', async () => {
    const mockError = new AuthError('Failed to get session')
    Object.assign(mockError, { status: 401 })

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ 
      data: { session: null }, 
      error: mockError
    })

    await useAuthStore.getState().initialize()

    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.partner).toBeNull()
    expect(state.initialized).toBe(true)
    expect(state.loading).toBe(false)
  })
}) 
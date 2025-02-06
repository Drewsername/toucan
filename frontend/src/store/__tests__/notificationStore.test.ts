import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotificationStore } from '../notificationStore'
import { supabase } from '../../supabaseClient'

// Mock Supabase client
vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }))
  }
}))

const mockNotification = {
  id: '1',
  message: 'Test notification',
  read: false,
  created_at: new Date().toISOString(),
  user_id: '123'
}

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationStore.setState({ 
      notifications: [],
      loading: false,
      error: null,
      subscribed: false
    })

    // Default mock implementation
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    } as any)
  })

  it('should initialize with empty state', () => {
    const state = useNotificationStore.getState()
    expect(state.notifications).toEqual([])
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.subscribed).toBe(false)
  })

  it('should fetch notifications', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockNotification],
        error: null
      })
    } as any))

    await useNotificationStore.getState().fetchNotifications()

    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0]).toMatchObject(mockNotification)
  })

  it('should mark notification as read', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: { ...mockNotification, read: true },
        error: null
      })
    } as any))

    useNotificationStore.setState({ notifications: [mockNotification] })
    
    await useNotificationStore.getState().markAsRead(mockNotification.id)

    const state = useNotificationStore.getState()
    expect(state.notifications[0].read).toBe(true)
  })

  it('should handle subscription', () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

    const { subscribe, unsubscribe } = useNotificationStore.getState()
    
    subscribe()
    expect(useNotificationStore.getState().subscribed).toBe(true)
    expect(mockChannel.subscribe).toHaveBeenCalled()
    
    unsubscribe()
    expect(useNotificationStore.getState().subscribed).toBe(false)
    expect(mockChannel.unsubscribe).toHaveBeenCalled()
  })

  it('should handle errors', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Failed to fetch')
      })
    } as any))

    await useNotificationStore.getState().fetchNotifications()
    
    const state = useNotificationStore.getState()
    expect(state.error).toBe('Failed to fetch notifications')
    expect(state.notifications).toHaveLength(0)
  })
}) 
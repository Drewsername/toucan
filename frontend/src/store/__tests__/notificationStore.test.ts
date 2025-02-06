import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationStore } from '../notificationStore'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

const mockNotification = {
  id: '123',
  message: 'Test notification',
  read: false,
  created_at: new Date().toISOString()
}

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      loading: false,
      error: null,
      subscribed: false
    })
  })

  it('should initialize with empty state', () => {
    const state = useNotificationStore.getState()
    expect(state.notifications).toEqual([])
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.subscribed).toBe(false)
  })

  it('should fetch notifications', async () => {
    // Mock successful response
    server.use(
      http.get('*/notifications', () => {
        return HttpResponse.json([mockNotification])
      })
    )

    const { fetchNotifications } = useNotificationStore.getState()
    await fetchNotifications()
    
    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0]).toMatchObject(mockNotification)
  })

  it('should mark notification as read', async () => {
    // Setup initial state
    useNotificationStore.setState({
      notifications: [mockNotification]
    })

    const { markAsRead } = useNotificationStore.getState()
    await markAsRead(mockNotification.id)
    
    const state = useNotificationStore.getState()
    expect(state.notifications[0].read).toBe(true)
  })

  it('should handle subscription', () => {
    const { subscribe, unsubscribe } = useNotificationStore.getState()
    
    subscribe()
    expect(useNotificationStore.getState().subscribed).toBe(true)
    
    unsubscribe()
    expect(useNotificationStore.getState().subscribed).toBe(false)
  })

  it('should handle errors', async () => {
    // Mock error response
    server.use(
      http.get('*/notifications', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { fetchNotifications } = useNotificationStore.getState()
    await fetchNotifications()
    
    const state = useNotificationStore.getState()
    expect(state.error).toBe('Failed to fetch notifications')
  })
}) 
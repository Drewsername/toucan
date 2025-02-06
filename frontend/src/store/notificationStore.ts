import { create } from 'zustand'
import { supabase } from '../supabaseClient'
import { Notification } from '../types'

interface NotificationState {
  notifications: Notification[]
  loading: boolean
  error: string | null
  subscribed: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  subscribe: () => void
  unsubscribe: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  subscribed: false,

  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      set({ notifications: notifications || [], loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch notifications', loading: false })
      console.error('Error fetching notifications:', error)
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      set((state) => ({
        notifications: state.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  subscribe: () => {
    if (get().subscribed) return

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          set((state) => ({
            notifications: [payload.new as Notification, ...state.notifications]
          }))
        }
      )
      .subscribe()

    set({ subscribed: true })
  },

  unsubscribe: () => {
    supabase.channel('notifications').unsubscribe()
    set({ subscribed: false })
  }
})) 
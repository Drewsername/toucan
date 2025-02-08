import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'
import { supabase } from '../supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface Task {
  id: string
  title: string
  description: string
  points: number
  creator_id: string
  assignee_id: string
  status: 'active' | 'completed' | 'cancelled'
  validation_required: boolean
  random_payout: boolean
  min_points?: number
  max_points?: number
  due_date?: string
}

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  subscribed: boolean
  channel: RealtimeChannel | null
  fetchTasks: () => Promise<void>
  createTask: (taskData: Omit<Task, 'id' | 'creator_id' | 'assignee_id' | 'status'>) => Promise<boolean>
  completeTask: (taskId: string) => Promise<boolean>
  deleteTask: (taskId: string) => Promise<boolean>
  subscribe: () => void
  unsubscribe: () => void
  cleanup: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  subscribed: false,
  channel: null,

  fetchTasks: async () => {
    const { session } = useAuthStore.getState()
    if (!session) return

    try {
      const response = await axios.get(`${API_URL}/tasks/active`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      set({ tasks: response.data })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      set({ error: 'Failed to fetch tasks' })
    }
  },

  createTask: async (taskData) => {
    const { session } = useAuthStore.getState()
    if (!session) return false

    try {
      const response = await axios.post(
        `${API_URL}/tasks`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      return true
    } catch (error) {
      console.error('Error creating task:', error)
      set({ error: 'Failed to create task' })
      return false
    }
  },

  completeTask: async (taskId: string) => {
    const { session } = useAuthStore.getState()
    if (!session) return false

    // Optimistic update
    const currentTasks = get().tasks
    const taskIndex = currentTasks.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      const updatedTasks = [...currentTasks]
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: 'completed' }
      set({ tasks: updatedTasks })
    }

    try {
      await axios.post(
        `${API_URL}/tasks/${taskId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      return true
    } catch (error) {
      console.error('Error completing task:', error)
      // Revert optimistic update
      set({ tasks: currentTasks, error: 'Failed to complete task' })
      return false
    }
  },

  deleteTask: async (taskId: string) => {
    const { session } = useAuthStore.getState()
    if (!session) return false

    // Optimistic update
    const currentTasks = get().tasks
    set({ tasks: currentTasks.filter(t => t.id !== taskId) })

    try {
      await axios.delete(
        `${API_URL}/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      // Revert optimistic update
      set({ tasks: currentTasks, error: 'Failed to delete task' })
      return false
    }
  },

  subscribe: () => {
    if (get().subscribed || get().channel) {
      console.log('Already subscribed to tasks channel')
      return
    }

    console.log('Setting up Supabase Realtime subscription for tasks...')

    const channel = supabase.channel('tasks-channel', {
      config: {
        broadcast: { self: true },
        presence: { key: 'tasks' },
      }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence state synced')
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Join presence:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Leave presence:', key, leftPresences)
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Received database change:', payload)
          const currentTasks = get().tasks

          switch (payload.eventType) {
            case 'INSERT': {
              const newTask = payload.new as Task
              set({ tasks: [...currentTasks, newTask] })
              break
            }
            case 'UPDATE': {
              const updatedTask = payload.new as Task
              const taskIndex = currentTasks.findIndex(t => t.id === updatedTask.id)
              if (taskIndex !== -1) {
                const updatedTasks = [...currentTasks]
                updatedTasks[taskIndex] = updatedTask
                set({ tasks: updatedTasks })
              }
              break
            }
            case 'DELETE': {
              const deletedTaskId = payload.old.id
              set({ tasks: currentTasks.filter(t => t.id !== deletedTaskId) })
              break
            }
          }
        }
      )

    // Track connection status
    channel.subscribe(async (status) => {
      console.log('Supabase subscription status:', status)
      if (status === 'SUBSCRIBED') {
        set({ subscribed: true })
        // Initial fetch after subscription is confirmed
        await get().fetchTasks()
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        set({ subscribed: false })
        // Attempt to resubscribe after a delay
        setTimeout(() => {
          // Only resubscribe if we haven't cleaned up
          if (get().channel === channel) {
            console.log('Attempting to resubscribe...')
            get().subscribe()
          }
        }, 5000)
      }
    })

    set({ channel })
  },

  unsubscribe: () => {
    const { channel } = get()
    if (channel) {
      console.log('Unsubscribing from Supabase Realtime...')
      channel.unsubscribe()
      set({ channel: null, subscribed: false })
    }
  },

  cleanup: () => {
    const { unsubscribe } = get()
    unsubscribe()
    set({ tasks: [], error: null })
  }
})) 
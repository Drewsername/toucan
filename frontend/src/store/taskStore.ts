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
  validated?: boolean
}

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  subscribed: boolean
  channel: RealtimeChannel | null
  fetchTasks: (retryCount?: number) => Promise<void>
  createTask: (taskData: Omit<Task, 'id' | 'creator_id' | 'assignee_id' | 'status'>) => Promise<boolean>
  completeTask: (taskId: string) => Promise<boolean>
  validateTask: (taskId: string) => Promise<boolean>
  deleteTask: (taskId: string) => Promise<boolean>
  subscribe: () => void
  unsubscribe: () => void
  cleanup: () => void
}

// Get base API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
console.log('API URL:', API_URL, 'Environment:', import.meta.env.MODE)

// Ensure HTTPS for production URLs
const ensureHttps = (url: string) => {
  if (import.meta.env.PROD && url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }
  return url
}

// Create axios instance with environment-specific config
const api = axios.create({
  // In development, use the proxy. In production, use backend subdomain
  baseURL: import.meta.env.DEV 
    ? '/api' 
    : 'https://backend.get-toucan.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Add request interceptor for logging
api.interceptors.request.use((config) => {
  if (config.headers) {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    const { session } = useAuthStore.getState()
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`
    }
  }

  // Log the full URL being requested
  const fullUrl = (config.baseURL || '') + (config.url || '')
  console.log('🔍 Making request to:', fullUrl)
  console.log('Request:', {
    url: config.url,
    baseURL: config.baseURL,
    fullUrl,
    method: config.method?.toUpperCase(),
    headers: config.headers
  })
  return config
})

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: {
        url: response.config.url,
        method: response.config.method,
        baseURL: response.config.baseURL,
        headers: response.config.headers
      }
    });
    return response;
  },
  (error) => {
    // Log the full error details
    console.error('❌ Response Error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        withCredentials: error.config?.withCredentials,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      }
    });

    // If it's a CORS error or network error, log additional details
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Network/CORS Error Details:', {
        isCORS: error.message.includes('CORS'),
        isPreflightError: error.response?.status === 502,
        originalRequest: {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers
        }
      });
    }

    return Promise.reject(error);
  }
);

// Maximum number of retries for fetching tasks
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  subscribed: false,
  channel: null,

  fetchTasks: async (retryCount = 0) => {
    const { session } = useAuthStore.getState()
    if (!session) return

    // Only set loading, don't clear tasks
    set({ loading: true, error: null })

    try {
      const response = await api.get('/tasks/active')
      // Ensure response.data is an array, default to empty array if not
      const tasks = Array.isArray(response.data) ? response.data : []
      set((state) => ({ 
        tasks,
        loading: false, 
        error: null 
      }))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      
      // Retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying fetch tasks (attempt ${retryCount + 1} of ${MAX_RETRIES}) after ${backoffDelay}ms...`);
        await delay(backoffDelay);
        return get().fetchTasks(retryCount + 1);
      } else {
        // Keep existing tasks on error, just update error state
        set((state) => ({ 
          error: 'Failed to fetch tasks',
          loading: false
        }))
      }
    }
  },

  createTask: async (taskData) => {
    const { session } = useAuthStore.getState()
    if (!session) return false

    try {
      await api.post(
        '/tasks',
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
      await api.post(
        `/tasks/${taskId}/complete`,
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

  validateTask: async (taskId: string) => {
    const { session } = useAuthStore.getState()
    if (!session) return false

    // Optimistic update
    const currentTasks = get().tasks
    const taskIndex = currentTasks.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      const updatedTasks = [...currentTasks]
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], validated: true }
      set({ tasks: updatedTasks })
    }

    try {
      await api.post(
        `/tasks/${taskId}/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      return true
    } catch (error) {
      console.error('Error validating task:', error)
      // Revert optimistic update
      set({ tasks: currentTasks, error: 'Failed to validate task' })
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
      await api.delete(
        `/tasks/${taskId}`,
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

    // Initial fetch of tasks (if we don't have any)
    const currentTasks = get().tasks
    if (currentTasks.length === 0) {
      get().fetchTasks()
    }

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
              set((state) => ({ 
                tasks: [...state.tasks, newTask] 
              }))
              break
            }
            case 'UPDATE': {
              const updatedTask = payload.new as Task
              set((state) => {
                const taskIndex = state.tasks.findIndex(t => t.id === updatedTask.id)
                if (taskIndex !== -1) {
                  const updatedTasks = [...state.tasks]
                  updatedTasks[taskIndex] = updatedTask
                  return { tasks: updatedTasks }
                }
                return state
              })
              break
            }
            case 'DELETE': {
              const deletedTaskId = payload.old.id
              set((state) => ({
                tasks: state.tasks.filter(t => t.id !== deletedTaskId)
              }))
              break
            }
          }
        }
      )

    // Track connection status
    channel.subscribe(async (status) => {
      console.log('Supabase subscription status:', status)
      if (status === 'SUBSCRIBED') {
        set({ subscribed: true, channel })
        // We don't need to fetch here since we already fetched at the start
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('Channel closed or error, cleaning up...')
        set({ subscribed: false })
        get().cleanup()
      }
    })
  },

  unsubscribe: () => {
    const { channel } = get()
    if (channel) {
      console.log('Unsubscribing from tasks channel...')
      channel.unsubscribe()
      set({ channel: null, subscribed: false })
    }
  },

  cleanup: () => {
    console.log('Cleaning up task store...')
    const { channel } = get()
    if (channel) {
      channel.unsubscribe()
    }
    set({
      channel: null,
      subscribed: false,
      tasks: [],
      loading: false,
      error: null
    })
  }
})) 
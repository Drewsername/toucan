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

// Get base API URL and ensure HTTPS in production
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
if (import.meta.env.PROD && !API_URL.startsWith('https://')) {
  API_URL = API_URL.replace('http://', 'https://')
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure proper CORS handling
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Handle all responses except server errors
  },
  // Add timeout
  timeout: 10000,
})

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Ensure headers are properly set for CORS
    if (config.headers) {
      config.headers['Accept'] = 'application/json';
      config.headers['Content-Type'] = 'application/json';
      // Add Authorization header if it exists
      const { session } = useAuthStore.getState();
      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    console.log('🚀 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data,
      withCredentials: config.withCredentials,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', {
      message: error.message,
      code: error.code,
      config: error.config
    });
    return Promise.reject(error);
  }
);

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

    set({ loading: true, error: null })

    try {
      const response = await api.get('/tasks/active')
      set({ tasks: response.data, loading: false, error: null })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      
      // Retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying fetch tasks (attempt ${retryCount + 1} of ${MAX_RETRIES}) after ${backoffDelay}ms...`);
        await delay(backoffDelay);
        return get().fetchTasks(retryCount + 1);
      } else {
        set({ 
          error: 'Failed to fetch tasks',
          loading: false
        })
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
        set({ subscribed: true, channel })
        // Initial fetch after subscription is confirmed
        await get().fetchTasks()
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
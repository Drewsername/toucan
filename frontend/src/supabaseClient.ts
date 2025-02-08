import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 1,
      heartbeat: 60,
      reconnectAfterMs: (retryCount: number) => {
        // Start with 1s delay, max 15s delay
        const baseDelay = 1000
        const maxDelay = 15000
        const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
        return delay
      }
    }
  },
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'toucan_session',
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  }
}) 
export interface Profile {
  id: string
  email: string
  pair_code: string | null
  paired: boolean
  points: number
  created_at: string
}

export interface Notification {
  id: string
  message: string
  read: boolean
  created_at: string
} 
export interface Profile {
  id: string
  email: string
  pair_code: string | null
  paired: boolean
  points: number
  created_at: string
  is_admin: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  points: number
  creator_id: string
  assignee_id: string
  status: 'active' | 'completed' | 'cancelled'
  validation_required?: boolean
  random_payout?: boolean
  min_points?: number
  max_points?: number
  due_date?: string
  created_at: string
}

export interface Offer {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  points_cost: number
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

export interface Notification {
  id: string
  message: string
  read: boolean
  created_at: string
} 
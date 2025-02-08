import { http, HttpResponse } from 'msw'
import type { Task, Offer, Profile } from '../types'

// Use relative URL for API requests
const baseUrl = '/api'

// Mock data
const mockProfile: Profile = {
  id: '123',
  email: 'test@example.com',
  pair_code: 'ABC123',
  paired: false,
  points: 100,
  created_at: new Date().toISOString(),
  is_admin: false
}

const mockTask: Task = {
  id: '456',
  creator_id: '123',
  assignee_id: '789',
  title: 'Test Task',
  description: 'Test Description',
  points: 50,
  status: 'active',
  created_at: new Date().toISOString()
}

const mockOffer: Offer = {
  id: '789',
  creator_id: '123',
  title: 'Test Offer',
  description: 'Test Description',
  category: 'test',
  points_cost: 50,
  status: 'active',
  created_at: new Date().toISOString()
}

export const handlers = [
  // Auth endpoints
  http.get(`${baseUrl}/auth/session/`, () => {
    return HttpResponse.json({ session: null })
  }),

  // Task endpoints
  http.get(`${baseUrl}/tasks/active/`, () => {
    return HttpResponse.json([mockTask])
  }),

  http.post(`${baseUrl}/tasks/`, async ({ request }) => {
    const body = await request.json()
    const newTask: Task = {
      ...mockTask,
      ...body as Partial<Task>
    }
    return HttpResponse.json(newTask)
  }),

  http.post(`${baseUrl}/tasks/:id/complete/`, () => {
    return HttpResponse.json({ message: 'Task completed' })
  }),

  http.delete(`${baseUrl}/tasks/:id/`, () => {
    return HttpResponse.json({ message: 'Task deleted successfully' })
  }),

  // Offer endpoints
  http.get(`${baseUrl}/offers/available/`, () => {
    return HttpResponse.json([mockOffer])
  }),

  http.post(`${baseUrl}/offers/`, async ({ request }) => {
    const body = await request.json()
    const newOffer: Offer = {
      ...mockOffer,
      ...body as Partial<Offer>
    }
    return HttpResponse.json(newOffer)
  }),

  http.post(`${baseUrl}/offers/:id/purchase/`, () => {
    return HttpResponse.json({ message: 'Offer purchased' })
  }),

  http.post(`${baseUrl}/offers/:id/spin/`, () => {
    return HttpResponse.json({
      discount_percentage: 25,
      discounted_cost: 37
    })
  }),

  // Pairing endpoints
  http.post(`${baseUrl}/pair/generate/`, () => {
    return HttpResponse.json({ code: 'ABC123' })
  }),

  http.post(`${baseUrl}/pair/:code/`, () => {
    return HttpResponse.json({ message: 'Pairing request sent' })
  }),

  http.post(`${baseUrl}/pair/approve/:userId/`, () => {
    return HttpResponse.json({ message: 'Pairing approved' })
  })
] 
import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../taskStore'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

describe('taskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      loading: false,
      error: null
    })
  })

  it('should initialize with empty state', () => {
    const state = useTaskStore.getState()
    expect(state.tasks).toEqual([])
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should fetch tasks', async () => {
    const { fetchTasks } = useTaskStore.getState()
    await fetchTasks()
    
    const state = useTaskStore.getState()
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0]).toMatchObject({
      title: 'Test Task',
      description: 'Test Description',
      points: 50
    })
  })

  it('should add a task', async () => {
    const { addTask } = useTaskStore.getState()
    await addTask('New Task', 'New Description', 75)
    
    const state = useTaskStore.getState()
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0]).toMatchObject({
      title: 'New Task',
      description: 'New Description',
      points: 75
    })
  })

  it('should complete a task', async () => {
    const { addTask, completeTask } = useTaskStore.getState()
    await addTask('Task to Complete')
    
    const state = useTaskStore.getState()
    const taskId = state.tasks[0].id
    await completeTask(taskId)
    
    const newState = useTaskStore.getState()
    expect(newState.tasks).toHaveLength(0)
  })

  it('should handle errors', async () => {
    // Mock API error
    server.use(
      http.get('*/tasks/active', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { fetchTasks } = useTaskStore.getState()
    await fetchTasks()
    
    const state = useTaskStore.getState()
    expect(state.error).toBe('Failed to fetch tasks')
  })
}) 
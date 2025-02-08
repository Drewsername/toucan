import { useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import TaskCard from './TaskCard'
import CreateTaskForm from './CreateTaskForm'

const TaskList = () => {
  const { tasks, loading, error, fetchTasks, subscribe, cleanup } = useTaskStore()
  const { profile } = useAuthStore()

  // Initial setup
  useEffect(() => {
    if (profile) {
      subscribe()
      return () => {
        // Clean up subscriptions and state when component unmounts
        cleanup()
      }
    }
  }, [profile?.id])

  // Periodic refresh as backup
  useEffect(() => {
    if (!profile) return

    const interval = setInterval(() => {
      fetchTasks()
    }, 30000) // Fetch every 30 seconds as backup

    return () => clearInterval(interval)
  }, [profile?.id])

  if (loading) {
    return <div className="p-4">Loading tasks...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  const assignedTasks = tasks.filter(task => task.assignee_id === profile?.id)
  const createdTasks = tasks.filter(task => task.creator_id === profile?.id)

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tasks</h2>
      
      {/* Create Task Form */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Create New Task</h3>
        <CreateTaskForm />
      </div>
      
      {/* Tasks assigned to me */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Tasks For Me</h3>
        {assignedTasks.length === 0 ? (
          <p className="text-gray-500">No tasks assigned to you</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {assignedTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isAssignee={true}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Tasks I created */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Tasks I Created</h3>
        {createdTasks.length === 0 ? (
          <p className="text-gray-500">You haven't created any tasks</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {createdTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isAssignee={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskList 
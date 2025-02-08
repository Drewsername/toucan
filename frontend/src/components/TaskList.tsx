import { useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import TaskCard from './TaskCard'
import CreateTaskForm from './CreateTaskForm'

export default function TaskList ()  {
  const { tasks, loading, error, subscribe, cleanup } = useTaskStore()
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

  // Show error if there is one and we have no tasks
  if (error && (!tasks || tasks.length === 0)) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  // Ensure tasks is an array before filtering
  const tasksArray = Array.isArray(tasks) ? tasks : []
  const assignedTasks = tasksArray.filter(task => task.assignee_id === profile?.id)
  const createdTasks = tasksArray.filter(task => task.creator_id === profile?.id)

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
        <h3 className="text-xl font-semibold mb-2">
          Tasks For Me
          {loading && <span className="ml-2 text-sm text-gray-500">(refreshing...)</span>}
        </h3>
        {assignedTasks.length === 0 ? (
          <p className="text-gray-500">
            {loading && tasks.length === 0 ? 'Loading tasks...' : 'No tasks assigned to you'}
          </p>
        ) : (
          <div className="grid w-full gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {assignedTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isAssignee={true}
                status={task.status}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Tasks I created */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">
          Tasks I Created
          {loading && <span className="ml-2 text-sm text-gray-500">(refreshing...)</span>}
        </h3>
        {createdTasks.length === 0 ? (
          <p className="text-gray-500">
            {loading && tasks.length === 0 ? 'Loading tasks...' : 'You haven\'t created any tasks'}
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {createdTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isAssignee={false}
                status={task.status}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'

export interface CreateTaskFormProps {}

const CreateTaskForm: React.FC<CreateTaskFormProps> = () => {
  const { createTask } = useTaskStore()
  const [isRandomPayout, setIsRandomPayout] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 0,
    validation_required: false,
    random_payout: false,
    min_points: undefined as number | undefined,
    max_points: undefined as number | undefined,
    due_date: undefined as string | undefined
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const taskData = {
      ...formData,
      points: isRandomPayout ? 0 : formData.points,
      random_payout: isRandomPayout,
      min_points: isRandomPayout ? formData.min_points : undefined,
      max_points: isRandomPayout ? formData.max_points : undefined
    }
    
    const success = await createTask(taskData)
    if (success) {
      // Reset form
      setFormData({
        title: '',
        description: '',
        points: 0,
        validation_required: false,
        random_payout: false,
        min_points: undefined,
        max_points: undefined,
        due_date: undefined
      })
      setIsRandomPayout(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? Number(value) 
          : value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      
      {/* Points */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Points
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isRandomPayout}
              onChange={(e) => setIsRandomPayout(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Random payout?</span>
          </label>
          
          {isRandomPayout ? (
            <div className="flex gap-4">
              <div>
                <label className="block text-sm">Min Points</label>
                <input
                  type="number"
                  name="min_points"
                  value={formData.min_points || ''}
                  onChange={handleChange}
                  required
                  min={0}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm">Max Points</label>
                <input
                  type="number"
                  name="max_points"
                  value={formData.max_points || ''}
                  onChange={handleChange}
                  required
                  min={0}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          ) : (
            <input
              type="number"
              name="points"
              value={formData.points}
              onChange={handleChange}
              required
              min={0}
              className="w-full p-2 border rounded"
            />
          )}
        </div>
      </div>
      
      {/* Validation Required */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="validation_required"
            checked={formData.validation_required}
            onChange={handleChange}
            className="mr-2"
          />
          <span className="text-sm">Requires validation?</span>
        </label>
      </div>
      
      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Due Date (optional)
        </label>
        <input
          type="datetime-local"
          name="due_date"
          value={formData.due_date || ''}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Create Task
      </button>
    </form>
  )
}

export default CreateTaskForm 
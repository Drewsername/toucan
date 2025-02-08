import { useState } from 'react'
import TaskList from './TaskList'
import { useAuthStore } from '../store/authStore'

const HomeScreen = () => {
  const { profile, partner } = useAuthStore()
  const [activeTab, setActiveTab] = useState('tasks')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.email}</h1>
          <p className="text-gray-600">
            Paired with: {partner?.email}
          </p>
        </div>
        <div className="text-lg">
          <span className="font-medium">Points: </span>
          <span>{profile?.points || 0}</span>
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex gap-4 border-b">
          <button
            className={`py-2 px-4 ${
              activeTab === 'tasks'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === 'offers'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('offers')}
          >
            Offers
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === 'stats'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'tasks' && <TaskList />}
        {activeTab === 'offers' && <div>Offers coming soon...</div>}
        {activeTab === 'stats' && <div>Stats coming soon...</div>}
      </div>
    </div>
  )
}

export default HomeScreen 
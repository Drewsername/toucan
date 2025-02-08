import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthComponent from './components/Auth'
import AuthCallback from './components/AuthCallback'
import AuthError from './components/AuthError'
import PairingScreen from './components/PairingScreen'
import HomeScreen from './components/HomeScreen'
import { useAuthStore } from './store/authStore'
import { useTaskStore } from './store/taskStore'
import logo from './assets/Transparent Logo.svg'
import './tailwind.css'
import { Button } from "@heroui/react"

function App() {
  const { session, loading, profile, initialize } = useAuthStore()
  const { subscribe, unsubscribe } = useTaskStore()

  useEffect(() => {
    initialize()
  }, [])

  // Set up Supabase subscriptions at app level
  useEffect(() => {
    if (session) {
      console.log('Setting up app-level subscriptions')
      subscribe()
      return () => {
        console.log('Cleaning up app-level subscriptions')
        unsubscribe()
      }
    }
  }, [session?.access_token])

  // Show loading screen until we have both session and profile (if logged in)
  if (loading || (session && !profile)) {
    return (
      <div className="loading" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <img 
          src={logo} 
          alt="Toucan Logo" 
          style={{ 
            width: '200px', 
            marginBottom: '1rem' 
          }} 
        />
        <p>Loading...</p>
      </div>
    )
  }

  return (
      <Router>
        <div className="app">
          <header style={{
            padding: '1rem',
            display: 'flex',
            justifyContent: 'center',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <img 
              src={logo} 
              alt="Toucan Logo" 
              style={{ 
                width: '20REM'
              }} 
            />
          </header>
          <Routes>
            <Route 
              path="/auth/callback" 
              element={<AuthCallback />} 
            />
            <Route 
              path="/auth/error" 
              element={<AuthError />} 
            />
            <Route 
              path="/login" 
              element={!session ? <AuthComponent /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={
                session ? (
                  profile?.paired ? (
                    <HomeScreen />
                  ) : (
                    <PairingScreen />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          </Routes>
        </div>
      </Router>
  )
}

export default App

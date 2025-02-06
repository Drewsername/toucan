import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import AuthComponent from './components/Auth'
import AuthCallback from './components/AuthCallback'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/auth/callback" 
            element={<AuthCallback />} 
          />
          <Route 
            path="/login" 
            element={!session ? <AuthComponent /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={
              session ? (
                <div className="authenticated">
                  <h2>Welcome, {session.user.email}</h2>
                  <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
                </div>
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

import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import AuthComponent from './components/Auth'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="app">
      {!session ? (
        <AuthComponent />
      ) : (
        <div className="authenticated">
          <h2>Welcome, {session.user.email}</h2>
          <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      )}
    </div>
  )
}

export default App

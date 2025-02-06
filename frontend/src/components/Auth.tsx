import { useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AuthComponent() {
  const navigate = useNavigate()
  const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin
  const redirectTo = `${baseUrl}/auth/callback`

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/')
      }
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
        redirectTo={redirectTo}
      />
    </div>
  )
} 
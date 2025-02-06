import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (!accessToken) {
          console.error('No access token found in URL')
          navigate('/auth/error')
          return
        }

        // Set the session using the access token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        })
        
        if (error) {
          console.error('Error setting session:', error.message)
          navigate('/auth/error')
          return
        }

        // Clear the URL hash
        window.history.replaceState(null, '', window.location.pathname)
        
        // Successful authentication
        navigate('/')
      } catch (error) {
        console.error('Error during auth callback:', error)
        navigate('/auth/error')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="auth-callback" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div className="loading">
        <h2>Completing authentication...</h2>
        <p>Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  )
} 
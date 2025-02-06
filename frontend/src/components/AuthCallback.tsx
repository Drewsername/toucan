import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { AuthError } from '@supabase/supabase-js'

export default function AuthCallback() {
  const navigate = useNavigate()

  const handleError = (error: AuthError | Error) => {
    console.error('Auth error:', error)
    
    // Handle specific Supabase error cases
    if (error instanceof AuthError) {
      switch (error.message) {
        case 'User already registered':
          navigate('/auth/error', { 
            state: { 
              error: 'This email is already associated with an account',
              errorCode: 'user-exists'
            }
          })
          break
        case 'Email link is invalid or has expired':
          navigate('/auth/error', {
            state: {
              error: 'The authentication link is invalid or has expired',
              errorCode: 'token-error'
            }
          })
          break
        default:
          navigate('/auth/error', {
            state: {
              error: error.message,
              errorCode: error.name
            }
          })
      }
    } else {
      // Handle generic errors
      navigate('/auth/error', {
        state: {
          error: error.message,
          errorCode: 'unknown'
        }
      })
    }
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (!accessToken) {
          throw new Error('No access token found in URL')
        }

        // Set the session using the access token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        })
        
        if (error) {
          throw error
        }

        // Clear the URL hash
        window.history.replaceState(null, '', window.location.pathname)
        
        // Successful authentication
        navigate('/')
      } catch (error) {
        handleError(error as AuthError | Error)
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
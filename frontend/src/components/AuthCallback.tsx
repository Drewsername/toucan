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
      // If the error is about an existing user but we have a valid session,
      // it means they successfully signed in
      if (error.message === 'User already registered') {
        // Check if we have a valid session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            // They're successfully logged in, redirect to home
            navigate('/')
            return
          }
          // No valid session, show the error
          navigate('/auth/error', { 
            state: { 
              error: 'This email is already associated with an account',
              errorCode: 'user-exists'
            }
          })
        })
      } else if (error.message === 'Email link is invalid or has expired') {
        navigate('/auth/error', {
          state: {
            error: 'The authentication link is invalid or has expired',
            errorCode: 'token-error'
          }
        })
      } else {
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
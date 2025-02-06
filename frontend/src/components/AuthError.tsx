import { useLocation, useNavigate } from 'react-router-dom'

export default function AuthError() {
  const location = useLocation()
  const navigate = useNavigate()
  const error = location.state?.error || 'An error occurred during authentication'
  const errorCode = location.state?.errorCode || 'unknown'

  const getErrorMessage = (code: string, defaultMessage: string) => {
    switch (code) {
      case 'user-exists':
        return 'An account with this email already exists. Please sign in with the original provider you used to create your account.'
      case 'invalid-provider':
        return 'Please use the same authentication method you used when creating your account.'
      case 'token-error':
        return 'There was a problem with your authentication token. Please try signing in again.'
      default:
        return defaultMessage
    }
  }

  return (
    <div className="auth-error" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      padding: '0 1rem'
    }}>
      <div style={{
        maxWidth: '500px',
        textAlign: 'center',
        backgroundColor: '#FEE2E2',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#DC2626', marginBottom: '1rem' }}>Authentication Error</h2>
        <p style={{ marginBottom: '1.5rem' }}>{getErrorMessage(errorCode, error)}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4B5563',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
} 
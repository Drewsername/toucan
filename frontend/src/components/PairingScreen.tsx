import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { usePairingStore } from '../store/pairingStore'

export default function PairingScreen() {
  const [pairingCode, setPairingCode] = useState('')
  const { profile } = useAuthStore()
  const { 
    generateCode, 
    pairWithPartner, 
    acceptPairing,
    checkPendingRequest,
    loading, 
    error,
    pendingRequest 
  } = usePairingStore()

  // Generate pairing code on mount if not exists
  useEffect(() => {
    if (!profile?.pair_code) {
      generateCode()
    }
  }, [profile?.pair_code])

  // Check for pending requests periodically
  useEffect(() => {
    checkPendingRequest()
    const interval = setInterval(checkPendingRequest, 5000)
    return () => clearInterval(interval)
  }, [])

  const handlePair = async () => {
    if (pairingCode.length === 8) {
      await pairWithPartner(pairingCode)
    }
  }

  const handleCopyCode = () => {
    if (profile?.pair_code) {
      navigator.clipboard.writeText(profile.pair_code)
    }
  }

  const handleAcceptPairing = async () => {
    await acceptPairing()
  }

  return (
    <div className="pairing-screen" style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ marginBottom: '1rem' }}>
        Welcome, {profile?.email?.split('@')[0] || 'User'}
      </h1>
      
      {pendingRequest ? (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Pairing Request</h3>
          <p>{pendingRequest.requesterEmail} wants to pair with you!</p>
          <button
            onClick={handleAcceptPairing}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.25rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Accepting...' : 'Accept Pairing'}
          </button>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: '2rem' }}>
            Pair with your partner to get started.
          </p>

          {/* Your pairing code section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3>Your Pairing Code</h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              padding: '0.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                value={profile?.pair_code || ''}
                readOnly
                placeholder={loading ? 'Generating code...' : 'Your pairing code'}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '0.5rem',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  letterSpacing: '0.25em'
                }}
              />
              <button
                onClick={handleCopyCode}
                disabled={!profile?.pair_code}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
              >
                📋
              </button>
            </div>
          </div>

          {/* Partner's code input */}
          <div style={{ marginBottom: '2rem' }}>
            <h3>Enter Partner's Code</h3>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <input
                type="text"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="Enter 8-digit code"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '1.25rem',
                  textAlign: 'center',
                  letterSpacing: '0.25em',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
          )}

          {/* Pair button */}
          <button
            onClick={handlePair}
            disabled={pairingCode.length !== 8 || loading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.25rem',
              backgroundColor: pairingCode.length === 8 ? '#4f46e5' : '#e5e7eb',
              color: pairingCode.length === 8 ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              cursor: pairingCode.length === 8 ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Pairing...' : 'Pair'}
          </button>
        </>
      )}
    </div>
  )
} 
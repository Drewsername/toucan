import { useAuthStore } from '../store/authStore'

export default function HomeScreen() {
  const { profile, partner } = useAuthStore()

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Welcome to Toucan</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Your Profile</h2>
        <p>Email: {profile?.email}</p>
        <p>Points: {profile?.points}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Your Partner</h2>
        {partner ? (
          <>
            <p>Email: {partner.email}</p>
            <p>Points: {partner.points}</p>
          </>
        ) : (
          <p>Not paired with anyone yet</p>
        )}
      </div>
    </div>
  )
} 
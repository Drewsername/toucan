import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../supabaseClient'

export default function AuthComponent() {
  // Get the base URL from environment or window location
  const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin
  const redirectTo = `${baseUrl}/auth/callback`

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
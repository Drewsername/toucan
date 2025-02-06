import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseClient'

export default function AuthComponent() {
  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
        redirectTo={`${window.location.origin}/auth/callback`}
      />
    </div>
  )
} 
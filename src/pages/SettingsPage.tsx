import { LoginForm } from '../components/LoginForm'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'

export function SettingsPage() {
  const { session, loading } = useSession()

  return (
    <>
      <h1 className="page-title">Innstillinger</h1>

      <h2 className="section-title">Konto</h2>
      {loading ? null : session ? (
        <div className="form">
          <p>
            Logget inn som <strong>{session.user.email}</strong>
          </p>
          <button type="button" className="button-secondary" onClick={() => supabase.auth.signOut()}>
            Logg ut
          </button>
        </div>
      ) : (
        <LoginForm />
      )}
    </>
  )
}

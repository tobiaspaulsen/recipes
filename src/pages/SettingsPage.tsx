import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'

export function SettingsPage() {
  const { session } = useSession()

  return (
    <>
      <h1 className="page-title">Innstillinger</h1>

      <h2 className="section-title">Konto</h2>
      <div className="form">
        <p>
          Logget inn som <strong>{session?.user.email}</strong>
        </p>
        <button type="button" className="button-secondary" onClick={() => supabase.auth.signOut()}>
          Logg ut
        </button>
      </div>
    </>
  )
}

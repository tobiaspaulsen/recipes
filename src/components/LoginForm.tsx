import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function logIn(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError('Feil e-post eller passord.')
  }

  return (
    <form className="form" onSubmit={logIn}>
      <div className="field">
        <label htmlFor="email">E-post</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Passord</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button-primary" disabled={busy || !email.trim() || !password}>
        {busy ? 'Logger inn…' : 'Logg inn'}
      </button>
    </form>
  )
}

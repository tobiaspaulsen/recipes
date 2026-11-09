import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function verify(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setError('Feil eller utløpt kode. Prøv igjen.')
  }

  if (!sent) {
    return (
      <form className="form" onSubmit={sendCode}>
        <p className="muted">Logg inn med e-post. Du får en kode tilsendt.</p>
        <div className="field">
          <label htmlFor="email">E-post</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button-primary" disabled={busy || !email.trim()}>
          {busy ? 'Sender…' : 'Send kode'}
        </button>
      </form>
    )
  }

  return (
    <form className="form" onSubmit={verify}>
      <p className="muted">Vi har sendt en kode til {email}. Skriv den inn her.</p>
      <div className="field">
        <label htmlFor="code">Kode</label>
        <input
          id="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button-primary" disabled={busy || !code.trim()}>
        {busy ? 'Logger inn…' : 'Logg inn'}
      </button>
      <button type="button" className="text-button" onClick={() => setSent(false)}>
        Bruk en annen e-post
      </button>
    </form>
  )
}

import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { importFromUrl } from '../lib/importRecipe'

export function NewRecipePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchRecipe(event: FormEvent) {
    event.preventDefault()
    if (busy || !url.trim()) return
    setBusy(true)
    setError(null)
    try {
      const draft = await importFromUrl(url.trim())
      // Replaced so closing the editor goes back to the recipe list, not here.
      navigate('/oppskrifter/ny/skriv', { replace: true, state: { draft } })
    } catch (failed) {
      setError(failed instanceof Error ? failed.message : 'Noe gikk galt. Prøv igjen.')
      setBusy(false)
    }
  }

  return (
    <div className="new-recipe">
      <button
        type="button"
        className="float-button glass"
        aria-label="Avbryt"
        onClick={() => (location.key === 'default' ? navigate('/oppskrifter', { replace: true }) : navigate(-1))}
      >
        <X size={22} aria-hidden />
      </button>

      <h1 className="page-title">Ny oppskrift</h1>

      <form className="form" onSubmit={fetchRecipe}>
        <div className="field">
          <label htmlFor="url">Lenke til oppskrift</label>
          <input
            id="url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            autoComplete="off"
            enterKeyHint="go"
          />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button-primary" disabled={busy || !url.trim()}>
          {busy ? 'Henter…' : 'Hent oppskrift'}
        </button>
      </form>

      <div className="new-recipe-or">
        <Link to="/oppskrifter/ny/skriv" replace className="button-secondary">
          Skriv inn selv
        </Link>
      </div>
    </div>
  )
}

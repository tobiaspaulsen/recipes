import { Camera, ChevronDown, ChevronUp, Minus, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useConfirm } from '../components/ConfirmDialog'
import { useFlip } from '../lib/motion'
import { photoUrl, preparePhoto, removePhoto, uploadPhoto, type PreparedPhoto } from '../lib/photos'
import { parseQuantity, UNITS } from '../lib/scale'
import { createRecipe, deleteRecipe, updateRecipe, useRecipe, type Recipe } from '../lib/useRecipes'

type IngredientDraft = {
  key: string
  id?: string
  quantity: string
  unit: string
  name: string
  note: string
}
type StepDraft = { key: string; id?: string; text: string }
type PhotoDraft = { kind: 'saved'; path: string } | { kind: 'new'; photo: PreparedPhoto } | null

const newIngredient = (): IngredientDraft => ({
  key: crypto.randomUUID(),
  quantity: '',
  unit: '',
  name: '',
  note: '',
})
const newStep = (): StepDraft => ({ key: crypto.randomUUID(), text: '' })

const quantityText = (quantity: number | null) =>
  quantity === null ? '' : String(Math.round(quantity * 1000) / 1000).replace('.', ',')

function parseMinutes(text: string) {
  const value = text.trim()
  if (!value) return null
  return /^\d+$/.test(value) ? Number(value) : undefined
}

function uniqueTags(text: string) {
  const seen = new Set<string>()
  return text
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag && !seen.has(tag.toLowerCase()) && seen.add(tag.toLowerCase()))
}

function moved<T>(list: T[], index: number, delta: number) {
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(index + delta, 0, item)
  return next
}

function growToFit(element: HTMLTextAreaElement | null) {
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export function RecipeEditorPage() {
  const { id } = useParams()
  return id ? <EditRecipe id={id} /> : <RecipeForm />
}

function EditRecipe({ id }: { id: string }) {
  const navigate = useNavigate()
  const { recipe, error } = useRecipe(id)

  if (recipe === null) return <Navigate to="/oppskrifter" replace />
  if (!recipe) {
    return (
      <div>
        <button type="button" className="float-button glass" aria-label="Avbryt" onClick={() => navigate(-1)}>
          <X size={22} aria-hidden />
        </button>
        {error && <p className="error recipe-error">{error}</p>}
      </div>
    )
  }
  return <RecipeForm key={id} recipe={recipe} />
}

function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [title, setTitle] = useState(recipe?.title ?? '')
  const [servings, setServings] = useState(recipe?.servings ?? 4)
  const [prep, setPrep] = useState(recipe?.prepMinutes?.toString() ?? '')
  const [cook, setCook] = useState(recipe?.cookMinutes?.toString() ?? '')
  const [tags, setTags] = useState(recipe?.tags.join(', ') ?? '')
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(() =>
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({
          key: i.id,
          id: i.id,
          quantity: quantityText(i.quantity),
          unit: i.unit ?? '',
          name: i.name,
          note: i.note ?? '',
        }))
      : [newIngredient(), newIngredient(), newIngredient()],
  )
  const [steps, setSteps] = useState<StepDraft[]>(() =>
    recipe?.steps.length ? recipe.steps.map((s) => ({ key: s.id, id: s.id, text: s.text })) : [newStep(), newStep()],
  )
  const [photo, setPhoto] = useState<PhotoDraft>(recipe?.imagePath ? { kind: 'saved', path: recipe.imagePath } : null)
  const [readingPhoto, setReadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirm, confirmDialog] = useConfirm()
  const ingredientsRef = useRef<HTMLUListElement>(null)
  const stepsRef = useRef<HTMLOListElement>(null)
  // False during the first layout pass, so the rows don't all fade in when the form opens.
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])
  useFlip(ingredientsRef, mounted.current)
  useFlip(stepsRef, mounted.current)

  const photoSrc = photo?.kind === 'new' ? photo.photo.preview : photo ? photoUrl(photo.path, 'small') : null
  const snapshot = JSON.stringify([title, servings, prep, cook, tags, ingredients, steps, photo])
  const initialSnapshot = useRef(snapshot)
  const dirty = snapshot !== initialSnapshot.current

  // Opened directly (e.g. after a reload) there is no history entry to go back to.
  function leave() {
    if (location.key === 'default') navigate(recipe ? `/oppskrifter/${recipe.id}` : '/oppskrifter', { replace: true })
    else navigate(-1)
  }

  async function close() {
    if (dirty && !(await confirm(recipe ? 'Forkaste endringene?' : 'Forkaste oppskriften?', 'Forkast'))) return
    leave()
  }

  const updateIngredient = (key: string, patch: Partial<IngredientDraft>) =>
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  const updateStep = (key: string, text: string) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, text } : s)))

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setReadingPhoto(true)
    try {
      setPhoto({ kind: 'new', photo: await preparePhoto(file) })
    } catch {
      fail('Kunne ikke lese bildet. Prøv et annet.')
    } finally {
      setReadingPhoto(false)
    }
  }

  function fail(message: string) {
    setError(message)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (busy) return

    if (!title.trim()) return fail('Oppskriften trenger en tittel.')

    const prepMinutes = parseMinutes(prep)
    const cookMinutes = parseMinutes(cook)
    if (prepMinutes === undefined || cookMinutes === undefined) return fail('Tid skrives som hele minutter.')

    const filled = ingredients.filter((i) => i.quantity.trim() || i.unit || i.name.trim() || i.note.trim())
    if (filled.some((i) => !i.name.trim())) return fail('En ingrediens mangler navn.')
    const parsed = filled.map((i) => ({ ...i, amount: parseQuantity(i.quantity) }))
    const unreadable = parsed.find((i) => i.amount === undefined)
    if (unreadable) return fail(`Forstår ikke mengden «${unreadable.quantity.trim()}» for ${unreadable.name.trim()}.`)

    const input = {
      title: title.trim(),
      servings,
      prepMinutes,
      cookMinutes,
      tags: uniqueTags(tags),
      imagePath: photo?.kind === 'saved' ? photo.path : null,
      ingredients: parsed.map((i) => ({
        id: i.id,
        quantity: i.amount ?? null,
        unit: i.unit || null,
        name: i.name.trim(),
        note: i.note.trim() || null,
      })),
      steps: steps.filter((s) => s.text.trim()).map((s) => ({ id: s.id, text: s.text.trim() })),
    }

    setError(null)
    setBusy(true)
    try {
      if (photo?.kind === 'new') input.imagePath = await uploadPhoto(photo.photo)
      if (recipe) {
        await updateRecipe(recipe.id, input)
        // Only after the recipe points at the new photo (or none); a leftover file is harmless.
        if (recipe.imagePath && recipe.imagePath !== input.imagePath) removePhoto(recipe.imagePath).catch(() => {})
        leave()
      } else {
        const id = await createRecipe(input)
        navigate(`/oppskrifter/${id}`, { replace: true })
      }
    } catch {
      fail('Kunne ikke lagre oppskriften. Sjekk nettet og prøv igjen.')
      setBusy(false)
    }
  }

  async function remove() {
    if (!recipe || busy) return
    if (!(await confirm(`Slette «${recipe.title}»? Dette kan ikke angres.`, 'Slett'))) return
    setBusy(true)
    try {
      await deleteRecipe(recipe.id, recipe.imagePath)
      navigate('/oppskrifter', { replace: true })
    } catch {
      fail('Kunne ikke slette oppskriften. Sjekk nettet og prøv igjen.')
      setBusy(false)
    }
  }

  return (
    <>
      <form className="editor" onSubmit={save} noValidate>
        <button type="button" className="float-button glass" aria-label="Avbryt" onClick={close}>
          <X size={22} aria-hidden />
        </button>
        <button type="submit" className="save-button" disabled={busy}>
          {busy ? 'Lagrer…' : 'Lagre'}
        </button>

        <h1 className="page-title">{recipe ? 'Endre oppskrift' : 'Ny oppskrift'}</h1>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="editor-photo">
          <label className="editor-photo-frame" aria-busy={readingPhoto}>
            {photoSrc ? (
              <img src={photoSrc} alt="" />
            ) : (
              <span className="editor-photo-empty">
                <Camera size={28} strokeWidth={1.5} aria-hidden />
                {readingPhoto ? 'Leser bildet…' : 'Legg til bilde'}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={photo ? 'Bytt bilde' : 'Legg til bilde'}
              onChange={(e) => {
                pickPhoto(e.target.files?.[0])
                // Lets the same file be picked again after removing it.
                e.target.value = ''
              }}
            />
          </label>
          {photo && (
            <div className="editor-photo-actions">
              <span className="editor-photo-hint">Trykk på bildet for å bytte</span>
              <button type="button" className="text-button" onClick={() => setPhoto(null)}>
                Fjern bilde
              </button>
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="title">Tittel</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
        </div>

        <div className="field">
          <span className="field-label">Porsjoner</span>
          <div className="stepper glass">
            <button type="button" aria-label="Færre porsjoner" onClick={() => setServings((s) => Math.max(1, s - 1))}>
              <Minus size={18} aria-hidden />
            </button>
            <span aria-live="polite">
              {servings} {servings === 1 ? 'person' : 'personer'}
            </span>
            <button type="button" aria-label="Flere porsjoner" onClick={() => setServings((s) => Math.min(50, s + 1))}>
              <Plus size={18} aria-hidden />
            </button>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="prep">Forberedelse (min)</label>
            <input id="prep" value={prep} onChange={(e) => setPrep(e.target.value)} inputMode="numeric" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="cook">Tilberedning (min)</label>
            <input id="cook" value={cook} onChange={(e) => setCook(e.target.value)} inputMode="numeric" autoComplete="off" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="tags">Tagger</label>
          <input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Kylling, Hverdag"
            autoComplete="off"
          />
        </div>

        <h2 className="section-title">Ingredienser</h2>
        <ul className="editor-ingredients" ref={ingredientsRef}>
          {ingredients.map((ingredient, index) => (
            <li key={ingredient.key} data-flip-id={ingredient.key}>
              <div className="editor-ingredient-main">
                <input
                  className="editor-input editor-quantity"
                  aria-label={`Mengde, ingrediens ${index + 1}`}
                  placeholder="Mengde"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(ingredient.key, { quantity: e.target.value })}
                  inputMode="decimal"
                  autoComplete="off"
                />
                <select
                  className="editor-input editor-unit"
                  aria-label={`Enhet, ingrediens ${index + 1}`}
                  value={ingredient.unit}
                  data-empty={!ingredient.unit || undefined}
                  onChange={(e) => updateIngredient(ingredient.key, { unit: e.target.value })}
                >
                  <option value="">Enhet</option>
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <input
                  className="editor-input"
                  aria-label={`Navn, ingrediens ${index + 1}`}
                  placeholder="Ingrediens"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(ingredient.key, { name: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="editor-ingredient-extra">
                <input
                  className="editor-input"
                  aria-label={`Notat, ingrediens ${index + 1}`}
                  placeholder="Notat, f.eks. finhakket"
                  value={ingredient.note}
                  onChange={(e) => updateIngredient(ingredient.key, { note: e.target.value })}
                  autoComplete="off"
                />
                <RowActions
                  label={`ingrediens ${index + 1}`}
                  index={index}
                  count={ingredients.length}
                  onMove={(delta) => setIngredients((prev) => moved(prev, index, delta))}
                  onRemove={() => setIngredients((prev) => prev.filter((i) => i.key !== ingredient.key))}
                />
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="text-button add-row" onClick={() => setIngredients((prev) => [...prev, newIngredient()])}>
          <Plus size={18} aria-hidden />
          Legg til ingrediens
        </button>

        <h2 className="section-title">Fremgangsmåte</h2>
        <ol className="editor-steps" ref={stepsRef}>
          {steps.map((step, index) => (
            <li key={step.key} data-flip-id={step.key}>
              <span className="step-number">{index + 1}</span>
              <textarea
                className="editor-input"
                aria-label={`Steg ${index + 1}`}
                placeholder="Beskriv steget"
                rows={1}
                value={step.text}
                ref={growToFit}
                onChange={(e) => {
                  updateStep(step.key, e.target.value)
                  growToFit(e.target)
                }}
              />
              <RowActions
                label={`steg ${index + 1}`}
                index={index}
                count={steps.length}
                onMove={(delta) => setSteps((prev) => moved(prev, index, delta))}
                onRemove={() => setSteps((prev) => prev.filter((s) => s.key !== step.key))}
              />
            </li>
          ))}
        </ol>
        <button type="button" className="text-button add-row" onClick={() => setSteps((prev) => [...prev, newStep()])}>
          <Plus size={18} aria-hidden />
          Legg til steg
        </button>

        {recipe && (
          <button type="button" className="text-button delete-recipe" onClick={remove} disabled={busy}>
            <Trash2 size={18} aria-hidden />
            Slett oppskrift
          </button>
        )}
      </form>
      {confirmDialog}
    </>
  )
}

type RowActionsProps = {
  label: string
  index: number
  count: number
  onMove: (delta: number) => void
  onRemove: () => void
}

function RowActions({ label, index, count, onMove, onRemove }: RowActionsProps) {
  return (
    <div className="editor-row-actions">
      <button type="button" aria-label={`Flytt ${label} opp`} disabled={index === 0} onClick={() => onMove(-1)}>
        <ChevronUp size={20} aria-hidden />
      </button>
      <button type="button" aria-label={`Flytt ${label} ned`} disabled={index === count - 1} onClick={() => onMove(1)}>
        <ChevronDown size={20} aria-hidden />
      </button>
      <button type="button" aria-label={`Fjern ${label}`} onClick={onRemove}>
        <Trash2 size={18} aria-hidden />
      </button>
    </div>
  )
}

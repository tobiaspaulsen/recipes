import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { IngredientList } from '../components/IngredientList'
import { useRecipe } from '../lib/useRecipes'
import { useWakeLock } from '../lib/useWakeLock'

export function CookPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { recipe, error } = useRecipe(id)
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  useWakeLock()

  // Opened directly (e.g. after a reload) there is no history entry to go back to.
  const close = () => (location.key === 'default' ? navigate(`/oppskrifter/${id}`, { replace: true }) : navigate(-1))

  if (recipe === null) return <Navigate to="/oppskrifter" replace />

  const closeButton = (
    <button type="button" className="float-button glass" aria-label="Avslutt matlaging" onClick={close}>
      <X size={22} aria-hidden />
    </button>
  )

  if (!recipe) {
    return (
      <div>
        {closeButton}
        {error && <p className="error recipe-error">{error}</p>}
      </div>
    )
  }

  const requested = Number(params.get('porsjoner'))
  const servings = Number.isInteger(requested) && requested > 0 ? requested : recipe.servings

  function toggleStep(index: number) {
    setDoneSteps((prev) => {
      const next = new Set(prev)
      if (!next.delete(index)) next.add(index)
      return next
    })
  }

  return (
    <article className="cook">
      {closeButton}

      <p className="cook-header">
        {servings} {servings === 1 ? 'person' : 'personer'}
      </p>
      <h1 className="page-title">{recipe.title}</h1>

      <h2 className="section-title">Ingredienser</h2>
      <IngredientList ingredients={recipe.ingredients} fromServings={recipe.servings} toServings={servings} />

      <h2 className="section-title">Fremgangsmåte</h2>
      <ol className="steps">
        {recipe.steps.map((step, index) => {
          const done = doneSteps.has(index)
          return (
            <li key={step.id}>
              <button
                type="button"
                className="step-toggle"
                role="checkbox"
                aria-checked={done}
                onClick={() => toggleStep(index)}
              >
                <span className="step-check" aria-hidden="true">
                  {done ? <Check size={16} strokeWidth={3} /> : index + 1}
                </span>
                <span>{step.text}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {recipe.notes && (
        <>
          <h2 className="section-title">Notater</h2>
          <p className="recipe-notes">{recipe.notes}</p>
        </>
      )}
    </article>
  )
}

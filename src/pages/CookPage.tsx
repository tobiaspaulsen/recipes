import { X } from 'lucide-react'
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
  // 0 is the ingredient overview; 1..n are the steps.
  const [index, setIndex] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const [gathered, setGathered] = useState<Set<string>>(new Set())
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
  const stepCount = recipe.steps.length
  const onIngredients = index === 0 || showIngredients

  function go(next: number) {
    setShowIngredients(false)
    setIndex(next)
    window.scrollTo(0, 0)
  }

  function toggleGathered(ingredientId: string) {
    setGathered((prev) => {
      const next = new Set(prev)
      if (!next.delete(ingredientId)) next.add(ingredientId)
      return next
    })
  }

  return (
    <div className="cook">
      {closeButton}

      <header className="cook-header">
        <span>{index === 0 ? recipe.title : `Steg ${index} av ${stepCount}`}</span>
        {index > 0 && (
          <button type="button" className="text-button" onClick={() => setShowIngredients((shown) => !shown)}>
            {showIngredients ? 'Tilbake til steget' : 'Ingredienser'}
          </button>
        )}
      </header>

      {onIngredients ? (
        <>
          <h1 className="cook-title">Ingredienser</h1>
          <p className="recipe-meta">
            {servings} {servings === 1 ? 'person' : 'personer'}
          </p>
          <IngredientList
            className="cook-ingredients"
            ingredients={recipe.ingredients}
            fromServings={recipe.servings}
            toServings={servings}
            checkable={{ isChecked: (ingredientId) => gathered.has(ingredientId), onToggle: toggleGathered }}
          />
        </>
      ) : (
        <p className="cook-step">{recipe.steps[index - 1]}</p>
      )}

      <div className="action-bar cook-bar glass">
        <button type="button" disabled={index === 0} onClick={() => go(index - 1)}>
          Forrige
        </button>
        {index < stepCount ? (
          <button type="button" className="primary" onClick={() => go(index + 1)}>
            {index === 0 ? 'Start' : 'Neste'}
          </button>
        ) : (
          <button type="button" className="primary" onClick={close}>
            Ferdig
          </button>
        )}
      </div>
    </div>
  )
}

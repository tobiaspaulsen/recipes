import { Check, ChevronLeft, CookingPot, Minus, Pencil, Plus, Utensils } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { IngredientList } from '../components/IngredientList'
import { siteName } from '../lib/importRecipe'
import { photoUrl } from '../lib/photos'
import { shoppingName } from '../lib/scale'
import { useDinnerSuggestions } from '../lib/useDinnerSuggestions'
import { recipeMeta, useRecipe } from '../lib/useRecipes'
import { useShoppingList } from '../lib/useShoppingList'

const countText = (count: number) => `${count} ${count === 1 ? 'vare' : 'varer'}`

// Survives leaving the page, so closing cooking mode comes back to the same servings.
const servingsByRecipe = new Map<string, number>()

export function RecipePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { recipe, error } = useRecipe(id)
  const { add } = useShoppingList()
  const { suggestions, error: suggestError, suggest, withdraw } = useDinnerSuggestions()
  const [chosenServings, setChosenServings] = useState<number | undefined>(() => servingsByRecipe.get(id))
  const [selecting, setSelecting] = useState(false)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<number | null>(null)
  const ingredientsRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (added === null) return
    const timer = setTimeout(() => setAdded(null), 6000)
    return () => clearTimeout(timer)
  }, [added])

  if (recipe === null) return <Navigate to="/oppskrifter" replace />

  const backLink = (
    <Link to="/oppskrifter" className="float-button glass" aria-label="Tilbake til oppskrifter">
      <ChevronLeft size={22} aria-hidden />
    </Link>
  )

  if (!recipe) {
    return (
      <article>
        {backLink}
        {error && <p className="error recipe-error">{error}</p>}
      </article>
    )
  }

  const servings = chosenServings ?? recipe.servings
  const suggested = suggestions?.some((suggestion) => suggestion.recipeId === recipe.id)
  const chosen = recipe.ingredients.filter((ingredient) => !skipped.has(ingredient.id))

  function setServings(next: number) {
    servingsByRecipe.set(id, next)
    setChosenServings(next)
  }

  function startSelecting() {
    setSkipped(new Set())
    setAdded(null)
    setSelecting(true)
    ingredientsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleIngredient(ingredientId: string) {
    setSkipped((prev) => {
      const next = new Set(prev)
      if (!next.delete(ingredientId)) next.add(ingredientId)
      return next
    })
  }

  function addChosen() {
    if (!recipe) return
    const names = chosen.map((ingredient) => shoppingName(ingredient, recipe.servings, servings))
    add(names, recipe.id)
    setSelecting(false)
    setAdded(names.length)
  }

  return (
    <article>
      {backLink}
      <Link to={`/oppskrifter/${recipe.id}/rediger`} className="float-button float-button-right glass" aria-label="Endre oppskrift">
        <Pencil size={19} aria-hidden />
      </Link>

      {recipe.imagePath ? (
        <div className="recipe-photo">
          <img src={photoUrl(recipe.imagePath, 'full')} alt="" />
        </div>
      ) : (
        <div className="photo-fallback recipe-photo" aria-hidden="true">
          <CookingPot size={48} strokeWidth={1.5} />
        </div>
      )}

      <p className="recipe-meta">{recipeMeta(recipe)}</p>
      <h1 className="page-title">{recipe.title}</h1>

      <div className="suggest-row">
        {suggested ? (
          <>
            <span className="suggest-status">
              <Check size={16} aria-hidden />
              Foreslått til middag
            </span>
            <button type="button" className="text-button" onClick={() => withdraw(recipe.id)}>
              Trekk tilbake
            </button>
          </>
        ) : (
          <button
            type="button"
            className="pill-button glass-static"
            disabled={!suggestions}
            onClick={() => suggest(recipe.id)}
          >
            <Utensils size={16} aria-hidden />
            Foreslå til middag
          </button>
        )}
      </div>
      {suggestError && <p className="error">{suggestError}</p>}

      <div className="stepper glass-static">
        <button
          type="button"
          aria-label="Færre porsjoner"
          onClick={() => setServings(Math.max(1, servings - 1))}
        >
          <Minus size={18} aria-hidden />
        </button>
        <span aria-live="polite">
          {servings} {servings === 1 ? 'person' : 'personer'}
        </span>
        <button
          type="button"
          aria-label="Flere porsjoner"
          onClick={() => setServings(Math.min(20, servings + 1))}
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>

      <h2 className="section-title" ref={ingredientsRef}>
        Ingredienser
      </h2>
      <IngredientList
        className="choose-ingredients"
        ingredients={recipe.ingredients}
        fromServings={recipe.servings}
        toServings={servings}
        checkable={
          selecting ? { isChecked: (ingredientId) => !skipped.has(ingredientId), onToggle: toggleIngredient } : undefined
        }
      />

      <h2 className="section-title">Fremgangsmåte</h2>
      <ol className="steps">
        {recipe.steps.map((step, index) => (
          <li key={step.id}>
            <span className="step-number">{index + 1}</span>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>

      {recipe.notes && (
        <>
          <h2 className="section-title">Notater</h2>
          <p className="recipe-notes">{recipe.notes}</p>
        </>
      )}

      {recipe.sourceUrl && (
        <p className="recipe-source">
          Kilde:{' '}
          <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
            {siteName(recipe.sourceUrl)}
          </a>
        </p>
      )}

      {added !== null && (
        <div className="toast glass" role="status">
          <span>La til {countText(added)}</span>
          <Link to="/" className="text-button">
            Se listen
          </Link>
        </div>
      )}

      <div className="add-bar-space" />
      <div className="action-bar glass">
        {selecting ? (
          <>
            <button type="button" className="primary" disabled={chosen.length === 0} onClick={addChosen}>
              Legg til {countText(chosen.length)}
            </button>
            <button type="button" onClick={() => setSelecting(false)}>
              Avbryt
            </button>
          </>
        ) : (
          <>
            <button type="button" className="primary" onClick={startSelecting}>
              Legg i handleliste
            </button>
            <button type="button" onClick={() => navigate(`/oppskrifter/${recipe.id}/lag?porsjoner=${servings}`)}>
              Start matlaging
            </button>
          </>
        )}
      </div>
    </article>
  )
}

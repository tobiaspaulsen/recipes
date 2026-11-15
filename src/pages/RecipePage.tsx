import { Check, ChevronLeft, CookingPot, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { formatAmount, scaleQuantity } from '../lib/scale'
import { recipeMeta, useRecipe, type Ingredient } from '../lib/useRecipes'
import { useShoppingList } from '../lib/useShoppingList'

function amountText(ingredient: Ingredient, fromServings: number, toServings: number) {
  if (ingredient.quantity === null) return ''
  const quantity = ingredient.scalable ? scaleQuantity(ingredient.quantity, fromServings, toServings) : ingredient.quantity
  return formatAmount(quantity, ingredient.unit)
}

const countText = (count: number) => `${count} ${count === 1 ? 'vare' : 'varer'}`

export function RecipePage() {
  const { id = '' } = useParams()
  const { recipe, error } = useRecipe(id)
  const { add } = useShoppingList()
  const [chosenServings, setServings] = useState<number | null>(null)
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
  const chosen = recipe.ingredients.filter((ingredient) => !skipped.has(ingredient.id))

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
    const names = chosen.map((ingredient) =>
      [amountText(ingredient, recipe.servings, servings), ingredient.name].filter(Boolean).join(' '),
    )
    add(names, recipe.id)
    setSelecting(false)
    setAdded(names.length)
  }

  return (
    <article>
      {backLink}

      <div className="photo-fallback recipe-photo" aria-hidden="true">
        <CookingPot size={48} strokeWidth={1.5} />
      </div>

      <p className="recipe-meta">{recipeMeta(recipe)}</p>
      <h1 className="page-title">{recipe.title}</h1>

      <div className="stepper glass">
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
      <ul className="ingredients" data-selecting={selecting || undefined}>
        {recipe.ingredients.map((ingredient) => {
          const amount = <span className="amount">{amountText(ingredient, recipe.servings, servings)}</span>
          const name = (
            <span>
              {ingredient.name}
              {ingredient.note && <span className="note">, {ingredient.note}</span>}
            </span>
          )
          const selected = !skipped.has(ingredient.id)
          return (
            <li key={ingredient.id}>
              {selecting ? (
                <button
                  type="button"
                  className="ingredient-toggle"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleIngredient(ingredient.id)}
                >
                  <span className="check" data-on={selected} aria-hidden="true">
                    {selected && <Check size={14} strokeWidth={3} />}
                  </span>
                  {amount}
                  {name}
                </button>
              ) : (
                <>
                  {amount}
                  {name}
                </>
              )}
            </li>
          )
        })}
      </ul>

      <h2 className="section-title">Fremgangsmåte</h2>
      <ol className="steps">
        {recipe.steps.map((step, index) => (
          <li key={index}>
            <span className="step-number">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

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
            <button type="button" disabled>
              Start matlaging
            </button>
          </>
        )}
      </div>
    </article>
  )
}

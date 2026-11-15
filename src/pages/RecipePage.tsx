import { ChevronLeft, CookingPot, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { formatAmount, scaleQuantity } from '../lib/scale'
import { recipeMeta, useRecipe } from '../lib/useRecipes'

export function RecipePage() {
  const { id = '' } = useParams()
  const { recipe, error } = useRecipe(id)
  const [chosenServings, setServings] = useState<number | null>(null)

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

      <h2 className="section-title">Ingredienser</h2>
      <ul className="ingredients">
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            <span className="amount">
              {ingredient.quantity === null
                ? ''
                : formatAmount(
                    !ingredient.scalable
                      ? ingredient.quantity
                      : scaleQuantity(ingredient.quantity, recipe.servings, servings),
                    ingredient.unit,
                  )}
            </span>
            <span>
              {ingredient.name}
              {ingredient.note && <span className="note">, {ingredient.note}</span>}
            </span>
          </li>
        ))}
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

      <div className="add-bar-space" />
      <div className="action-bar glass">
        <button type="button" className="primary" disabled>
          Legg i handleliste
        </button>
        <button type="button" disabled>
          Start matlaging
        </button>
      </div>
    </article>
  )
}

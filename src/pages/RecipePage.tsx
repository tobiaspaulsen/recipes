import { ChevronLeft, CookingPot, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { recipes } from '../data/recipes'
import { formatAmount, scaleQuantity } from '../lib/scale'

export function RecipePage() {
  const { id } = useParams()
  const recipe = recipes.find((r) => r.id === id)
  const [servings, setServings] = useState(recipe?.servings ?? 4)

  if (!recipe) return <Navigate to="/oppskrifter" replace />

  return (
    <article>
      <Link to="/oppskrifter" className="back-link">
        <ChevronLeft size={20} aria-hidden />
        Oppskrifter
      </Link>

      <div className="photo-fallback recipe-photo" aria-hidden="true">
        <CookingPot size={44} strokeWidth={1.5} />
      </div>

      <p className="recipe-meta">{[`${recipe.minutes} min`, ...recipe.tags].join(' · ')}</p>
      <h1 className="page-title">{recipe.title}</h1>

      <div className="stepper glass">
        <button
          type="button"
          aria-label="Færre porsjoner"
          onClick={() => setServings((s) => Math.max(1, s - 1))}
        >
          <Minus size={18} aria-hidden />
        </button>
        <span aria-live="polite">
          {servings} {servings === 1 ? 'person' : 'personer'}
        </span>
        <button
          type="button"
          aria-label="Flere porsjoner"
          onClick={() => setServings((s) => Math.min(20, s + 1))}
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>

      <h2 className="section-title">Ingredienser</h2>
      <ul className="ingredients">
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.name}>
            <span className="amount">
              {ingredient.quantity === null
                ? ''
                : formatAmount(
                    ingredient.scalable === false
                      ? ingredient.quantity
                      : scaleQuantity(ingredient.quantity, recipe.servings, servings),
                    ingredient.unit,
                  )}
            </span>
            <span>{ingredient.name}</span>
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
    </article>
  )
}

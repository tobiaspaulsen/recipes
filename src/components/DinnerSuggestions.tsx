import { ChevronRight, CookingPot, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '../lib/photos'
import { shoppingName } from '../lib/scale'
import { useDinnerSuggestions, type SuggestedRecipe } from '../lib/useDinnerSuggestions'
import { recipeMeta, useRecipe } from '../lib/useRecipes'
import { IngredientList } from './IngredientList'

type Props = {
  onAdd: (names: string[], recipeId: string) => void
}

export function DinnerSuggestions({ onAdd }: Props) {
  const { suggestions, userId, withdraw } = useDinnerSuggestions()
  if (!suggestions) return null

  return suggestions.map((suggestion) => (
    <SuggestionCard
      key={suggestion.id}
      recipeId={suggestion.recipeId}
      summary={suggestion.recipe}
      own={suggestion.suggestedBy === userId}
      onDismiss={() => withdraw(suggestion.recipeId)}
      onAdd={(names) => {
        onAdd(names, suggestion.recipeId)
        withdraw(suggestion.recipeId)
      }}
    />
  ))
}

type CardProps = {
  recipeId: string
  summary: SuggestedRecipe
  own: boolean
  onDismiss: () => void
  onAdd: (names: string[]) => void
}

function SuggestionCard({ recipeId, summary, own, onDismiss, onAdd }: CardProps) {
  const { recipe } = useRecipe(recipeId)
  const [picking, setPicking] = useState(false)
  const [unticked, setUnticked] = useState<Set<string>>(new Set())
  const chosen = recipe ? recipe.ingredients.filter((ingredient) => !unticked.has(ingredient.id)) : []
  const labelId = `dinner-${recipeId}`

  function toggle(id: string) {
    setUnticked((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  function addChosen() {
    if (recipe) onAdd(chosen.map((ingredient) => shoppingName(ingredient, recipe.servings, recipe.servings)))
  }

  return (
    <section className="dinner" aria-labelledby={labelId}>
      <div className="dinner-head">
        <h2 id={labelId}>{own ? 'Ditt forslag til middag' : 'Forslag til middag'}</h2>
        <button
          type="button"
          className="dinner-skip"
          aria-label={own ? 'Trekk tilbake forslaget' : 'Avvis forslaget'}
          onClick={onDismiss}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <Link to={`/oppskrifter/${recipeId}`} className="dinner-recipe">
        {summary.imagePath ? (
          <img src={photoUrl(summary.imagePath, 'small')} alt="" />
        ) : (
          <div className="photo-fallback" aria-hidden="true">
            <CookingPot size={24} strokeWidth={1.5} />
          </div>
        )}
        <span>
          <span className="dinner-title">{summary.title}</span>
          <span className="recipe-meta">{recipeMeta(summary)}</span>
        </span>
        <ChevronRight size={20} aria-hidden />
      </Link>

      {picking && recipe && (
        <>
          <p className="dinner-servings">
            Til {recipe.servings} {recipe.servings === 1 ? 'person' : 'personer'}
          </p>
          <IngredientList
            className="choose-ingredients"
            ingredients={recipe.ingredients}
            fromServings={recipe.servings}
            toServings={recipe.servings}
            checkable={{
              isChecked: (id) => !unticked.has(id),
              onToggle: toggle,
            }}
          />
        </>
      )}

      <div className="dinner-actions">
        {picking ? (
          <>
            <button
              type="button"
              className="pill-button glass-static"
              data-primary
              disabled={chosen.length === 0}
              onClick={addChosen}
            >
              Legg til {chosen.length} {chosen.length === 1 ? 'vare' : 'varer'}
            </button>
            <button type="button" className="text-button" onClick={() => setPicking(false)}>
              Avbryt
            </button>
          </>
        ) : (
          <button
            type="button"
            className="pill-button glass-static"
            disabled={!recipe || recipe.ingredients.length === 0}
            onClick={() => {
              setUnticked(new Set())
              setPicking(true)
            }}
          >
            <Plus size={16} aria-hidden />
            Legg i handleliste
          </button>
        )}
      </div>
    </section>
  )
}

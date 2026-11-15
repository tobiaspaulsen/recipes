import { Check } from 'lucide-react'
import { ingredientAmount } from '../lib/scale'
import type { Ingredient } from '../lib/useRecipes'

type Props = {
  ingredients: Ingredient[]
  fromServings: number
  toServings: number
  className?: string
  checkable?: { isChecked: (id: string) => boolean; onToggle: (id: string) => void }
}

export function IngredientList({ ingredients, fromServings, toServings, className, checkable }: Props) {
  return (
    <ul className={className ? `ingredients ${className}` : 'ingredients'} data-checkable={checkable ? true : undefined}>
      {ingredients.map((ingredient) => {
        const amount = <span className="amount">{ingredientAmount(ingredient, fromServings, toServings)}</span>
        const name = (
          <span>
            {ingredient.name}
            {ingredient.note && <span className="note">, {ingredient.note}</span>}
          </span>
        )
        if (!checkable) {
          return (
            <li key={ingredient.id}>
              {amount}
              {name}
            </li>
          )
        }
        const checked = checkable.isChecked(ingredient.id)
        return (
          <li key={ingredient.id}>
            <button
              type="button"
              className="ingredient-toggle"
              role="checkbox"
              aria-checked={checked}
              onClick={() => checkable.onToggle(ingredient.id)}
            >
              <span className="check" data-on={checked} aria-hidden="true">
                {checked && <Check size={14} strokeWidth={3} />}
              </span>
              {amount}
              {name}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

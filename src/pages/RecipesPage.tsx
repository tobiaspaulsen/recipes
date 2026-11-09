import { CookingPot } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recipes } from '../data/recipes'

export function RecipesPage() {
  return (
    <>
      <h1 className="page-title">Oppskrifter</h1>
      <ul className="recipe-grid">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <Link to={`/oppskrifter/${recipe.id}`}>
              <div className="photo-fallback" aria-hidden="true">
                <CookingPot size={32} strokeWidth={1.5} />
              </div>
              <span className="recipe-card-title">{recipe.title}</span>
              <span className="recipe-meta">{[`${recipe.minutes} min`, ...recipe.tags].join(' · ')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

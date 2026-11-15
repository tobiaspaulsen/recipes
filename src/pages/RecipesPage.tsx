import { CookingPot } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recipeMeta, useRecipes } from '../lib/useRecipes'

export function RecipesPage() {
  const { recipes, error } = useRecipes()

  return (
    <>
      <h1 className="page-title">Oppskrifter</h1>

      {error && <p className="error">{error}</p>}

      {recipes?.length === 0 && (
        <div className="empty">
          <h2>Ingen oppskrifter ennå</h2>
          <p>Oppskrifter dere legger inn, dukker opp her.</p>
        </div>
      )}

      <ul className="recipe-grid">
        {recipes?.map((recipe) => (
          <li key={recipe.id}>
            <Link to={`/oppskrifter/${recipe.id}`}>
              <div className="photo-fallback" aria-hidden="true">
                <CookingPot size={32} strokeWidth={1.5} />
              </div>
              <span className="recipe-card-title">{recipe.title}</span>
              <span className="recipe-meta">{recipeMeta(recipe)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

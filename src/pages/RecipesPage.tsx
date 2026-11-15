import { CookingPot, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recipeMeta, useRecipes } from '../lib/useRecipes'

export function RecipesPage() {
  const { recipes, error } = useRecipes()

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Oppskrifter</h1>
        <Link to="/oppskrifter/ny" className="icon-button glass" aria-label="Ny oppskrift">
          <Plus size={22} aria-hidden />
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {recipes?.length === 0 && (
        <div className="empty">
          <h2>Ingen oppskrifter ennå</h2>
          <p>Trykk + for å legge inn den første.</p>
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

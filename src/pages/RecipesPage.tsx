import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recipes } from '../data/recipes'

export function RecipesPage() {
  return (
    <>
      <h1 className="page-title">Oppskrifter</h1>
      <ul className="recipe-list">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <Link to={`/oppskrifter/${recipe.id}`}>
              <span>
                <span className="recipe-list-title">{recipe.title}</span>
                <span className="recipe-meta">{[`${recipe.minutes} min`, ...recipe.tags].join(' · ')}</span>
              </span>
              <ChevronRight size={20} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

import { CookingPot, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '../lib/photos'
import { recipeMeta, useRecipes, type RecipeSummary } from '../lib/useRecipes'

// Kept between visits, so going back from a recipe shows the same results.
let lastQuery = ''

const lower = (text: string) => text.toLocaleLowerCase('nb')

// Every word must appear in the title, a tag or an ingredient; title matches sort first.
function search(recipes: RecipeSummary[], query: string) {
  const words = lower(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return recipes
  return recipes
    .map((recipe) => {
      const title = lower(recipe.title)
      const rest = lower([...recipe.tags, ...recipe.ingredientNames].join('\n'))
      const titleHits = words.filter((word) => title.includes(word)).length
      const found = words.every((word) => title.includes(word) || rest.includes(word))
      return { recipe, titleHits, found }
    })
    .filter((result) => result.found)
    .sort((a, b) => b.titleHits - a.titleHits)
    .map((result) => result.recipe)
}

export function RecipesPage() {
  const { recipes, error } = useRecipes()
  const [query, setQuery] = useState(lastQuery)
  const results = recipes && search(recipes, query)

  function changeQuery(next: string) {
    lastQuery = next
    setQuery(next)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Oppskrifter</h1>
        <Link to="/oppskrifter/ny" className="icon-button glass" aria-label="Ny oppskrift">
          <Plus size={22} aria-hidden />
        </Link>
      </div>

      {recipes && recipes.length > 0 && (
        <form
          className="search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            // Hides the keyboard so the results are visible.
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          }}
        >
          <Search size={18} aria-hidden />
          <input
            type="search"
            aria-label="Søk i oppskrifter"
            placeholder="Søk etter oppskrift eller ingrediens"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            enterKeyHint="search"
            autoComplete="off"
          />
          {query && (
            <button type="button" aria-label="Tøm søket" onClick={() => changeQuery('')}>
              <X size={18} aria-hidden />
            </button>
          )}
        </form>
      )}

      {error && <p className="error">{error}</p>}

      {recipes?.length === 0 && (
        <div className="empty">
          <h2>Ingen oppskrifter ennå</h2>
          <p>Trykk + for å legge inn den første.</p>
        </div>
      )}

      {recipes && recipes.length > 0 && results?.length === 0 && (
        <div className="empty">
          <h2>Ingen treff</h2>
          <p>Ingen oppskrifter med «{query.trim()}».</p>
        </div>
      )}

      <ul className="recipe-grid">
        {results?.map((recipe) => (
          <li key={recipe.id}>
            <Link to={`/oppskrifter/${recipe.id}`}>
              {recipe.imagePath ? (
                <img className="recipe-card-photo" src={photoUrl(recipe.imagePath, 'small')} alt="" loading="lazy" />
              ) : (
                <div className="photo-fallback" aria-hidden="true">
                  <CookingPot size={32} strokeWidth={1.5} />
                </div>
              )}
              <span className="recipe-card-title">{recipe.title}</span>
              <span className="recipe-meta">{recipeMeta(recipe)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

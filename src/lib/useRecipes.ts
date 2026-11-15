import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Ingredient = {
  id: string
  quantity: number | null
  unit: string | null
  name: string
  note: string | null
  scalable: boolean
}

export type RecipeSummary = {
  id: string
  title: string
  tags: string[]
  minutes: number | null
}

export type Recipe = RecipeSummary & {
  servings: number
  ingredients: Ingredient[]
  steps: string[]
}

type SummaryRow = {
  id: string
  title: string
  tags: string[]
  prep_minutes: number | null
  cook_minutes: number | null
}

type RecipeRow = SummaryRow & {
  servings: number
  ingredients: Ingredient[]
  steps: { text: string }[]
}

const toSummary = (row: SummaryRow): RecipeSummary => ({
  id: row.id,
  title: row.title,
  tags: row.tags,
  minutes: row.prep_minutes === null && row.cook_minutes === null ? null : (row.prep_minutes ?? 0) + (row.cook_minutes ?? 0),
})

// Kept between mounts so going back shows the last result at once and scroll restoration has content to land on.
let listCache: RecipeSummary[] | null = null
const recipeCache = new Map<string, Recipe>()

export function useRecipes() {
  const [recipes, setRecipes] = useState(listCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase
      .from('recipes')
      .select('id, title, tags, prep_minutes, cook_minutes')
      .order('title')
      .then(({ data, error }) => {
        if (!active) return
        if (error) return setError('Kunne ikke hente oppskriftene.')
        listCache = data.map(toSummary)
        setRecipes(listCache)
      })
    return () => {
      active = false
    }
  }, [])

  return { recipes, error }
}

export function useRecipe(id: string) {
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(() => recipeCache.get(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase
      .from('recipes')
      .select(
        'id, title, tags, prep_minutes, cook_minutes, servings, ingredients (id, quantity, unit, name, note, scalable), steps (text)',
      )
      .eq('id', id)
      .order('position', { referencedTable: 'ingredients' })
      .order('position', { referencedTable: 'steps' })
      .maybeSingle<RecipeRow>()
      .then(({ data, error }) => {
        if (!active) return
        // An id that isn't a uuid (an old link) is a 22P02 error rather than an empty result.
        if (error) return error.code === '22P02' ? setRecipe(null) : setError('Kunne ikke hente oppskriften.')
        if (!data) return setRecipe(null)
        const loaded = { ...toSummary(data), servings: data.servings, ingredients: data.ingredients, steps: data.steps.map((s) => s.text) }
        recipeCache.set(id, loaded)
        setRecipe(loaded)
      })
    return () => {
      active = false
    }
  }, [id])

  return { recipe, error }
}

export function recipeMeta({ minutes, tags }: RecipeSummary) {
  return [...(minutes === null ? [] : [`${minutes} min`]), ...tags].join(' · ')
}

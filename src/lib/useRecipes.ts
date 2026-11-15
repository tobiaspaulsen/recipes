import { useEffect, useState } from 'react'
import { removePhoto } from './photos'
import { supabase } from './supabase'

export type Ingredient = {
  id: string
  quantity: number | null
  unit: string | null
  name: string
  note: string | null
  section: string | null
}

export type RecipeSummary = {
  id: string
  title: string
  tags: string[]
  minutes: number | null
  imagePath: string | null
}

export type Step = { id: string; text: string }

export type Recipe = RecipeSummary & {
  servings: number
  prepMinutes: number | null
  cookMinutes: number | null
  notes: string | null
  ingredients: Ingredient[]
  steps: Step[]
}

type SummaryRow = {
  id: string
  title: string
  tags: string[]
  prep_minutes: number | null
  cook_minutes: number | null
  image_path: string | null
}

type RecipeRow = SummaryRow & {
  servings: number
  notes: string | null
  ingredients: Ingredient[]
  steps: Step[]
}

const toSummary = (row: SummaryRow): RecipeSummary => ({
  id: row.id,
  title: row.title,
  tags: row.tags,
  minutes: row.prep_minutes === null && row.cook_minutes === null ? null : (row.prep_minutes ?? 0) + (row.cook_minutes ?? 0),
  imagePath: row.image_path,
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
      .select('id, title, tags, prep_minutes, cook_minutes, image_path')
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
        'id, title, tags, prep_minutes, cook_minutes, image_path, servings, notes, ingredients (id, quantity, unit, name, note, section), steps (id, text)',
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
        const loaded = {
          ...toSummary(data),
          servings: data.servings,
          prepMinutes: data.prep_minutes,
          cookMinutes: data.cook_minutes,
          notes: data.notes,
          ingredients: data.ingredients,
          steps: data.steps,
        }
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

export type RecipeInput = {
  title: string
  servings: number
  prepMinutes: number | null
  cookMinutes: number | null
  tags: string[]
  imagePath: string | null
  notes: string | null
  // Rows without an id are new.
  ingredients: (Omit<Ingredient, 'id'> & { id?: string })[]
  steps: { id?: string; text: string }[]
}

const recipeRow = (recipe: RecipeInput) => ({
  title: recipe.title,
  servings: recipe.servings,
  prep_minutes: recipe.prepMinutes,
  cook_minutes: recipe.cookMinutes,
  tags: recipe.tags,
  image_path: recipe.imagePath,
  notes: recipe.notes,
})

const ingredientRows = (recipeId: string, recipe: RecipeInput) =>
  recipe.ingredients.map(({ id, ...ingredient }, index) => ({
    ...ingredient,
    id: id ?? crypto.randomUUID(),
    recipe_id: recipeId,
    position: index + 1,
  }))

const stepRows = (recipeId: string, recipe: RecipeInput) =>
  recipe.steps.map(({ id, text }, index) => ({ id: id ?? crypto.randomUUID(), recipe_id: recipeId, position: index + 1, text }))

function throwFirstError(results: ({ error: unknown } | null)[]) {
  const failed = results.find((result) => result?.error)
  if (failed) throw failed.error
}

function forget(id?: string) {
  listCache = null
  if (id) recipeCache.delete(id)
}

export async function createRecipe(recipe: RecipeInput) {
  const { data, error } = await supabase.from('recipes').insert(recipeRow(recipe)).select('id').single()
  if (error) throw error

  const id: string = data.id
  const ingredients = ingredientRows(id, recipe)
  const steps = stepRows(id, recipe)
  try {
    throwFirstError(
      await Promise.all([
        ingredients.length > 0 ? supabase.from('ingredients').insert(ingredients) : null,
        steps.length > 0 ? supabase.from('steps').insert(steps) : null,
      ]),
    )
  } catch (failed) {
    // Otherwise a failed second request leaves a recipe without its ingredients or steps.
    await supabase.from('recipes').delete().eq('id', id)
    throw failed
  }

  forget()
  return id
}

function deleteRowsExcept(table: 'ingredients' | 'steps', recipeId: string, keep: string[]) {
  const query = supabase.from(table).delete().eq('recipe_id', recipeId)
  return keep.length > 0 ? query.not('id', 'in', `(${keep.join(',')})`) : query
}

export async function updateRecipe(id: string, recipe: RecipeInput) {
  const ingredients = ingredientRows(id, recipe)
  const steps = stepRows(id, recipe)
  throwFirstError(
    await Promise.all([
      supabase.from('recipes').update({ ...recipeRow(recipe), updated_at: new Date().toISOString() }).eq('id', id),
      ingredients.length > 0 ? supabase.from('ingredients').upsert(ingredients) : null,
      steps.length > 0 ? supabase.from('steps').upsert(steps) : null,
    ]),
  )
  // Removed rows go only after the rest is saved, so a failure never leaves the recipe with less than before.
  throwFirstError(
    await Promise.all([
      deleteRowsExcept('ingredients', id, ingredients.map((row) => row.id)),
      deleteRowsExcept('steps', id, steps.map((row) => row.id)),
    ]),
  )
  forget(id)
}

export async function deleteRecipe(id: string, imagePath: string | null) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
  forget(id)
  // A leftover file is harmless, so a failure here doesn't fail the delete.
  if (imagePath) await removePhoto(imagePath).catch(() => {})
}

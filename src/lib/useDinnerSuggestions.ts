import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type SuggestedRecipe = {
  title: string
  minutes: number | null
  tags: string[]
  imagePath: string | null
}

export type DinnerSuggestion = {
  id: string
  recipeId: string
  suggestedBy: string
  createdAt: string
  recipe: SuggestedRecipe
}

type Row = {
  id: string
  recipe_id: string
  suggested_by: string
  created_at: string
  recipes: {
    title: string
    tags: string[]
    prep_minutes: number | null
    cook_minutes: number | null
    image_path: string | null
  } | null
}

type Cached = { userId: string | null; suggestions: DinnerSuggestion[] }

const CACHE_KEY = 'dinner-suggestions'

const toSuggestion = (row: Row, recipe: NonNullable<Row['recipes']>): DinnerSuggestion => ({
  id: row.id,
  recipeId: row.recipe_id,
  suggestedBy: row.suggested_by,
  createdAt: row.created_at,
  recipe: {
    title: recipe.title,
    tags: recipe.tags,
    minutes:
      recipe.prep_minutes === null && recipe.cook_minutes === null
        ? null
        : (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0),
    imagePath: recipe.image_path,
  },
})

const table = () => supabase.from('dinner_suggestions')

// Cached so the cards are there on the first frame with the cached shopping list, instead of popping in and pushing it down.
function load(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Cached) : null
  } catch {
    return null
  }
}

export function useDinnerSuggestions() {
  const [cached] = useState(load)
  const [suggestions, setSuggestions] = useState<DinnerSuggestion[] | null>(cached?.suggestions ?? null)
  const [userId, setUserId] = useState<string | null>(cached?.userId ?? null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error } = await table()
      .select('id, recipe_id, suggested_by, created_at, recipes (title, tags, prep_minutes, cook_minutes, image_path)')
      .order('created_at', { ascending: false })
      .returns<Row[]>()
    if (error) return
    setSuggestions(data.flatMap((row) => (row.recipes ? [toSuggestion(row, row.recipes)] : [])))
  }, [])

  useEffect(() => {
    if (suggestions) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, suggestions }))
      } catch {
        // Storage full or blocked: the cards just load a moment later next time.
      }
    }
  }, [suggestions, userId])

  useEffect(() => {
    refresh()
    supabase.auth.getSession().then(({ data }) => data.session && setUserId(data.session.user.id))
    // channel() returns an existing channel with the same name, and removal is async, so a page switch would get the dying one.
    const channel = supabase
      .channel(`dinner_suggestions:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dinner_suggestions' }, () => refresh())
      .subscribe()
    // iOS suspends the realtime socket in the background; catch up when the app comes back.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const suggest = async (recipeId: string) => {
    setError(null)
    // Ignoring duplicates keeps an existing suggestion of the same recipe as it is.
    const { error } = await table().upsert({ recipe_id: recipeId }, { onConflict: 'recipe_id', ignoreDuplicates: true })
    if (error) setError('Kunne ikke sende forslaget.')
    refresh()
  }

  const withdraw = async (recipeId: string) => {
    setError(null)
    setSuggestions((prev) => prev && prev.filter((suggestion) => suggestion.recipeId !== recipeId))
    const { error } = await table().delete().eq('recipe_id', recipeId)
    if (error) setError('Kunne ikke fjerne forslaget.')
    refresh()
  }

  return { suggestions, userId, error, suggest, withdraw }
}

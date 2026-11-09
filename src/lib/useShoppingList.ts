import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type ShoppingItem = {
  id: string
  name: string
  checked: boolean
  checkedAt: number | null
  createdAt: string
}

type Row = { id: string; name: string; checked: boolean; checked_at: string | null; created_at: string }

const toItem = (row: Row): ShoppingItem => ({
  id: row.id,
  name: row.name,
  checked: row.checked,
  checkedAt: row.checked_at ? Date.parse(row.checked_at) : null,
  createdAt: row.created_at,
})

const toRow = (item: ShoppingItem): Row => ({
  id: item.id,
  name: item.name,
  checked: item.checked,
  checked_at: item.checkedAt ? new Date(item.checkedAt).toISOString() : null,
  created_at: item.createdAt,
})

const table = () => supabase.from('shopping_items')

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error } = await table().select('id, name, checked, checked_at, created_at').order('created_at')
    if (error) setError('Kunne ikke hente listen. Sjekk nettet.')
    else {
      setItems(data.map(toItem))
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const channel = supabase
      .channel('shopping_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => refresh())
      .subscribe()
    // iOS suspends the realtime socket in the background; catch up when the app comes back.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  async function mutate(
    optimistic: (prev: ShoppingItem[]) => ShoppingItem[],
    request: PromiseLike<{ error: unknown }>,
  ) {
    setItems(optimistic)
    const { error } = await request
    if (error) {
      setError('Kunne ikke lagre endringen. Sjekk nettet.')
      refresh()
    }
  }

  const add = (name: string) => {
    const item = { id: crypto.randomUUID(), name, checked: false, checkedAt: null, createdAt: new Date().toISOString() }
    return mutate((prev) => [...prev, item], table().insert(toRow(item)))
  }

  const toggle = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const checked = !item.checked
    const checkedAt = checked ? Date.now() : null
    return mutate(
      (prev) => prev.map((i) => (i.id === id ? { ...i, checked, checkedAt } : i)),
      table()
        .update({ checked, checked_at: checkedAt ? new Date(checkedAt).toISOString() : null })
        .eq('id', id),
    )
  }

  const rename = (id: string, name: string) =>
    mutate((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)), table().update({ name }).eq('id', id))

  const remove = (id: string) => {
    const removed = items.filter((i) => i.id === id)
    mutate((prev) => prev.filter((i) => i.id !== id), table().delete().eq('id', id))
    return removed
  }

  const clearChecked = () => {
    const removed = items.filter((i) => i.checked)
    mutate((prev) => prev.filter((i) => !i.checked), table().delete().eq('checked', true))
    return removed
  }

  const restore = (restored: ShoppingItem[]) =>
    mutate(
      (prev) => [...prev, ...restored].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      table().insert(restored.map(toRow)),
    )

  return { items, loading, error, refresh, add, toggle, rename, remove, clearChecked, restore }
}

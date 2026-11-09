import { useEffect, useState } from 'react'

export type ShoppingItem = {
  id: string
  name: string
  checked: boolean
  checkedAt: number | null
}

const STORAGE_KEY = 'shopping-list'

function load(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useShoppingList() {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Private browsing can block storage; the list then only lives until reload.
    }
  }, [items])

  const add = (name: string) =>
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name, checked: false, checkedAt: null }])

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked, checkedAt: item.checked ? null : Date.now() } : item,
      ),
    )

  const clearChecked = () => setItems((prev) => prev.filter((item) => !item.checked))

  return { items, add, toggle, clearChecked }
}

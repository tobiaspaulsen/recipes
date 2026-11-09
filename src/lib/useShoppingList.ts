import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

export type ShoppingItem = {
  id: string
  name: string
  checked: boolean
  checkedAt: number | null
  createdAt: string
}

type Row = { id: string; name: string; checked: boolean; checked_at: string | null; created_at: string }

type Op =
  | { kind: 'insert'; rows: Row[] }
  | { kind: 'update'; id: string; patch: Partial<Row> }
  | { kind: 'delete'; ids: string[] }

const ITEMS_KEY = 'shopping-list:items'
const PENDING_KEY = 'shopping-list:pending'
const RETRY_MS = 15000

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

function apply(items: ShoppingItem[], op: Op): ShoppingItem[] {
  switch (op.kind) {
    case 'insert': {
      const added = op.rows.filter((row) => !items.some((i) => i.id === row.id)).map(toItem)
      return [...items, ...added].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    }
    case 'update':
      return items.map((i) => (i.id === op.id ? toItem({ ...toRow(i), ...op.patch }) : i))
    case 'delete':
      return items.filter((i) => !op.ids.includes(i.id))
  }
}

const table = () => supabase.from('shopping_items')

function send(op: Op) {
  switch (op.kind) {
    case 'insert':
      // Ignoring duplicates makes a retry harmless if the first attempt landed but its reply was lost.
      return table().upsert(op.rows, { onConflict: 'id', ignoreDuplicates: true })
    case 'update':
      return table().update(op.patch).eq('id', op.id)
    case 'delete':
      return table().delete().in('id', op.ids)
  }
}

// Status 0 is a failed fetch; 401/403 means the login token hasn't been refreshed yet.
const isRetryable = (status: number) => status === 0 || status === 401 || status === 403

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the list still works, it just isn't kept between launches.
  }
}

export function useShoppingList() {
  const [server, setServer] = useState<ShoppingItem[] | null>(() => load(ITEMS_KEY, null))
  const [pending, setPending] = useState<Op[]>(() => load(PENDING_KEY, []))
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(pending)
  const flushing = useRef(false)
  const sent = useRef(0)

  const updatePending = (next: Op[]) => {
    pendingRef.current = next
    setPending(next)
    save(PENDING_KEY, next)
  }

  const refresh = useCallback(async () => {
    const sentBefore = sent.current
    const { data, error, status } = await table()
      .select('id, name, checked, checked_at, created_at')
      .order('created_at')
    if (error) {
      if (isRetryable(status)) setOffline(true)
      else setError('Kunne ikke hente listen.')
      return
    }
    setOffline(false)
    // An edit reached the server while this was in flight, so the result is already stale.
    if (sent.current !== sentBefore) return refresh()
    setServer(data.map(toItem))
  }, [])

  const flush = useCallback(async () => {
    if (flushing.current || pendingRef.current.length === 0) return
    flushing.current = true
    try {
      // Without a valid session RLS silently ignores updates and deletes, so the edits would be lost.
      const { data } = await supabase.auth.getSession()
      if (!data.session) return setOffline(true)
      while (pendingRef.current.length > 0) {
        const [op, ...rest] = pendingRef.current
        const { error, status } = await send(op)
        if (error && isRetryable(status)) return setOffline(true)
        if (error) {
          setError('En endring kunne ikke lagres.')
          refresh()
        } else {
          setServer((prev) => apply(prev ?? [], op))
        }
        sent.current++
        updatePending(rest)
      }
      setOffline(false)
    } finally {
      flushing.current = false
    }
  }, [refresh])

  useEffect(() => {
    if (server) save(ITEMS_KEY, server)
  }, [server])

  useEffect(() => {
    const sync = async () => {
      await flush()
      if (pendingRef.current.length === 0) refresh()
    }
    sync()
    const channel = supabase
      .channel('shopping_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => refresh())
      .subscribe()
    // iOS suspends the realtime socket in the background; catch up when the app comes back.
    const onVisible = () => document.visibilityState === 'visible' && sync()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', sync)
    const { data: auth } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') sync()
    })
    const timer = setInterval(() => pendingRef.current.length > 0 && flush(), RETRY_MS)
    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', sync)
      auth.subscription.unsubscribe()
      clearInterval(timer)
    }
  }, [flush, refresh])

  const items = pending.reduce(apply, server ?? [])

  const enqueue = (op: Op) => {
    setError(null)
    updatePending([...pendingRef.current, op])
    flush()
  }

  const add = (name: string) => {
    const item = { id: crypto.randomUUID(), name, checked: false, checkedAt: null, createdAt: new Date().toISOString() }
    enqueue({ kind: 'insert', rows: [toRow(item)] })
  }

  const toggle = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const checked = !item.checked
    enqueue({ kind: 'update', id, patch: { checked, checked_at: checked ? new Date().toISOString() : null } })
  }

  const rename = (id: string, name: string) => enqueue({ kind: 'update', id, patch: { name } })

  const removeItems = (removed: ShoppingItem[]) => {
    if (removed.length) enqueue({ kind: 'delete', ids: removed.map((i) => i.id) })
    return removed
  }

  const remove = (id: string) => removeItems(items.filter((i) => i.id === id))

  const clearChecked = () => removeItems(items.filter((i) => i.checked))

  const restore = (restored: ShoppingItem[]) => enqueue({ kind: 'insert', rows: restored.map(toRow) })

  return {
    items,
    loading: server === null && !offline,
    offline,
    pendingCount: pending.length,
    error,
    refresh,
    add,
    toggle,
    rename,
    remove,
    clearChecked,
    restore,
  }
}

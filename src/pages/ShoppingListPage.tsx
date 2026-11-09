import { Check, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useKeyboardInset } from '../lib/useKeyboardInset'
import { useShoppingList, type ShoppingItem } from '../lib/useShoppingList'

export function ShoppingListPage() {
  const { items, add, toggle, clearChecked } = useShoppingList()
  const [draft, setDraft] = useState('')
  const keyboardInset = useKeyboardInset()

  const open = items.filter((item) => !item.checked)
  const done = items
    .filter((item) => item.checked)
    .sort((a, b) => (b.checkedAt ?? 0) - (a.checkedAt ?? 0))

  function submit(event: FormEvent) {
    event.preventDefault()
    const name = draft.trim()
    if (!name) return
    add(name)
    setDraft('')
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Handleliste</h1>
        {open.length > 0 && <span className="muted">{open.length} igjen</span>}
      </div>

      {items.length === 0 && (
        <div className="empty">
          <h2>Ingenting på listen</h2>
          <p>Skriv inn det du trenger nederst.</p>
        </div>
      )}

      <ul className="items">
        {open.map((item) => (
          <ItemRow key={item.id} item={item} onToggle={toggle} />
        ))}
      </ul>

      {done.length > 0 && (
        <section>
          <div className="done-header">
            <h2>Handlet ({done.length})</h2>
            <button type="button" className="text-button" onClick={clearChecked}>
              Fjern handlet
            </button>
          </div>
          <ul className="items">
            {done.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggle} />
            ))}
          </ul>
        </section>
      )}

      <div className="add-bar-space" />
      <form
        className="add-bar glass"
        onSubmit={submit}
        style={keyboardInset > 0 ? { bottom: keyboardInset + 8 } : undefined}
      >
        <label htmlFor="new-item" className="sr-only">
          Ny vare
        </label>
        <input
          id="new-item"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Legg til vare"
          autoComplete="off"
          enterKeyHint="enter"
        />
        <button type="submit" aria-label="Legg til" disabled={!draft.trim()}>
          <Plus size={20} strokeWidth={2.25} aria-hidden />
        </button>
      </form>
    </>
  )
}

function ItemRow({ item, onToggle }: { item: ShoppingItem; onToggle: (id: string) => void }) {
  return (
    <li>
      <button type="button" className="item" role="checkbox" aria-checked={item.checked} onClick={() => onToggle(item.id)}>
        <span className="check" aria-hidden="true">
          {item.checked && <Check size={14} strokeWidth={3} />}
        </span>
        <span className="item-name">{item.name}</span>
      </button>
    </li>
  )
}

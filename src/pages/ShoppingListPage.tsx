import { Check, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useKeyboardInset } from '../lib/useKeyboardInset'
import { useShoppingList, type ShoppingItem } from '../lib/useShoppingList'

export function ShoppingListPage() {
  const { items, loading, error, add, toggle, rename, remove, clearChecked } = useShoppingList()
  const [draft, setDraft] = useState('')
  const [addFocused, setAddFocused] = useState(false)
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

  const rowProps = { onToggle: toggle, onRename: rename, onRemove: remove }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Handleliste</h1>
        {open.length > 0 && <span className="muted">{open.length} igjen</span>}
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && items.length === 0 && (
        <div className="empty">
          <h2>Ingenting på listen</h2>
          <p>Skriv inn det du trenger nederst.</p>
        </div>
      )}

      <ul className="items">
        {open.map((item) => (
          <ItemRow key={item.id} item={item} {...rowProps} />
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
              <ItemRow key={item.id} item={item} {...rowProps} />
            ))}
          </ul>
        </section>
      )}

      <div className="add-bar-space" />
      <form
        className="add-bar glass"
        onSubmit={submit}
        style={addFocused && keyboardInset > 0 ? { bottom: keyboardInset + 8 } : undefined}
      >
        <label htmlFor="new-item" className="sr-only">
          Ny vare
        </label>
        <input
          id="new-item"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setAddFocused(true)}
          onBlur={() => setAddFocused(false)}
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

type ItemRowProps = {
  item: ShoppingItem
  onToggle: (id: string) => void
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
}

function ItemRow({ item, onToggle, onRename, onRemove }: ItemRowProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(item.name)

  function startEditing() {
    setValue(item.name)
    setEditing(true)
  }

  function save() {
    const name = value.trim()
    if (!name) onRemove(item.id)
    else if (name !== item.name) onRename(item.id, name)
    setEditing(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') save()
    if (event.key === 'Escape') setEditing(false)
  }

  return (
    <li className="item" data-checked={item.checked}>
      <button
        type="button"
        className="check-button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={item.name}
        onClick={() => onToggle(item.id)}
      >
        <span className="check" aria-hidden="true">
          {item.checked && <Check size={14} strokeWidth={3} />}
        </span>
      </button>

      {editing ? (
        <>
          <input
            className="item-edit"
            aria-label={`Endre ${item.name}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={save}
            onKeyDown={onKeyDown}
            autoFocus
            autoComplete="off"
            enterKeyHint="done"
          />
          <button
            type="button"
            className="delete-button"
            aria-label={`Slett ${item.name}`}
            // Keeps the input from blurring (and saving) before the click lands.
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 size={20} aria-hidden />
          </button>
        </>
      ) : (
        <button type="button" className="item-name" onClick={startEditing}>
          {item.name}
        </button>
      )}
    </li>
  )
}

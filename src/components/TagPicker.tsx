import { Plus } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { tagsByUse, useRecipes } from '../lib/useRecipes'

type Props = {
  value: string[]
  onChange: (tags: string[]) => void
}

// "Middag rask", "middag-rask" and "middagrask" count as the same tag.
const normalize = (tag: string) => tag.toLocaleLowerCase('nb').replace(/[\s_-]+/g, '')

export function TagPicker({ value, onChange }: Props) {
  const { recipes } = useRecipes()
  const [draft, setDraft] = useState('')
  const existing = recipes ? tagsByUse(recipes) : []
  const options = [...existing, ...value.filter((tag) => !existing.includes(tag))]

  const query = normalize(draft)
  const exact = query ? options.find((tag) => normalize(tag) === query) : undefined
  const visible = options.filter((tag) => value.includes(tag) || normalize(tag).includes(query))

  function toggle(tag: string) {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  }

  function addDraft() {
    const tag = draft.trim().replace(/\s+/g, ' ')
    if (!tag) return
    if (exact) {
      if (!value.includes(exact)) onChange([...value, exact])
    } else {
      onChange([...value, tag])
    }
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    // Otherwise Enter submits the whole recipe form.
    event.preventDefault()
    addDraft()
  }

  return (
    <div className="field">
      <label htmlFor="tags">Tagger</label>
      <input
        id="tags"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Søk eller legg til tagg"
        autoComplete="off"
        enterKeyHint="done"
      />
      <div className="tag-chips tag-picker" role="group" aria-label="Velg tagger">
        {visible.map((tag) => (
          <button key={tag} type="button" aria-pressed={value.includes(tag)} onClick={() => toggle(tag)}>
            <span>{tag}</span>
          </button>
        ))}
        {query && !exact && (
          <button type="button" className="tag-new" onClick={addDraft}>
            <span>
              <Plus size={14} aria-hidden />
              {draft.trim()}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

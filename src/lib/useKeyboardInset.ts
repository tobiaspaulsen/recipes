import { useEffect, useState } from 'react'

// iOS keeps fixed elements anchored to the layout viewport, so the keyboard covers them;
// visualViewport tells how much of the bottom the keyboard is hiding.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    // Scrolling and toolbar collapse also shift the viewport a little; only a keyboard hides this much.
    const update = () => {
      const hidden = window.innerHeight - viewport.height - viewport.offsetTop
      setInset(hidden > 150 ? hidden : 0)
    }
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}

import { useEffect, useState } from 'react'

// iOS keeps fixed elements anchored to the layout viewport, so the keyboard covers them;
// visualViewport tells how much of the bottom the keyboard is hiding. Null when there is no keyboard.
export function useKeyboardInset() {
  const [inset, setInset] = useState<number | null>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => {
      // Judged by height alone: scrolling with the keyboard up pans the viewport down and can uncover the whole bottom.
      const keyboardOpen = window.innerHeight - viewport.height > 150
      // Overscroll makes offsetTop negative.
      const hidden = window.innerHeight - viewport.height - Math.max(0, viewport.offsetTop)
      setInset(keyboardOpen ? Math.max(0, hidden) : null)
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

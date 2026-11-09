import { useLayoutEffect, useRef, type RefObject } from 'react'

const EASE_OUT = 'cubic-bezier(0.2, 0, 0, 1)'

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Layout position, ignoring transforms; scroll-independent so the iOS rubber band doesn't count as movement.
function layoutTop(el: HTMLElement) {
  let top = 0
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop
  return top
}

// Slides each [data-flip-id] element from where it was on the previous render to where it is now.
export function useFlip(container: RefObject<HTMLElement | null>, enabled: boolean) {
  const positions = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    const animate = enabled && !reducedMotion()
    const next = new Map<string, number>()

    for (const el of root.querySelectorAll<HTMLElement>('[data-flip-id]')) {
      const id = el.dataset.flipId!
      const top = layoutTop(el)
      next.set(id, top)
      if (!animate) continue

      const before = positions.current.get(id)
      if (before === undefined) {
        el.animate({ opacity: [0, 1] }, { duration: 220, easing: 'ease-out' })
        continue
      }

      // Unmoved: leave any running slide alone, e.g. when the realtime echo of a toggle re-renders mid-slide.
      if (Math.abs(before - top) < 1) continue

      // Moved mid-slide: start from where it is drawn now instead of snapping back to its old spot.
      const running = el.getAnimations().filter((a) => a.id === 'flip')
      const drawnOffset = running.length ? el.getBoundingClientRect().top + window.scrollY - top : 0
      running.forEach((a) => a.cancel())
      const animation = el.animate(
        { transform: [`translateY(${before - top + drawnOffset}px)`, 'none'] },
        { duration: 320, easing: EASE_OUT },
      )
      animation.id = 'flip'
    }

    positions.current = next
  })
}

// Only fades: once the element is removed, useFlip slides whatever was below it into place.
export async function fadeOut(el: HTMLElement | null) {
  if (!el || reducedMotion()) return
  await el.animate({ opacity: [1, 0] }, { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished
}

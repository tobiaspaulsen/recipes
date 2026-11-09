import { useEffect, useState } from 'react'

export const PULL_THRESHOLD = 70

export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Safari in a browser tab already has its own pull-to-refresh; only the home screen app needs ours.
    if (!window.matchMedia('(display-mode: standalone)').matches) return

    let startY: number | null = null
    let distance = 0

    const onStart = (event: TouchEvent) => {
      startY = window.scrollY <= 0 ? event.touches[0].clientY : null
      distance = 0
    }
    const onMove = (event: TouchEvent) => {
      if (startY === null) return
      distance = Math.max(0, event.touches[0].clientY - startY)
      setPull(Math.min(distance, PULL_THRESHOLD * 1.5))
    }
    const onEnd = () => {
      if (startY !== null && distance >= PULL_THRESHOLD) {
        setRefreshing(true)
        onRefresh().finally(() => setRefreshing(false))
      }
      startY = null
      distance = 0
      setPull(0)
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onRefresh])

  return { pull, refreshing }
}

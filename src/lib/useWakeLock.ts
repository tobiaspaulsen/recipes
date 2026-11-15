import { useEffect } from 'react'

export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let active = true
    let lock: WakeLockSentinel | null = null

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request('screen')
        if (active) lock = next
        else next.release()
      } catch {
        // Refused, e.g. in Low Power Mode; the screen just dims as usual.
      }
    }

    // The browser drops the lock whenever the page is hidden.
    const onVisible = () => document.visibilityState === 'visible' && request()

    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release()
    }
  }, [])
}

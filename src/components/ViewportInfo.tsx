import { useEffect, useRef, useState } from 'react'

type Info = Record<string, string | number>

export function ViewportInfo() {
  const probe = useRef<HTMLDivElement>(null)
  const [info, setInfo] = useState<Info>({})

  useEffect(() => {
    const measure = () => {
      const s = probe.current ? getComputedStyle(probe.current) : null
      setInfo({
        version: __COMMIT__,
        standalone: String(window.matchMedia('(display-mode: standalone)').matches),
        'screen.height': screen.height,
        innerHeight: window.innerHeight,
        clientHeight: document.documentElement.clientHeight,
        'visualViewport.height': Math.round(window.visualViewport?.height ?? 0),
        'safe-area top': s?.paddingTop ?? '',
        'safe-area bottom': s?.paddingBottom ?? '',
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <section className="viewport-info">
      <div
        ref={probe}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      />
      <h2>Diagnostikk</h2>
      <dl>
        {Object.entries(info).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

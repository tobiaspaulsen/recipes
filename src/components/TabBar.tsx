import { NavLink } from 'react-router-dom'

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function TabBar() {
  return (
    <nav className="tabbar glass" aria-label="Hovedmeny">
      <NavLink to="/" end>
        <svg {...iconProps}>
          <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
        </svg>
        Handleliste
      </NavLink>
      <NavLink to="/oppskrifter">
        <svg {...iconProps}>
          <path d="M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2z" />
          <path d="M5 20a2 2 0 0 0 2 1h12v-3" />
        </svg>
        Oppskrifter
      </NavLink>
      <NavLink to="/innstillinger">
        <svg {...iconProps}>
          <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
          <circle cx="15" cy="7" r="2" />
          <circle cx="9" cy="17" r="2" />
        </svg>
        Innstillinger
      </NavLink>
    </nav>
  )
}

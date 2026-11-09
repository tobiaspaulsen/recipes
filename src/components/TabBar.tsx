import { BookOpen, List, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const iconProps = { size: 22, strokeWidth: 1.75, 'aria-hidden': true } as const

export function TabBar() {
  return (
    <nav className="tabbar glass" aria-label="Hovedmeny">
      <NavLink to="/" end>
        <List {...iconProps} />
        Handleliste
      </NavLink>
      <NavLink to="/oppskrifter">
        <BookOpen {...iconProps} />
        Oppskrifter
      </NavLink>
      <NavLink to="/innstillinger">
        <SlidersHorizontal {...iconProps} />
        Innstillinger
      </NavLink>
    </nav>
  )
}

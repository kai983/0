import { NavLink } from 'react-router-dom'
import { IconArchive, IconPlus } from '../icons'

/** Mobile primary navigation. Hidden on desktop where the sidebar takes over. */
export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav-item">
        <IconArchive width={22} height={22} />
        <span>아카이브</span>
      </NavLink>
      <NavLink to="/add" className="bottom-nav-item">
        <IconPlus width={22} height={22} />
        <span>새 지식</span>
      </NavLink>
    </nav>
  )
}

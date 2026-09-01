import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CARDS_CHANGED, cards } from '../cards'
import { IconArchive, IconCards, IconPlus } from '../icons'

/** Mobile primary navigation. Hidden on desktop where the sidebar takes over. */
export default function BottomNav() {
  const location = useLocation()
  const [dueCount, setDueCount] = useState(0)

  // Recount on navigation, and whenever cards are added or graded - those
  // happen without leaving the screen, so navigation alone would go stale.
  useEffect(() => {
    const recount = () => cards.due().then((list) => setDueCount(list.length))
    recount()
    window.addEventListener(CARDS_CHANGED, recount)
    return () => window.removeEventListener(CARDS_CHANGED, recount)
  }, [location])

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav-item">
        <IconArchive width={20} height={20} />
        <span>저장소</span>
      </NavLink>
      <NavLink to="/review" className="bottom-nav-item">
        <span className="nav-icon-wrap">
          <IconCards width={20} height={20} />
          {dueCount > 0 && <span className="nav-badge">{dueCount > 99 ? '99+' : dueCount}</span>}
        </span>
        <span>학습</span>
      </NavLink>
      <NavLink to="/add" className="bottom-nav-item">
        <IconPlus width={20} height={20} />
        <span>새 지식</span>
      </NavLink>
    </nav>
  )
}

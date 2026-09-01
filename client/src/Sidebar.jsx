import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { store } from './store'
import { IconArchive, IconPlus, IconTag } from './icons'

/** Desktop-only navigation. On mobile, BottomNav + AppBar take over. */
export default function Sidebar() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [tags, setTags] = useState([])
  const [count, setCount] = useState(0)
  const activeTag = searchParams.get('tag') || ''

  useEffect(() => {
    store.tags().then(setTags)
    store.list().then((items) => setCount(items.length))
  }, [location])

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">📚</span>
        <div>
          <div className="sidebar-title">지식 저장소</div>
          <div className="sidebar-subtitle">{count}개 저장됨</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className="sidebar-link">
          <IconArchive />
          저장소
        </NavLink>
        <NavLink to="/add" className="sidebar-link">
          <IconPlus />
          새 지식
        </NavLink>
      </nav>

      {tags.length > 0 && (
        <div className="sidebar-tags">
          <div className="sidebar-section-label">
            <IconTag width={13} height={13} />
            태그
          </div>
          <div className="sidebar-tag-list">
            {tags.map((tag) => {
              const isActive = location.pathname === '/' && activeTag === tag
              return (
                <Link
                  key={tag}
                  to={isActive ? '/' : `/?tag=${encodeURIComponent(tag)}`}
                  className={`sidebar-tag ${isActive ? 'active' : ''}`}
                >
                  {tag}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}

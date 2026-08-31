import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '../icons'

/**
 * Sticky top bar. On mobile it is the primary chrome (with safe-area padding
 * for the status bar); on desktop it sits above the page content.
 */
export default function AppBar({ title, back = false, actions = null }) {
  const navigate = useNavigate()

  // Going back with an empty history stack would close the app (or leave the
  // page) instead of returning to the archive, so fall back to the root route.
  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/', { replace: true })
  }

  return (
    <header className="appbar">
      {back && (
        <button className="appbar-icon-btn" onClick={goBack} aria-label="뒤로 가기">
          <IconArrowLeft width={20} height={20} />
        </button>
      )}
      <h1 className="appbar-title">{title}</h1>
      {actions && <div className="appbar-actions">{actions}</div>}
    </header>
  )
}

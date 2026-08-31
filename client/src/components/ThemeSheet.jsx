import { THEMES } from '../theme'
import { IconCheck } from '../icons'

/** Bottom sheet for picking one of the four visual themes. */
export default function ThemeSheet({ current, onPick, onClose }) {
  return (
    <div
      className="sheet-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="sheet-title">테마</h2>
        <p className="sheet-sub">같은 내용을 다른 밀도와 색으로 봅니다.</p>

        {THEMES.map((theme) => (
          <button
            key={theme.id}
            className={`theme-option ${current === theme.id ? 'active' : ''}`}
            onClick={() => onPick(theme.id)}
          >
            <span className="theme-swatch" style={{ background: theme.swatch.bg }}>
              <i style={{ background: theme.swatch.ink, width: '100%' }}></i>
              <i style={{ background: theme.swatch.ink, opacity: 0.35, width: '70%' }}></i>
              <i style={{ background: theme.swatch.accent, width: '45%' }}></i>
            </span>
            <span className="theme-option-text">
              <span className="theme-option-name">{theme.name}</span>
              <span className="theme-option-tagline">{theme.tagline}</span>
            </span>
            {current === theme.id && (
              <span className="theme-check">
                <IconCheck width={20} height={20} />
              </span>
            )}
          </button>
        ))}

        <p className="sheet-version">버전 {__APP_VERSION__}</p>
      </div>
    </div>
  )
}

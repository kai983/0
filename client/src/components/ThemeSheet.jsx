import { useState } from 'react'
import { THEMES } from '../theme'
import { aiKey } from '../ai'
import { IconCheck } from '../icons'

/** Bottom sheet with the theme picker and the AI settings. */
export default function ThemeSheet({ current, onPick, onClose }) {
  const [key, setKey] = useState(aiKey.get())
  const [savedTick, setSavedTick] = useState(false)

  function saveKey() {
    aiKey.set(key)
    setSavedTick(true)
    setTimeout(() => setSavedTick(false), 1500)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
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

        <h2 className="sheet-title" style={{ marginTop: 24 }}>
          자동 AI 요약
        </h2>
        <p className="sheet-sub">
          Gemini 무료 API 키를 넣으면 공유하자마자 요약까지 자동으로 됩니다. 키는 이 폰에만
          저장돼요. 하루 250회 무료, 카드 등록 없음.
        </p>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'block', marginBottom: 10 }}
        >
          <button className="block quiet">1. 무료 키 만들기 (구글 로그인만 하면 끝)</button>
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="2. 만든 키를 여기 붙여넣기"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button className="secondary" onClick={saveKey}>
            {savedTick ? <IconCheck width={16} height={16} /> : '저장'}
          </button>
        </div>

        <p className="sheet-version">버전 {__APP_VERSION__}</p>
      </div>
    </div>
  )
}

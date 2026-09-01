import { useRef, useState } from 'react'
import { THEMES } from '../theme'
import { aiKey, testAiConnection } from '../ai'
import { exportBackup, importBackup, lastBackupAt, parseBackup } from '../backup'
import { IconCheck } from '../icons'

function backupAgeText(iso) {
  if (!iso) return '아직 백업한 적이 없어요.'
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000)
  const date = new Date(iso).toLocaleDateString('ko-KR')
  if (days <= 0) return `마지막 백업 - 오늘 (${date})`
  return `마지막 백업 - ${days}일 전 (${date})`
}

/** Bottom sheet with the theme picker, the AI settings and backup. */
export default function ThemeSheet({ current, onPick, onClose }) {
  const [key, setKey] = useState(aiKey.stored())
  const [savedTick, setSavedTick] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupResult, setBackupResult] = useState(null)
  const [lastBackup, setLastBackup] = useState(lastBackupAt)
  const [usingOwnKey, setUsingOwnKey] = useState(() => Boolean(aiKey.stored()))
  const fileInput = useRef(null)

  async function runExport() {
    setBackupBusy(true)
    setBackupResult(null)
    const outcome = await exportBackup()
    if (outcome.text) setBackupResult(outcome)
    if (outcome.ok) setLastBackup(lastBackupAt())
    setBackupBusy(false)
  }

  async function runImport(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setBackupBusy(true)
    setBackupResult(null)
    try {
      const added = importBackup(parseBackup(await file.text()))
      const nothingNew = added.items === 0 && added.cards === 0
      const text = nothingNew
        ? '이미 다 들어 있는 내용이라 새로 추가된 건 없어요.'
        : `지식 ${added.items}개와 학습 카드 ${added.cards}장을 가져왔어요.` +
          (added.skipped > 0 ? ` 이미 있던 ${added.skipped}개는 건너뛰었어요.` : '')
      setBackupResult({ ok: true, text: `${text} 잠시 뒤 화면을 새로 불러올게요.` })
      // Every list on screen was built before the import, and a restored theme
      // is applied at boot, so a reload is the honest way to show the result.
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setBackupResult({ ok: false, text: err.message })
    }
    setBackupBusy(false)
  }

  function saveKey() {
    aiKey.set(key)
    setUsingOwnKey(Boolean(aiKey.stored()))
    setSavedTick(true)
    setResult(null)
    setTimeout(() => setSavedTick(false), 1500)
  }

  async function runTest() {
    setTesting(true)
    setResult(null)
    // Save first, so the test uses the key that is on screen.
    aiKey.set(key)
    setUsingOwnKey(Boolean(aiKey.stored()))
    setResult(await testAiConnection())
    setTesting(false)
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
        {/* An empty input reads as "no key set", which is the opposite of the
            truth when the built-in key is doing the work - so say which. */}
        <p className="key-status">
          <IconCheck width={15} height={15} />
          {usingOwnKey ? '직접 넣은 키를 쓰는 중' : '내장된 무료 키를 쓰는 중 - 설정할 것 없어요'}
        </p>
        <p className="sheet-sub">
          다른 키로 바꾸고 싶을 때만 아래에 붙여넣으세요. 키는 이 폰에만 저장됩니다.
        </p>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'block', marginBottom: 10 }}
        >
          <button className="block quiet">새 무료 키 만들기 (구글 로그인만 하면 끝)</button>
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="바꿀 키 붙여넣기 (선택)"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button className="secondary" onClick={saveKey}>
            {savedTick ? <IconCheck width={16} height={16} /> : '저장'}
          </button>
        </div>

        <button className="block quiet" style={{ marginTop: 8 }} onClick={runTest} disabled={testing}>
          {testing ? '확인 중...' : '연결 테스트'}
        </button>
        {result && (
          <p className={`test-result ${result.ok ? 'ok' : 'bad'}`}>{result.text}</p>
        )}

        <h2 className="sheet-title" style={{ marginTop: 24 }}>
          백업
        </h2>
        <p className="sheet-sub">
          지식은 이 폰 안에만 있어요. 파일 하나로 내보내 두면 앱을 지우거나 기기를 바꿔도
          되살릴 수 있습니다. {backupAgeText(lastBackup)}
        </p>
        <div className="sheet-row">
          <button className="quiet" onClick={runExport} disabled={backupBusy}>
            {backupBusy ? '처리 중...' : '내보내기'}
          </button>
          <button className="quiet" onClick={() => fileInput.current?.click()} disabled={backupBusy}>
            가져오기
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={runImport}
          style={{ display: 'none' }}
        />
        {backupResult && (
          <p className={`test-result ${backupResult.ok ? 'ok' : 'bad'}`}>{backupResult.text}</p>
        )}

        <p className="sheet-version">버전 {__APP_VERSION__}</p>
      </div>
    </div>
  )
}

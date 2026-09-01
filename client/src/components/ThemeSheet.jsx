import { useRef, useState } from 'react'
import { THEMES } from '../theme'
import { aiKey, testAiConnection } from '../ai'
import { exportBackup, importBackup, lastBackupAt, parseBackup } from '../backup'
import { shareDiagnostic } from '../sharing'
import { IconCheck, IconExport, IconImport } from '../icons'
import { daysSince } from '../dates'

/** Enough of a key to recognise it, without putting the whole secret on screen. */
function maskKey(value) {
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

function backupAgeText(iso) {
  if (!iso) return '아직 백업한 적이 없어요.'
  const days = daysSince(iso)
  const date = new Date(iso).toLocaleDateString('ko-KR')
  if (days <= 0) return `마지막 백업 - 오늘 (${date})`
  return `마지막 백업 - ${days}일 전 (${date})`
}

/** Bottom sheet with the theme picker, the AI settings and backup. */
export default function ThemeSheet({ current, onPick, onClose }) {
  // The saved key is shown above, masked, so this field starts empty and only
  // ever holds a replacement the user is typing.
  const [key, setKey] = useState('')
  const [savedTick, setSavedTick] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupResult, setBackupResult] = useState(null)
  const [lastBackup, setLastBackup] = useState(lastBackupAt)
  const [savedKey, setSavedKey] = useState(() => aiKey.stored())
  const [shareInfo] = useState(shareDiagnostic)
  const fileInput = useRef(null)
  const usingOwnKey = Boolean(savedKey)

  function clearKey() {
    aiKey.set('')
    setSavedKey('')
    setKey('')
    setResult(null)
  }

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
    setSavedKey(aiKey.stored())
    setKey('')
    setSavedTick(true)
    setResult(null)
    setTimeout(() => setSavedTick(false), 1500)
  }

  async function runTest() {
    setTesting(true)
    setResult(null)
    // Save first, so the test uses the key that is on screen.
    if (key) {
      aiKey.set(key)
      setSavedKey(aiKey.stored())
      setKey('')
    }
    setResult(await testAiConnection())
    setTesting(false)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle"></div>
        <h2 className="sheet-head">설정</h2>

        <h2 className="sheet-title" style={{ marginTop: 18 }}>
          테마
        </h2>
        <div className="theme-options">
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
            </span>
          </button>
        ))}
        </div>

        <h2 className="sheet-title" style={{ marginTop: 24 }}>
          자동 AI 요약
        </h2>
        {/* An empty input reads as "no key set", which is the opposite of the
            truth when the built-in key is doing the work - so say which. */}
        <div className="key-status">
          <IconCheck width={15} height={15} />
          <span>
            {usingOwnKey ? (
              <>
                직접 넣은 키를 쓰는 중 - <code>{maskKey(savedKey)}</code>
              </>
            ) : (
              '내장된 무료 키를 쓰는 중 - 설정할 것 없어요'
            )}
          </span>
          {usingOwnKey && (
            <button className="key-clear" onClick={clearKey}>
              지우기
            </button>
          )}
        </div>
        <p className="sheet-sub">
          {usingOwnKey
            ? '지우면 내장된 무료 키로 돌아갑니다. 다른 키로 바꾸려면 아래에 붙여넣으세요.'
            : '다른 키로 바꾸고 싶을 때만 아래에 붙여넣으세요. 키는 이 폰에만 저장됩니다.'}
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
            placeholder={usingOwnKey ? '다른 키로 바꾸기 (선택)' : '바꿀 키 붙여넣기 (선택)'}
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
        {result && <p className={`test-result ${result.state}`}>{result.text}</p>}

        <h2 className="sheet-title" style={{ marginTop: 24 }}>
          백업
        </h2>
        <p className="sheet-sub">
          지식은 이 폰 안에만 있어요. 파일 하나로 내보내 두면 앱을 지우거나 기기를 바꿔도
          되살릴 수 있습니다. {backupAgeText(lastBackup)}
        </p>
        <div className="sheet-row">
          <button className="quiet" onClick={runExport} disabled={backupBusy}>
            <IconExport width={16} height={16} />
            {backupBusy ? '처리 중...' : '내보내기'}
          </button>
          <button className="quiet" onClick={() => fileInput.current?.click()} disabled={backupBusy}>
            <IconImport width={16} height={16} />
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

        <h2 className="sheet-title" style={{ marginTop: 24 }}>
          공유 상태
        </h2>
        <p className="sheet-sub">
          유튜브나 브라우저에서 공유할 때 이 앱이 무엇을 받았는지 보여줍니다. 공유해도 아무 일이
          없을 때 여기를 확인하세요.
        </p>
        <p className={`test-result share-status ${shareInfo?.stage === '연결 실패' ? 'bad' : 'ok'}`}>
          {shareInfo
            ? `${shareInfo.stage} - ${shareInfo.detail} (${new Date(shareInfo.at).toLocaleString('ko-KR')})`
            : '아직 기록이 없어요. 공유를 한 번 해본 뒤 다시 열어 보세요.'}
        </p>

        <p className="sheet-version">버전 {__APP_VERSION__}</p>
      </div>
    </div>
  )
}

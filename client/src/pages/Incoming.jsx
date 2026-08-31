import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import { cards as cardStore, parseCards } from '../cards'
import { looksLikeAiAnswer, parseShared, pendingAi } from '../sharing'
import { hasAiKey } from '../ai'
import AppBar from '../components/AppBar.jsx'
import { IconCards, IconNote, IconSparkle } from '../icons'

/**
 * Where text shared from another app lands. If a card was waiting for an AI
 * answer, saving it back is the pre-selected action; otherwise this becomes a
 * new knowledge card.
 */
export default function Incoming({ shared, onDone }) {
  const navigate = useNavigate()
  const [target, setTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const parsed = parseShared(shared)
  const pending = pendingAi.get()
  const isAnswer = looksLikeAiAnswer(parsed.raw)
  const cardCount = isAnswer ? parseCards(parsed.raw).length : 0

  useEffect(() => {
    if (!pending) return
    store.get(pending.itemId).then(setTarget).catch(() => setTarget(null))
  }, [pending?.itemId])

  // With an AI key set, captured content skips this screen entirely: the card
  // is created on the spot and the detail page picks up the summary work.
  const autoCapture = hasAiKey() && !isAnswer && !pending
  const captured = useRef(false)
  useEffect(() => {
    // The guard keeps a re-render (or StrictMode's double effect) from
    // saving the same share twice.
    if (autoCapture && !captured.current) {
      captured.current = true
      saveAsNew(true)
    }
  }, [autoCapture])

  const canAttach = Boolean(target) && isAnswer

  async function saveAsAnswer() {
    setSaving(true)
    try {
      if (pending.kind === 'cards') {
        const pairs = parseCards(parsed.raw)
        if (pairs.length) await cardStore.addMany(target.id, pairs)
      } else {
        await store.update(target.id, { summary: parsed.raw, tags: mergedTags(target, parsed.raw) })
      }
      pendingAi.clear()
      onDone()
      navigate(`/items/${target.id}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  async function saveAsNew(autoAi = false) {
    setSaving(true)
    try {
      const item = await store.create({
        title: parsed.title || '제목 없음',
        sourceType: parsed.url ? 'url' : 'text',
        sourceUrl: parsed.url,
        rawContent: parsed.body || (parsed.url ? '' : parsed.raw),
        tags: [],
      })
      onDone()
      navigate(`/items/${item.id}`, { replace: true, state: autoAi ? { autoAi: true } : undefined })
    } finally {
      setSaving(false)
    }
  }

  if (autoCapture) {
    return (
      <>
        <AppBar title="저장 중" />
        <div className="page">
          <p className="hint">저장하고 AI 요약을 시작할게요...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AppBar title="공유받은 내용" />
      <div className="page">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="incoming-preview">{parsed.raw}</div>
        </div>

        {canAttach && (
          <>
            <p className="hint" style={{ marginBottom: 12 }}>
              {pending.kind === 'cards'
                ? `문답 ${cardCount}장을 "${target.title}" 에 저장할까요?`
                : `요약을 "${target.title}" 에 저장할까요?`}
            </p>
            <button
              className="block"
              onClick={saveAsAnswer}
              disabled={saving || (pending.kind === 'cards' && cardCount === 0)}
            >
              {pending.kind === 'cards' ? (
                <IconCards width={16} height={16} />
              ) : (
                <IconSparkle width={16} height={16} />
              )}
              {saving ? '저장 중...' : pending.kind === 'cards' ? '학습 카드로 저장' : '요약으로 저장'}
            </button>
          </>
        )}

        <button
          className={canAttach ? 'quiet block' : 'block'}
          style={{ marginTop: canAttach ? 8 : 0 }}
          onClick={saveAsNew}
          disabled={saving}
        >
          <IconNote width={16} height={16} />새 지식으로 저장
        </button>

        <button
          className="quiet block"
          style={{ marginTop: 8 }}
          onClick={() => {
            onDone()
            navigate('/', { replace: true })
          }}
          disabled={saving}
        >
          취소
        </button>
      </div>
    </>
  )
}

function mergedTags(item, summary) {
  const match = summary.match(/##\s*추천\s*태그\s*\n([^\n]+)/i)
  const extracted = match ? match[1].split(',').map((t) => t.trim()).filter(Boolean) : []
  return [...item.tags, ...extracted]
}

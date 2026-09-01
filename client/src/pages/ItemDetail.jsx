import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { store } from '../store'
import { cards as cardStore, parseCards } from '../cards'
import { buildCardsPrompt } from '../promptTemplate'
import { canShare, pendingAi, sendToAi } from '../sharing'
import { hasAiKey, isVideoSource, makeCardsForItem, summarizeItem } from '../ai'
import AppBar from '../components/AppBar.jsx'
import Markdown from '../components/Markdown.jsx'
import {
  IconCards,
  IconCheck,
  IconCopy,
  IconLink,
  IconNote,
  IconSend,
  IconSparkle,
  IconTrash,
} from '../icons'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [cardCount, setCardCount] = useState(0)
  const [cardPrompt, setCardPrompt] = useState('')
  const [cardsPasted, setCardsPasted] = useState('')
  const [cardsCopied, setCardsCopied] = useState(false)
  const [savingCards, setSavingCards] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [cardsBusy, setCardsBusy] = useState(false)
  const [cardsError, setCardsError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const location = useLocation()

  const isVideo = isVideoSource(item?.source_url)

  // Watching a video takes a minute or more, so the wait shows its own clock
  // rather than an ellipsis that could mean anything.
  useEffect(() => {
    if (!aiBusy) {
      setElapsed(0)
      return
    }
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(tick)
  }, [aiBusy])

  useEffect(() => {
    setLoading(true)
    store
      .get(id)
      .then((data) => {
        setItem(data)
        setTagsInput(data.tags.join(', '))
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false))
    cardStore.forItem(id).then((list) => setCardCount(list.length))
  }, [id])

  // A share-captured card lands here with autoAi set; summarize it right away.
  const autoRan = useRef(false)
  useEffect(() => {
    if (item && location.state?.autoAi && !item.summary && hasAiKey() && !autoRan.current) {
      autoRan.current = true
      runAutoSummary(item)
    }
  }, [item?.id, location.state?.autoAi])

  async function runAutoSummary(current) {
    setAiBusy(true)
    setAiError('')
    try {
      const summary = await summarizeItem(current)
      const merged = [...current.tags, ...extractTagsFromSummary(summary)]
      const updated = await store.update(current.id, { summary, tags: merged })
      setItem(updated)
      setTagsInput(updated.tags.join(', '))
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiBusy(false)
    }
  }

  async function runAutoCards() {
    setCardsBusy(true)
    setCardsError('')
    try {
      const answer = await makeCardsForItem(item)
      const pairs = parseCards(answer)
      if (!pairs.length) throw new Error('문답을 읽어내지 못했어요. 다시 시도해 주세요.')
      await cardStore.addMany(id, pairs)
      const list = await cardStore.forItem(id)
      setCardCount(list.length)
    } catch (err) {
      setCardsError(err.message)
    } finally {
      setCardsBusy(false)
    }
  }

  function handleGenerateCards() {
    setCardPrompt(
      buildCardsPrompt({ title: item.title, summary: item.summary, rawContent: item.raw_content })
    )
  }

  async function handleCopyCards() {
    try {
      await navigator.clipboard.writeText(cardPrompt)
      setCardsCopied(true)
      setTimeout(() => setCardsCopied(false), 2000)
    } catch {
      setCardsCopied(false)
    }
  }

  async function handleSaveCards() {
    const parsed = parseCards(cardsPasted)
    if (!parsed.length) return
    setSavingCards(true)
    try {
      await cardStore.addMany(id, parsed)
      const list = await cardStore.forItem(id)
      setCardCount(list.length)
      setCardsPasted('')
      setCardPrompt('')
    } finally {
      setSavingCards(false)
    }
  }

  async function handleGeneratePrompt() {
    const { prompt } = await store.getPrompt(id)
    setPrompt(prompt)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be unavailable in some webviews; the text stays selectable.
      setCopied(false)
    }
  }

  function extractTagsFromSummary(text) {
    const match = text.match(/##\s*추천\s*태그\s*\n([^\n]+)/i)
    if (!match) return []
    return match[1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }

  async function handleSaveSummary() {
    if (!pasted.trim()) return
    setSaving(true)
    try {
      const merged = [...item.tags, ...extractTagsFromSummary(pasted)]
      const updated = await store.update(id, { summary: pasted, tags: merged })
      setItem(updated)
      setTagsInput(updated.tags.join(', '))
      setPasted('')
      setPrompt('')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTags() {
    const updated = await store.update(id, {
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    })
    setItem(updated)
    setEditingTags(false)
  }

  async function handleDelete() {
    const warning = cardCount
      ? `이 지식 카드와 여기서 만든 학습 카드 ${cardCount}장을 삭제할까요?`
      : '이 지식 카드를 삭제할까요?'
    if (!confirm(warning)) return
    await cardStore.removeForItem(id)
    await store.remove(id)
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <>
        <AppBar title="지식 카드" back />
        <div className="page">
          <p className="hint">불러오는 중...</p>
        </div>
      </>
    )
  }

  if (!item) {
    return (
      <>
        <AppBar title="지식 카드" back />
        <div className="page">
          <p className="hint">찾을 수 없는 카드입니다.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AppBar
        title="지식 카드"
        back
        actions={
          <button className="appbar-icon-btn danger" onClick={handleDelete} aria-label="삭제">
            <IconTrash width={19} height={19} />
          </button>
        }
      />

      <div className="page">
        <div className="detail-header">
          <h2 className="detail-title">{item.title}</h2>
          <div className="detail-meta">
            {item.source_type === 'url' ? <IconLink width={13} height={13} /> : <IconNote width={13} height={13} />}
            {new Date(item.created_at).toLocaleDateString('ko-KR')}
          </div>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noreferrer" className="detail-source">
              <IconLink width={14} height={14} />
              {item.source_url}
            </a>
          )}
        </div>

        <div className="section">
          <div className="section-label">태그</div>
          {editingTags ? (
            <>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="쉼표로 구분"
              />
              <div className="tag-edit-row">
                <button className="block" onClick={handleSaveTags}>
                  저장
                </button>
                <button
                  className="quiet"
                  onClick={() => {
                    setTagsInput(item.tags.join(', '))
                    setEditingTags(false)
                  }}
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <div className="item-tags" style={{ marginTop: 0 }}>
              {item.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
              <button
                className="tag-chip"
                style={{ padding: '3px 10px', fontSize: '0.72rem', minHeight: 0 }}
                onClick={() => setEditingTags(true)}
              >
                {item.tags.length ? '편집' : '+ 태그 추가'}
              </button>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-label">원문 - 메모</div>
          <div className={`raw-content-view ${item.raw_content ? '' : 'empty'}`}>
            {item.raw_content || '원문 없음'}
          </div>
        </div>

        <div className="section">
          <div className="section-label">
            <IconSparkle width={14} height={14} />
            AI 재가공
          </div>

          {item.summary && !prompt && (
            <div className="card" style={{ marginBottom: 12 }}>
              <Markdown text={item.summary} />
            </div>
          )}

          {/* Reaching a saved summary used to leave the screen with no obvious
              next move, so it now names one and hands over the buttons. */}
          {item.summary && !prompt && !aiBusy && (
            <div className="next-step">
              <p className="next-step-title">
                <IconCheck width={15} height={15} />
                요약이 저장됐어요
              </p>
              <p className="next-step-sub">
                {cardCount > 0
                  ? `학습 카드 ${cardCount}장이 만들어져 있어요. 학습 탭에서 물어봅니다.`
                  : '이제 학습 카드를 만들어 두면, 잊을 때쯤 학습 탭에서 다시 물어봐 줍니다.'}
              </p>
              <div className="next-step-actions">
                {cardCount === 0 && (
                  <button onClick={runAutoCards} disabled={cardsBusy}>
                    <IconCards width={15} height={15} />
                    {cardsBusy ? '만드는 중...' : '학습 카드 만들기'}
                  </button>
                )}
                <button className="quiet" onClick={() => navigate(cardCount > 0 ? '/review' : '/')}>
                  {cardCount > 0 ? '학습하러 가기' : '저장소로 돌아가기'}
                </button>
              </div>
            </div>
          )}

          {!prompt && !item.summary && !aiBusy && (
            <div className="ai-callout">
              <IconSparkle width={16} height={16} />
              <p>
                {hasAiKey()
                  ? isVideo
                    ? '영상을 AI가 직접 보고 한 줄 요약-핵심 내용-인사이트-태그로 정리합니다. 영상 길이에 따라 1-2분 걸립니다.'
                    : '원문을 AI가 읽고 한 줄 요약-핵심 내용-인사이트-태그로 정리합니다. 추가 비용은 없습니다.'
                  : '프롬프트를 생성해 Claude.ai(구독 중인 요금제)에 붙여넣고, 답변을 받아 다시 여기에 붙여넣으면 요약-핵심-태그가 정리되어 저장됩니다. 추가 API 비용은 없습니다.'}
              </p>
            </div>
          )}

          {aiBusy && (
            <div className="ai-callout">
              <IconSparkle width={16} height={16} />
              <p>
                {isVideo ? 'AI가 영상을 보는 중이에요' : 'AI가 요약을 만드는 중이에요'}
                {elapsed > 0 && ` - ${elapsed}초`}
                <br />
                <span className="ai-callout-sub">
                  {isVideo
                    ? '영상은 1-2분까지 걸릴 수 있어요. 다른 화면으로 가도 저장은 계속됩니다.'
                    : '보통 10초 안에 끝나요.'}
                </span>
              </p>
            </div>
          )}
          {aiError && !aiBusy && (
            <p className="hint" style={{ color: 'var(--danger)', marginBottom: 12 }}>{aiError}</p>
          )}

          {/* Once a summary exists, redoing it is no longer the main move -
              the next step is downstairs, so this steps back to a quiet one. */}
          {!prompt && !aiBusy && hasAiKey() && (
            <button
              className={`block ${item.summary ? 'quiet' : ''}`}
              onClick={() => runAutoSummary(item)}
            >
              <IconSparkle width={16} height={16} />
              {item.summary ? 'AI 요약 다시 생성' : aiError ? '다시 시도' : 'AI 요약 자동 생성'}
            </button>
          )}
          {!prompt && !aiBusy && (
            <button
              className={`block ${hasAiKey() ? 'quiet' : ''}`}
              style={hasAiKey() ? { marginTop: 8 } : undefined}
              onClick={handleGeneratePrompt}
            >
              <IconSparkle width={16} height={16} />
              {hasAiKey() ? '수동으로 (프롬프트 보내기)' : item.summary ? '다시 재가공하기' : 'AI 프롬프트 생성'}
            </button>
          )}

          {prompt && (
            <>
              <div className="step">
                <div className="step-label">
                  <span className="step-num">1</span>
                  프롬프트를 복사해 Claude.ai에 붙여넣기
                </div>
                <div className="prompt-box">{prompt}</div>
                {canShare() && (
                  <button
                    className="block"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      pendingAi.set(id, 'summary')
                      sendToAi(prompt, item.title)
                    }}
                  >
                    <IconSend width={16} height={16} />AI 앱으로 보내기
                  </button>
                )}
                <button className="block quiet" style={{ marginTop: 8 }} onClick={handleCopy}>
                  {copied ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />}
                  {copied ? '복사됨' : '프롬프트 복사'}
                </button>
              </div>

              <div className="step">
                <div className="step-label">
                  <span className="step-num">2</span>
                  답변을 붙여넣기 (공유로 받으면 생략)
                </div>
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder="Claude.ai에서 받은 답변을 그대로 붙여넣으세요."
                />
              </div>

              <button className="block" onClick={handleSaveSummary} disabled={saving || !pasted.trim()}>
                {saving ? '저장 중...' : '재가공 결과 저장'}
              </button>
              <button
                className="quiet block"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setPrompt('')
                  setPasted('')
                }}
              >
                취소
              </button>
            </>
          )}
        </div>

        <div className="section">
          <div className="section-label">
            <IconCards width={14} height={14} />
            학습 카드
          </div>

          {cardCount > 0 && !cardPrompt && (
            <p className="hint" style={{ marginBottom: 12 }}>
              이 지식으로 만든 카드 {cardCount}장이 학습 탭에서 복습됩니다.
            </p>
          )}

          {cardCount === 0 && !cardPrompt && (
            <p className="hint" style={{ marginBottom: 12 }}>
              문답 카드를 만들어 두면 학습 탭에서 간격을 두고 다시 물어봅니다.
            </p>
          )}

          {cardsBusy && (
            <p className="hint" style={{ marginBottom: 12 }}>AI가 문답 카드를 만드는 중이에요...</p>
          )}
          {cardsError && !cardsBusy && (
            <p className="hint" style={{ color: 'var(--danger)', marginBottom: 12 }}>{cardsError}</p>
          )}
          {/* The next-step panel above already offers this as the one blue
              button, so down here it steps aside rather than competing. */}
          {!cardPrompt && !cardsBusy && hasAiKey() && (
            <button
              className={`block ${item.summary && cardCount === 0 ? 'quiet' : ''}`}
              style={{ marginBottom: 8 }}
              onClick={runAutoCards}
            >
              <IconCards width={16} height={16} />
              {cardCount > 0 ? '카드 자동으로 더 만들기' : '학습 카드 자동 생성'}
            </button>
          )}
          {!cardPrompt && cardsBusy ? null : !cardPrompt ? (
            <button className="block quiet" onClick={handleGenerateCards}>
              <IconCards width={16} height={16} />
              {hasAiKey() ? '수동으로 만들기' : cardCount > 0 ? '카드 더 만들기' : '학습 카드 만들기'}
            </button>
          ) : (
            <>
              <div className="step">
                <div className="step-label">
                  <span className="step-num">1</span>
                  프롬프트를 복사해 Claude.ai에 붙여넣기
                </div>
                <div className="prompt-box">{cardPrompt}</div>
                {canShare() && (
                  <button
                    className="block"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      pendingAi.set(id, 'cards')
                      sendToAi(cardPrompt, item.title)
                    }}
                  >
                    <IconSend width={16} height={16} />AI 앱으로 보내기
                  </button>
                )}
                <button
                  className="block quiet"
                  style={{ marginTop: 8 }}
                  onClick={handleCopyCards}
                >
                  {cardsCopied ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />}
                  {cardsCopied ? '복사됨' : '프롬프트 복사'}
                </button>
              </div>

              <div className="step">
                <div className="step-label">
                  <span className="step-num">2</span>
                  답변을 붙여넣기 (공유로 받으면 생략)
                </div>
                <textarea
                  value={cardsPasted}
                  onChange={(e) => setCardsPasted(e.target.value)}
                  placeholder="Q와 A로 된 답변을 그대로 붙여넣으세요."
                />
                {cardsPasted.trim() && (
                  <p className="hint" style={{ marginTop: 8 }}>
                    카드 {parseCards(cardsPasted).length}장이 인식됐어요.
                  </p>
                )}
              </div>

              <button
                className="block"
                onClick={handleSaveCards}
                disabled={savingCards || parseCards(cardsPasted).length === 0}
              >
                {savingCards ? '저장 중...' : '학습 카드 저장'}
              </button>
              <button
                className="quiet block"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setCardPrompt('')
                  setCardsPasted('')
                }}
              >
                취소
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

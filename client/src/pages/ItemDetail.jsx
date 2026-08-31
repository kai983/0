import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { store } from '../store'
import AppBar from '../components/AppBar.jsx'
import Markdown from '../components/Markdown.jsx'
import { IconCheck, IconCopy, IconLink, IconNote, IconSparkle, IconTrash } from '../icons'

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
  }, [id])

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
    if (!confirm('이 지식 카드를 삭제할까요?')) return
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
          <div className="section-label">원문 · 메모</div>
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

          {!prompt && !item.summary && (
            <div className="ai-callout">
              <IconSparkle width={16} height={16} />
              <p>
                프롬프트를 생성해 Claude.ai(구독 중인 요금제)에 붙여넣고, 답변을 받아 다시 여기에
                붙여넣으면 요약·핵심·태그가 정리되어 저장됩니다. 추가 API 비용은 없습니다.
              </p>
            </div>
          )}

          {!prompt && (
            <button
              className={`block ${item.summary ? 'secondary' : ''}`}
              onClick={handleGeneratePrompt}
            >
              <IconSparkle width={16} height={16} />
              {item.summary ? '다시 재가공하기' : 'AI 프롬프트 생성'}
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
                <button className="block secondary" style={{ marginTop: 10 }} onClick={handleCopy}>
                  {copied ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />}
                  {copied ? '복사됨' : '프롬프트 복사'}
                </button>
              </div>

              <div className="step">
                <div className="step-label">
                  <span className="step-num">2</span>
                  Claude의 답변을 붙여넣기
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
      </div>
    </>
  )
}

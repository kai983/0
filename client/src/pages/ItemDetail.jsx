import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { store } from '../store'
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconLink,
  IconNote,
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
  const [copyStatus, setCopyStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    load()
  }, [id])

  function load() {
    setLoading(true)
    store
      .get(id)
      .then((data) => {
        setItem(data)
        setTagsInput(data.tags.join(', '))
      })
      .finally(() => setLoading(false))
  }

  async function handleGeneratePrompt() {
    const { prompt } = await store.getPrompt(id)
    setPrompt(prompt)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyStatus('복사됨')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus('직접 선택해서 복사해주세요')
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
      const extractedTags = extractTagsFromSummary(pasted)
      const mergedTags = Array.from(new Set([...item.tags, ...extractedTags]))
      const updated = await store.update(id, {
        summary: pasted,
        tags: mergedTags,
      })
      setItem(updated)
      setTagsInput(updated.tags.join(', '))
      setPasted('')
      setPrompt('')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTags() {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    const updated = await store.update(id, { tags })
    setItem(updated)
  }

  async function handleDelete() {
    if (!confirm('이 지식 카드를 삭제할까요?')) return
    await store.remove(id)
    navigate('/')
  }

  if (loading) return <p className="hint">불러오는 중...</p>
  if (!item) return <p className="hint">찾을 수 없습니다.</p>

  return (
    <div>
      <Link to="/" className="breadcrumb">
        <IconArrowLeft width={15} height={15} />
        아카이브
      </Link>

      <div className="card">
        <div className="item-title-row" style={{ marginBottom: 8 }}>
          {item.source_type === 'url' ? <IconLink width={16} height={16} /> : <IconNote width={16} height={16} />}
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem' }}>
            {item.title}
          </h1>
        </div>
        <div className="item-meta">{new Date(item.created_at).toLocaleString('ko-KR')}</div>
        {item.source_url && (
          <p style={{ marginTop: 10 }}>
            <a href={item.source_url} target="_blank" rel="noreferrer" className="detail-source">
              <IconLink width={13} height={13} />
              {item.source_url}
            </a>
          </p>
        )}

        <div className="field" style={{ marginTop: 18 }}>
          <label>태그</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            <button className="secondary" onClick={handleSaveTags}>
              저장
            </button>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>원문 / 메모</label>
          <div className="raw-content-view">{item.raw_content || '(원문 없음)'}</div>
        </div>
      </div>

      <h2 className="section-title">
        <IconSparkle width={17} height={17} />
        AI 재가공 (요약 · 구조화)
      </h2>
      <div className="card">
        {item.summary && <div className="summary-view" style={{ marginBottom: 16 }}>{item.summary}</div>}

        {!prompt && !item.summary && (
          <div className="ai-callout">
            <IconSparkle width={16} height={16} />
            <p>
              프롬프트를 생성해 Claude.ai(구독 중인 요금제)에 붙여넣고, 답변을 받아 다시 여기 붙여넣어
              저장하세요. 별도 API 비용이 들지 않습니다.
            </p>
          </div>
        )}

        {!prompt && (
          <button className={item.summary ? 'secondary' : undefined} onClick={handleGeneratePrompt}>
            <IconSparkle width={15} height={15} />
            {item.summary ? '다시 재가공하기' : 'AI 프롬프트 생성'}
          </button>
        )}

        {prompt && (
          <>
            <div className="field" style={{ marginTop: 16 }}>
              <label>1. 아래 프롬프트를 복사해서 Claude.ai에 붙여넣으세요</label>
              <div className="prompt-box">{prompt}</div>
              <button className="secondary" style={{ marginTop: 8 }} onClick={handleCopy}>
                {copyStatus === '복사됨' ? <IconCheck width={15} height={15} /> : <IconCopy width={15} height={15} />}
                프롬프트 복사 {copyStatus && `· ${copyStatus}`}
              </button>
            </div>

            <div className="field">
              <label>2. Claude의 답변을 여기에 붙여넣으세요</label>
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Claude.ai에서 받은 답변을 그대로 붙여넣으세요."
              />
            </div>

            <button onClick={handleSaveSummary} disabled={saving || !pasted.trim()}>
              {saving ? '저장 중...' : '3. 재가공 결과 저장'}
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="danger-ghost" onClick={handleDelete}>
          <IconTrash width={15} height={15} />
          이 카드 삭제
        </button>
      </div>
    </div>
  )
}

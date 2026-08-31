import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import AppBar from '../components/AppBar.jsx'

export default function AddItem() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [sourceType, setSourceType] = useState('text')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const item = await store.create({
        title,
        sourceType,
        sourceUrl: sourceType === 'url' ? sourceUrl : '',
        rawContent,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      navigate(`/items/${item.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AppBar title="새 지식" back />
      <form className="page" onSubmit={handleSubmit}>
        <div className="field">
          <label>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 좋은 습관 형성에 관한 아티클"
          />
        </div>

        <div className="field">
          <label>출처 유형</label>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <option value="text">텍스트 (메모 - 붙여넣기)</option>
            <option value="url">URL (유튜브 - 기사 - 레포트)</option>
          </select>
        </div>

        {sourceType === 'url' && (
          <div className="field">
            <label>출처 URL</label>
            <input
              type="url"
              inputMode="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        <div className="field">
          <label>원문 - 메모</label>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="유튜브 자막, 기사 본문, 레포트 내용, 떠오른 생각을 붙여넣으세요."
          />
          <p className="hint" style={{ marginTop: 8 }}>
            URL만 있고 본문이 없어도 괜찮아요. AI 프롬프트를 만들 때 URL을 함께 전달합니다.
          </p>
        </div>

        <div className="field">
          <label>태그 (쉼표로 구분)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="생산성, AI, 마케팅"
          />
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.87rem', marginTop: -6 }}>{error}</p>
        )}

        <button type="submit" className="block" disabled={saving}>
          {saving ? '저장 중...' : '저장하고 계속하기'}
        </button>
      </form>
    </>
  )
}

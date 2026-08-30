import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

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
    e.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const item = await api.create({
        title,
        sourceType,
        sourceUrl: sourceType === 'url' ? sourceUrl : '',
        rawContent,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      navigate(`/items/${item.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2>새 지식 등록</h2>
      <form className="card" onSubmit={handleSubmit}>
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
            <option value="text">텍스트 (직접 메모/붙여넣기)</option>
            <option value="url">URL (유튜브/기사/레포트 링크)</option>
          </select>
        </div>

        {sourceType === 'url' && (
          <div className="field">
            <label>출처 URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        <div className="field">
          <label>원문 / 메모</label>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="유튜브 자막, 기사 본문, 레포트 내용, 떠오른 생각 등을 붙여넣으세요."
          />
          <div className="hint">
            URL만 있고 본문이 없어도 괜찮아요. 다음 단계에서 AI 프롬프트를 만들 때 URL을 함께 전달합니다.
          </div>
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

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? '저장 중...' : '저장하고 계속하기'}
        </button>
      </form>
    </div>
  )
}

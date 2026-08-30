import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'

export default function ArchiveList() {
  const [items, setItems] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const activeTag = searchParams.get('tag') || ''

  useEffect(() => {
    api.tags().then(setAllTags).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .list({ q, tag: activeTag })
      .then(setItems)
      .finally(() => setLoading(false))
  }, [q, activeTag])

  function updateQuery(next) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      Object.entries(next).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      return params
    })
  }

  return (
    <div>
      <div className="toolbar">
        <input
          type="text"
          placeholder="제목/내용/요약 검색..."
          value={q}
          onChange={(e) => updateQuery({ q: e.target.value })}
        />
      </div>

      {allTags.length > 0 && (
        <div className="tag-list" style={{ marginBottom: 20 }}>
          <button
            className={`tag clickable ${activeTag === '' ? '' : 'secondary'}`}
            style={{ border: 'none' }}
            onClick={() => updateQuery({ tag: '' })}
          >
            전체
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className="tag clickable"
              style={{
                border: 'none',
                background: tag === activeTag ? '#b5602e' : undefined,
                color: tag === activeTag ? 'white' : undefined,
              }}
              onClick={() => updateQuery({ tag: tag === activeTag ? '' : tag })}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p>불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <p>아직 저장된 지식이 없어요.</p>
          <Link to="/add">
            <button>+ 첫 지식 등록하기</button>
          </Link>
        </div>
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <Link key={item.id} to={`/items/${item.id}`} className="item-card card">
              <div className="item-title">{item.title}</div>
              <div className="item-meta">
                {item.source_type === 'url' ? '🔗 URL' : '📝 텍스트'} ·{' '}
                {new Date(item.updated_at).toLocaleDateString('ko-KR')}
                {item.summary ? ' · AI 재가공 완료' : ' · 재가공 전'}
              </div>
              {item.tags.length > 0 && (
                <div className="tag-list">
                  {item.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

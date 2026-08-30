import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { store } from '../store'
import { IconArchive, IconLink, IconNote, IconSearch } from '../icons'

export default function ArchiveList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const activeTag = searchParams.get('tag') || ''

  useEffect(() => {
    setLoading(true)
    store
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
      <h1 className="page-title">아카이브</h1>

      <div className="toolbar">
        <div className="search-box">
          <IconSearch width={16} height={16} />
          <input
            type="text"
            placeholder="제목/내용/요약 검색..."
            value={q}
            onChange={(e) => updateQuery({ q: e.target.value })}
          />
        </div>
      </div>

      {activeTag && (
        <Link to="/" className="active-filter">
          #{activeTag} 필터 중 · 해제 ×
        </Link>
      )}

      {loading ? (
        <p className="hint">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🗂️</div>
          <p>{q || activeTag ? '조건에 맞는 지식이 없어요.' : '아직 저장된 지식이 없어요.'}</p>
          <Link to="/add">
            <button>
              <IconArchive width={16} height={16} />첫 지식 등록하기
            </button>
          </Link>
        </div>
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              className={`item-card card source-${item.source_type}`}
            >
              <div className="item-title-row">
                {item.source_type === 'url' ? (
                  <IconLink width={15} height={15} />
                ) : (
                  <IconNote width={15} height={15} />
                )}
                <span className="item-title">{item.title}</span>
              </div>
              <div className="item-meta">
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

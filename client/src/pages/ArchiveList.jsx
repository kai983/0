import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { store } from '../store'
import AppBar from '../components/AppBar.jsx'
import { IconLink, IconNote, IconSearch } from '../icons'

export default function ArchiveList() {
  const [items, setItems] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const activeTag = searchParams.get('tag') || ''

  useEffect(() => {
    store.tags().then(setTags)
  }, [items.length])

  useEffect(() => {
    setLoading(true)
    store
      .list({ q, tag: activeTag })
      .then(setItems)
      .finally(() => setLoading(false))
  }, [q, activeTag])

  function updateQuery(next) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        Object.entries(next).forEach(([k, v]) => {
          if (v) params.set(k, v)
          else params.delete(k)
        })
        return params
      },
      { replace: true }
    )
  }

  return (
    <>
      <AppBar title="아카이브" />
      <div className="page">
        <div className="search-box">
          <IconSearch width={17} height={17} />
          <input
            type="text"
            placeholder="제목, 내용, 요약 검색"
            value={q}
            onChange={(e) => updateQuery({ q: e.target.value })}
          />
        </div>

        {tags.length > 0 && (
          <div className="tag-strip">
            <button
              className={`tag-chip ${activeTag ? '' : 'active'}`}
              onClick={() => updateQuery({ tag: '' })}
            >
              전체
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`tag-chip ${activeTag === tag ? 'active' : ''}`}
                onClick={() => updateQuery({ tag: activeTag === tag ? '' : tag })}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="hint" style={{ marginTop: 20 }}>
            불러오는 중...
          </p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗂️</div>
            <p>{q || activeTag ? '조건에 맞는 지식이 없어요.' : '아직 저장된 지식이 없어요.'}</p>
            {!q && !activeTag && (
              <Link to="/add">
                <button>첫 지식 등록하기</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="item-list">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className={`item-card source-${item.source_type}`}
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
                  <span className={`item-badge ${item.summary ? '' : 'pending'}`}>
                    {item.summary ? 'AI 요약됨' : '재가공 전'}
                  </span>
                  {new Date(item.updated_at).toLocaleDateString('ko-KR')}
                </div>
                {item.tags.length > 0 && (
                  <div className="item-tags">
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
    </>
  )
}

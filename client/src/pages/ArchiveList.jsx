import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { excerptOf, store } from '../store'
import ThemeSheet from '../components/ThemeSheet.jsx'
import { applyTheme, getTheme } from '../theme'
import { IconPalette, IconSearch } from '../icons'

export default function ArchiveList() {
  const [items, setItems] = useState([])
  const [tags, setTags] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(getTheme)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const activeTag = searchParams.get('tag') || ''

  useEffect(() => {
    store.tags().then(setTags)
    store.list().then((all) => setTotal(all.length))
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

  function pickTheme(id) {
    setTheme(applyTheme(id))
    setSheetOpen(false)
  }

  return (
    <div className="page page-top">
      <div className="list-head">
        <h1 className="list-title">저장소</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="list-count">{total}개</span>
          <button className="appbar-icon-btn" onClick={() => setSheetOpen(true)} aria-label="테마 바꾸기">
            <IconPalette width={19} height={19} />
          </button>
        </div>
      </div>

      <div className="search-box">
        <IconSearch width={16} height={16} />
        <input
          type="text"
          placeholder="무엇을 찾으세요?"
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
        <p className="hint" style={{ marginTop: 24 }}>
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
          {items.map((item) => {
            const excerpt = excerptOf(item)
            return (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className={`item-card ${item.summary ? '' : 'pending'}`}
              >
                <div className="item-meta">
                  <span className="date-full">{formatDate(item.updated_at)}</span>
                  <span className="date-short">{formatShortDate(item.updated_at)}</span>
                  <span className="dot"></span>
                  <span className={`item-state ${item.summary ? 'done' : ''}`}>
                    {item.summary ? 'AI 요약' : '요약 전'}
                  </span>
                </div>
                <h2 className="item-title">{item.title}</h2>
                {excerpt && <p className="item-excerpt">{excerpt}</p>}
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
            )
          })}
        </div>
      )}

      {sheetOpen && (
        <ThemeSheet current={theme} onPick={pickTheme} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  )
}

function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(
    d.getDate()
  ).padStart(2, '0')}.`
}

/** The index theme shows the date in a narrow gutter, so it needs a short form. */
function formatShortDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()}`
}

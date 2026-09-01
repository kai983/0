import { Fragment, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { excerptOf, store } from '../store'
import ThemeSheet from '../components/ThemeSheet.jsx'
import { applyTheme, getTheme } from '../theme'
import { ArtEmptyArchive, IconLink, IconNote, IconPalette, IconSearch, IconVideo } from '../icons'
import { isVideoSource } from '../ai'
import { dateBucket, daysSince } from '../dates'

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
          <div className="empty-state-icon">
            <ArtEmptyArchive />
          </div>
          <p>{q || activeTag ? '조건에 맞는 지식이 없어요.' : '아직 저장된 지식이 없어요.'}</p>
          {!q && !activeTag && (
            <Link to="/add">
              <button>첫 지식 등록하기</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="item-list">
          {groupByDate(items).map((group) => (
            <Fragment key={`${group.label}-${group.items[0].id}`}>
              <div className="date-group">
                {group.label} <span>{group.items.length}</span>
              </div>
              {group.items.map((item) => {
                const excerpt = excerptOf(item)
                const kind = sourceKind(item)
                return (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className={`item-card ${item.summary ? '' : 'pending'}`}
                  >
                    <span className={`item-dot dot-${kind}`}></span>
                    <div className="item-meta">
                      <SourceGlyph kind={kind} />
                      <span className="date-full">
                        {SOURCE_LABEL[kind]} - {relativeDate(item.updated_at)}
                      </span>
                      <span className="date-short">{formatShortDate(item.updated_at)}</span>
                      {!item.summary && <span className="item-state">요약 전</span>}
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
            </Fragment>
          ))}
        </div>
      )}

      {sheetOpen && (
        <ThemeSheet current={theme} onPick={pickTheme} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  )
}

const SOURCE_LABEL = { video: '유튜브', link: '기사', note: '메모' }

function sourceKind(item) {
  if (isVideoSource(item.source_url)) return 'video'
  if (item.source_url) return 'link'
  return 'note'
}

function SourceGlyph({ kind }) {
  const props = { width: 13, height: 13, className: 'item-source-glyph' }
  if (kind === 'video') return <IconVideo {...props} />
  if (kind === 'link') return <IconLink {...props} />
  return <IconNote {...props} />
}

/** "오늘 - 어제 - N일 전 - 지난주"; anything older reads as a plain date.
    Week words defer to dateBucket so they can't disagree with the ledger. */
function relativeDate(iso) {
  const days = daysSince(iso)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return dateBucket(iso) === '지난주' ? '지난주' : formatDate(iso)
}

function groupByDate(items) {
  const groups = []
  for (const item of items) {
    const label = dateBucket(item.updated_at)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(
    d.getDate()
  ).padStart(2, '0')}.`
}

/** The index ledger's date column - zero-padded so the digits line up, and
    carrying a two-digit year once the item is no longer from this year. */
function formatShortDate(iso) {
  const d = new Date(iso)
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  if (d.getFullYear() === new Date().getFullYear()) return md
  return `${String(d.getFullYear()).slice(2)}.${md}`
}

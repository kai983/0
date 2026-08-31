import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cards as cardStore } from '../cards'
import { store } from '../store'

const GRADES = [
  { id: 'again', label: '다시', hint: '틀렸어요' },
  { id: 'hard', label: '어려움', hint: '겨우' },
  { id: 'good', label: '좋음', hint: '기억남' },
  { id: 'easy', label: '쉬움', hint: '바로' },
]

export default function Review() {
  const [queue, setQueue] = useState([])
  const [nextDue, setNextDue] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    Promise.all([cardStore.due(), cardStore.nextDue(), cardStore.all()])
      .then(([dueCards, next, all]) => {
        setQueue(dueCards)
        setNextDue(next)
        setTotal(all.length)
      })
      .finally(() => setLoading(false))
  }

  async function handleGrade(grade) {
    const card = queue[0]
    await cardStore.grade(card.id, grade)
    setRevealed(false)
    setDone((n) => n + 1)
    // "다시" keeps the card in this session; anything else pushes it into the future.
    setQueue((q) => (grade === 'again' ? [...q.slice(1), q[0]] : q.slice(1)))
  }

  if (loading) {
    return (
      <div className="page page-top">
        <h1 className="list-title">학습</h1>
        <p className="hint" style={{ marginTop: 20 }}>
          불러오는 중...
        </p>
      </div>
    )
  }

  const card = queue[0]

  if (!card) {
    return (
      <div className="page page-top">
        <div className="list-head">
          <h1 className="list-title">학습</h1>
          <span className="list-count">{total}장</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">{done > 0 ? '🎉' : '🗂️'}</div>
          {done > 0 ? (
            <p>오늘 몫 {done}장을 모두 마쳤어요.</p>
          ) : total === 0 ? (
            <p>
              아직 학습 카드가 없어요.
              <br />
              지식 카드에서 만들 수 있어요.
            </p>
          ) : (
            <p>지금 복습할 카드가 없어요.{nextDue && <><br />{describeNext(nextDue)}</>}</p>
          )}
          {total === 0 && (
            <Link to="/">
              <button>아카이브로 가기</button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page page-top">
      <div className="list-head">
        <h1 className="list-title">학습</h1>
        <span className="list-count">{queue.length}장 남음</span>
      </div>

      <div className="review-card">
        <div className="review-front">{card.front}</div>
        {revealed && (
          <>
            <div className="review-divider"></div>
            <div className="review-back">{card.back}</div>
          </>
        )}
      </div>

      {revealed ? (
        <div className="grade-row">
          {GRADES.map((g) => (
            <button key={g.id} className={`grade-btn grade-${g.id}`} onClick={() => handleGrade(g.id)}>
              <span className="grade-label">{g.label}</span>
              <span className="grade-hint">{g.hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <button className="block" style={{ marginTop: 16 }} onClick={() => setRevealed(true)}>
          답 보기
        </button>
      )}

      <SourceLink itemId={card.item_id} />
    </div>
  )
}

function SourceLink({ itemId }) {
  const [item, setItem] = useState(null)

  useEffect(() => {
    store.get(itemId).then(setItem).catch(() => setItem(null))
  }, [itemId])

  if (!item) return null
  return (
    <Link to={`/items/${item.id}`} className="review-source">
      출처: {item.title}
    </Link>
  )
}

function describeNext(due) {
  const now = new Date()
  const then = new Date(due)
  const days = Math.ceil((then - now) / 86400000)
  if (days <= 0) return '곧 다시 볼 수 있어요.'
  if (days === 1) return '내일 다시 볼 카드가 있어요.'
  return `${days}일 뒤에 다시 볼 카드가 있어요.`
}

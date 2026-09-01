import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cards as cardStore, schedule } from '../cards'
import { store } from '../store'
import { ArtNoCards, ArtSessionDone, IconArchive } from '../icons'

const GRADES = [
  { id: 'again', label: '다시' },
  { id: 'hard', label: '어려움' },
  { id: 'good', label: '좋음' },
  { id: 'easy', label: '쉬움' },
]

/** When this card would come back if graded that way - honest, per card. */
function intervalHint(card, grade) {
  const days = schedule(card, grade).interval
  return days <= 0 ? '지금' : `${days}일`
}

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
    if (grade === 'again') {
      // The card stays in this session, carrying the state the grade just
      // stored - hints computed from it must match what the store now holds.
      setQueue((q) => [...q.slice(1), { ...q[0], ...schedule(q[0], 'again') }])
    } else {
      setDone((n) => n + 1)
      setQueue((q) => q.slice(1))
    }
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
          <div className="empty-state-icon">
            {done > 0 ? <ArtSessionDone /> : <ArtNoCards />}
          </div>
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
              <button>저장소로 가기</button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  const seen = done + 1

  return (
    <div className="page page-top page-quiz">
      <div className="quiz-head">
        <h1 className="list-title">학습</h1>
        <span className="quiz-count">
          {seen} / {done + queue.length}
        </span>
      </div>

      <div className="quiz-progress">
        <i style={{ width: `${Math.round((done / (done + queue.length)) * 100)}%` }}></i>
      </div>

      <div className="quiz-body">
        <p className="quiz-label">문제</p>
        <p className="quiz-question">{card.front}</p>

        {revealed && (
          <div className="quiz-answer">
            <p className="quiz-label">답</p>
            <p className="quiz-answer-text">{card.back}</p>
          </div>
        )}
      </div>

      <SourceLink itemId={card.item_id} />

      <div className="quiz-actions">
        {revealed ? (
          <div className="grade-row">
            {GRADES.map((g) => (
              <button
                key={g.id}
                className={`grade-btn grade-${g.id}`}
                onClick={() => handleGrade(g.id)}
              >
                <span className="grade-label">{g.label}</span>
                <span className="grade-hint">{intervalHint(card, g.id)}</span>
              </button>
            ))}
          </div>
        ) : (
          <button className="quiz-cta" onClick={() => setRevealed(true)}>
            답 확인하기
          </button>
        )}
      </div>
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
    <Link to={`/items/${item.id}`} className="quiz-source">
      <IconArchive width={13} height={13} />
      <span>{item.title}</span>
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

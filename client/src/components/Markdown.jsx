/**
 * Minimal renderer for the summary format the AI prompt asks for:
 * `## headings`, `- bullets`, and plain paragraphs. Dependency-free and
 * text-only (no HTML injection).
 */
export default function Markdown({ text }) {
  if (!text) return null

  const blocks = []
  let bullets = []

  const flushBullets = () => {
    if (bullets.length) {
      blocks.push({ type: 'list', items: bullets })
      bullets = []
    }
  }

  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()

    if (!line) {
      flushBullets()
      return
    }
    if (/^#{1,6}\s/.test(line)) {
      flushBullets()
      blocks.push({ type: 'heading', text: line.replace(/^#{1,6}\s*/, '') })
      return
    }
    if (/^[-*•]\s/.test(line)) {
      bullets.push(line.replace(/^[-*•]\s*/, ''))
      return
    }
    flushBullets()
    blocks.push({ type: 'paragraph', text: line })
  })
  flushBullets()

  return (
    <div className="markdown">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h3 key={i} className="markdown-heading">
              {block.text}
            </h3>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="markdown-list">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="markdown-paragraph">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

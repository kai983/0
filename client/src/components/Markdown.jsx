/**
 * Minimal renderer for the summary format the AI prompt asks for:
 * `## headings`, `- bullets`, and plain paragraphs, with **bold**, *italic*
 * and `code` inside them. Dependency-free and text-only (no HTML injection).
 */

// Split on the inline marks in one pass so the parts stay in order.
const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|__[^_\n]+__|_[^_\n]+_|`[^`\n]+`)/g

/** Turns one line of text into React nodes, keeping the marks out of the output. */
function inline(text) {
  const parts = text.split(INLINE).filter(Boolean)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>
    }
    if (
      (part.startsWith('*') && part.endsWith('*')) ||
      (part.startsWith('_') && part.endsWith('_'))
    ) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

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
    // A lone "**제목**" line is a heading in everything but syntax.
    if (/^\*\*[^*]+\*\*:?$/.test(line)) {
      flushBullets()
      blocks.push({ type: 'heading', text: line.replace(/^\*\*|\*\*:?$/g, '') })
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
              {inline(block.text)}
            </h3>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="markdown-list">
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="markdown-paragraph">
            {inline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

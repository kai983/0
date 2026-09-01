/**
 * One consistent set: 24px grid, 2px stroke, round caps and joins.
 * The AI mark is the single filled exception - a four-point star that pairs
 * with the AI gradient, since gradient marks AI and nothing else.
 */
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconArchive(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 4h8a2 2 0 0 1 2 2v13.2a1 1 0 0 1-1.5.86L12 17.4l-4.5 2.66A1 1 0 0 1 6 19.2V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

export function IconPlus(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  )
}

export function IconTag(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5.4a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-5 5a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1-.6-1.4z" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconLink(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 13.5a4 4 0 0 0 5.7.3l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.3l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" />
    </svg>
  )
}

export function IconNote(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h11l3.5 3.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  )
}

export function IconVideo(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="4" />
      <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconArrowLeft(props) {
  return (
    <svg {...base} {...props}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function IconCopy(props) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </svg>
  )
}

export function IconCheck(props) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  )
}

export function IconTrash(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 7h12l-1 12.2a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8z" />
      <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
      <path d="M4 7h16" />
    </svg>
  )
}

export function IconSend(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 4L10.5 13.8" />
      <path d="M20 4l-6.3 17-3.2-7.2L3.5 10.4z" />
    </svg>
  )
}

export function IconCards(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="14" height="13" rx="2.5" />
      <path d="M8 3h10a3 3 0 0 1 3 3v10" />
    </svg>
  )
}

export function IconPalette(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 4.5v1.8M12 17.7v1.8M19.5 12h-1.8M6.3 12H4.5M17.3 6.7l-1.3 1.3M8 16l-1.3 1.3M17.3 17.3L16 16M8 8L6.7 6.7" />
    </svg>
  )
}

export function IconSparkle(props) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.6l2.4 7 6.9 2.1-6.9 2.1-2.4 7-2.4-7-6.9-2.1 6.9-2.1z" />
    </svg>
  )
}

export function IconExport(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v11" />
      <path d="M8 10.5l4 4 4-4" />
      <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

export function IconImport(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 14V3" />
      <path d="M8 6.5l4-4 4 4" />
      <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

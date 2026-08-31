const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconArchive(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 13h4" />
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
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function IconTag(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12.5 3H5a2 2 0 0 0-2 2v7.5a2 2 0 0 0 .59 1.41l9.5 9.5a2 2 0 0 0 2.82 0l7.5-7.5a2 2 0 0 0 0-2.82l-9.5-9.5A2 2 0 0 0 12.5 3Z" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconLink(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.13 1.11" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.11-1.11" />
    </svg>
  )
}

export function IconNote(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}

export function IconArrowLeft(props) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}

export function IconCopy(props) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  )
}

export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function IconTrash(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconCards(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="7" width="14" height="14" rx="2" />
      <path d="M7 4h12a2 2 0 0 1 2 2v11" />
      <path d="M7 12h6M7 16h4" />
    </svg>
  )
}

export function IconPalette(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 1 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01a1.5 1.5 0 0 1 1.11-2.49H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8Z" />
      <circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSparkle(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  )
}

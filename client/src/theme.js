import { registerPlugin } from '@capacitor/core'

const STORAGE_KEY = 'knowledge-archive:theme:v1'

export const THEMES = [
  {
    id: 'toss',
    name: '토스풍',
    tagline: '국내 앱 문법 - 또렷한 대비',
    dark: false,
    swatch: { bg: '#ffffff', ink: '#191f28', accent: '#3182f6' },
  },
  {
    id: 'editorial',
    name: '편집형',
    tagline: '읽기 우선 - 넉넉한 여백',
    dark: false,
    swatch: { bg: '#fbfaf7', ink: '#171614', accent: '#2f5d50' },
  },
  {
    id: 'index',
    name: '인덱스형',
    tagline: '찾기 우선 - 한 화면에 많이',
    dark: false,
    swatch: { bg: '#ffffff', ink: '#111111', accent: '#111111' },
  },
  {
    id: 'immersive',
    name: '몰입형',
    tagline: '다크 - 밤에 보기 편하게',
    dark: true,
    swatch: { bg: '#14130f', ink: '#f2efe6', accent: '#e8a33d' },
  },
]

export const DEFAULT_THEME = 'toss'

export function getTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (THEMES.some((t) => t.id === saved)) return saved
  } catch {
    // localStorage can be unavailable; fall through to the default
  }
  return DEFAULT_THEME
}

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0]

  document.documentElement.setAttribute('data-theme', theme.id)

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.swatch.bg)

  // The Android status bar draws over the app (edge-to-edge), so its icons
  // have to flip with the theme or they vanish against the background.
  try {
    const SystemBars = registerPlugin('SystemBars')
    SystemBars.setStyle({ style: theme.dark ? 'DARK' : 'LIGHT' })
  } catch {
    // Not running inside Capacitor - nothing to do.
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme.id)
  } catch {
    // Persisting is best-effort; the theme still applies for this session.
  }

  return theme.id
}

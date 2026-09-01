import { registerPlugin } from '@capacitor/core'

export const THEME_KEY = 'knowledge-archive:theme:v1'
const STORAGE_KEY = THEME_KEY

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
    swatch: { bg: '#faf7f2', ink: '#1f1b16', accent: '#b04a2f' },
  },
  {
    id: 'index',
    name: '인덱스형',
    tagline: '찾기 우선 - 한 화면에 많이',
    dark: false,
    swatch: { bg: '#fcfcfd', ink: '#16181d', accent: '#16181d' },
  },
  {
    id: 'immersive',
    name: '몰입형',
    tagline: '다크 - 밤에 보기 편하게',
    dark: true,
    swatch: { bg: '#0b0c0e', ink: '#edeff3', accent: '#ecae52' },
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

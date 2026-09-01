import { Capacitor, registerPlugin } from '@capacitor/core'
import { Share } from '@capacitor/share'

const PENDING_KEY = 'knowledge-archive:pending-ai:v1'
const ShareTarget = registerPlugin('ShareTarget')

/**
 * What a share sheet hands us is one blob of text. YouTube sends
 * "제목\nhttps://youtu.be/...", a browser usually sends just the URL, and an AI
 * app sends the answer. Split it into the fields the add form wants.
 */
export function parseShared({ text = '', subject = '' } = {}) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const urlLine = lines.find((l) => /^https?:\/\/\S+$/.test(l))
  const url = urlLine || (text.match(/https?:\/\/\S+/) || [])[0] || ''

  const rest = lines.filter((l) => l !== urlLine)
  const title = (subject || rest[0] || '').trim()
  const body = rest.slice(title && rest[0] === title ? 1 : 0).join('\n')

  return {
    title: title.slice(0, 120),
    url,
    body,
    raw: text,
    isUrlOnly: Boolean(url) && rest.length === 0,
  }
}

/** True when the text looks like an answer to one of our prompts. */
export function looksLikeAiAnswer(text = '') {
  return /^\s*#{1,3}\s/m.test(text) || /^\s*(?:Q|질문)\s*[:.]/im.test(text)
}

/** Remembers which card asked for what, so a shared answer can find its way home. */
export const pendingAi = {
  set(itemId, kind) {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ itemId, kind, at: Date.now() }))
    } catch {
      // Best effort; the share screen still offers a manual choice.
    }
  },
  get() {
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      if (!raw) return null
      const value = JSON.parse(raw)
      // A request older than a day is almost certainly not what just came back.
      if (Date.now() - value.at > 86400000) return null
      return value
    } catch {
      return null
    }
  },
  clear() {
    try {
      localStorage.removeItem(PENDING_KEY)
    } catch {
      // nothing to do
    }
  },
}

/** Opens the system share sheet so the text can go straight into an AI app. */
export async function sendToAi(text, title) {
  try {
    await Share.share({ title, text, dialogTitle: 'AI 앱으로 보내기' })
    return true
  } catch {
    // Cancelled, or not running on a device that can share.
    return false
  }
}

export function canShare() {
  return typeof Share?.share === 'function'
}

/**
 * The native plugin, or a stand-in during development so the share screens can
 * be driven without a device. The branch is compiled out of release builds.
 */
function target() {
  if (import.meta.env.DEV && window.__shareTargetMock) return window.__shareTargetMock
  return ShareTarget
}

const DIAG_KEY = 'knowledge-archive:share-diag:v1'

/**
 * A share that goes nowhere leaves no trace to debug, so each attempt records
 * what happened. The settings screen reads this back.
 */
function noteShare(stage, detail) {
  try {
    localStorage.setItem(DIAG_KEY, JSON.stringify({ stage, detail, at: new Date().toISOString() }))
  } catch {
    // Diagnostics are best effort.
  }
}

/** What the last share attempt did, for the settings screen. */
export function shareDiagnostic() {
  try {
    const raw = localStorage.getItem(DIAG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Reads a share that launched the app, if any. */
export async function consumeShare() {
  try {
    const { value } = await target().consume()
    if (value) noteShare('받음', '앱이 켜질 때 공유를 받았어요')
    else noteShare('대기', '플러그인은 연결됐고, 받은 공유는 없어요')
    return value || null
  } catch (err) {
    // In a browser there is no native plugin, which is expected rather than
    // broken. On a device this is the failure that looks like "nothing
    // happened", so it is the one worth reporting.
    if (Capacitor.isNativePlatform()) {
      noteShare('연결 실패', err?.message || '공유 플러그인에 연결하지 못했어요')
    } else {
      noteShare('웹', '브라우저에서는 앱 공유 기능이 동작하지 않아요')
    }
    return null
  }
}

/** Subscribes to shares that arrive while the app is already open. */
export function onShare(handler) {
  let remove = () => {}
  target()
    .addListener('shareReceived', (value) => {
      noteShare('받음', '앱이 켜져 있는 동안 공유를 받았어요')
      // The native side retains the payload so it cannot be lost; clearing it
      // here keeps the next launch from replaying the same share.
      target().consume().catch(() => {})
      handler(value)
    })
    .then((h) => {
      remove = () => h.remove()
    })
    .catch((err) => {
      if (Capacitor.isNativePlatform()) {
        noteShare('연결 실패', err?.message || '공유 이벤트를 구독하지 못했어요')
      }
    })
  return () => remove()
}

import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { buildCardsPrompt, buildSummaryPrompt } from './promptTemplate'

const KEY_STORAGE = 'knowledge-archive:gemini-key:v1'
// gemini-2.5-flash is closed to new accounts; 3.6-flash is the current free model.
const MODEL = 'gemini-3.6-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// Baked in at build time from the GEMINI_KEY secret (empty in dev builds),
// so the app works out of the box. A key entered in settings overrides it.
const DEFAULT_KEY = __DEFAULT_AI_KEY__

const YOUTUBE = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/

export const aiKey = {
  get() {
    return this.stored() || DEFAULT_KEY
  },
  /** Only what the user typed themselves; empty when running on the built-in key. */
  stored() {
    try {
      return localStorage.getItem(KEY_STORAGE) || ''
    } catch {
      return ''
    }
  },
  set(value) {
    try {
      if (value) localStorage.setItem(KEY_STORAGE, value.trim())
      else localStorage.removeItem(KEY_STORAGE)
    } catch {
      // Best effort; without storage the key just has to be re-entered.
    }
  },
}

export function hasAiKey() {
  return Boolean(aiKey.get())
}

/**
 * One generateContent call. Native goes through CapacitorHttp so the WebView's
 * origin rules stay out of the way; the browser build uses fetch.
 */
async function generate(parts, tools) {
  const body = {
    contents: [{ parts }],
    ...(tools ? { tools } : {}),
  }

  if (import.meta.env.DEV && window.__aiMock) {
    return window.__aiMock(body)
  }

  const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': aiKey.get() }
  let status
  let data

  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({ url: ENDPOINT, method: 'POST', headers, data: body })
    status = res.status
    data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
  } else {
    const res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(body) })
    status = res.status
    data = await res.json().catch(() => ({}))
  }

  if (status === 429) throw new Error('무료 한도에 걸렸어요. 1분쯤 뒤에 다시 시도해 주세요.')
  if (status === 503) throw new Error('지금 이용자가 몰려 있어요. 잠시 뒤에 다시 시도해 주세요.')
  if (status === 400 || status === 401 || status === 403) {
    // Surface Google's own reason (expired key, wrong key type, region block,
    // ...) instead of guessing - "invalid key" is only one of several causes.
    const reason = data?.error?.message ? ` (${data.error.message})` : ''
    throw new Error(`API 키가 올바르지 않아요. 설정에서 다시 확인해 주세요.${reason}`)
  }
  if (status < 200 || status >= 300) {
    throw new Error(data?.error?.message || `요청이 실패했어요 (${status})`)
  }

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('')
    .trim()
  if (!text) throw new Error('빈 답변이 왔어요. 다시 시도해 주세요.')
  return text
}

function partsFor(item, promptText) {
  const url = item.source_url || ''
  if (YOUTUBE.test(url)) {
    // Gemini reads public YouTube videos directly from the URL.
    return { parts: [{ file_data: { file_uri: url } }, { text: promptText }], tools: undefined }
  }
  if (url) {
    // For articles, let the model fetch the page itself.
    return { parts: [{ text: promptText }], tools: [{ url_context: {} }] }
  }
  return { parts: [{ text: promptText }], tools: undefined }
}

/** The whole reprocessing step, automatically: returns the summary markdown. */
export function summarizeItem(item) {
  const prompt = buildSummaryPrompt({
    title: item.title,
    sourceType: item.source_type,
    sourceUrl: item.source_url,
    rawContent: item.raw_content,
  })
  const { parts, tools } = partsFor(item, prompt)
  return generate(parts, tools)
}

/** Q/A pairs for the learning tab, in the format parseCards() reads. */
export function makeCardsForItem(item) {
  const prompt = buildCardsPrompt({
    title: item.title,
    summary: item.summary,
    rawContent: item.raw_content,
  })
  // Cards come from the already-saved summary or note, so no tools needed.
  return generate([{ text: prompt }])
}

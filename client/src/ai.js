import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { buildCardsPrompt, buildSummaryPrompt } from './promptTemplate'

const KEY_STORAGE = 'knowledge-archive:gemini-key:v1'
// An alias rather than a pinned version: gemini-2.5-flash was retired for new
// accounts mid-project, and this tracks whatever the current flash model is.
const MODEL = 'gemini-flash-latest'
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
/**
 * Sends one request. `asText` controls how the body reaches the native layer:
 * CapacitorHttp normally serializes a plain object itself, but when it gets
 * that wrong the API rejects the payload, so the caller can retry pre-encoded.
 */
async function post(body, asText) {
  const key = aiKey.get()
  // The key travels as a query parameter as well as a header. Either alone is
  // enough for Google, and a native HTTP layer that drops custom headers would
  // otherwise look exactly like a rejected key.
  const url = `${ENDPOINT}?key=${encodeURIComponent(key)}`
  const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': key }

  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({
      url,
      method: 'POST',
      headers,
      data: asText ? JSON.stringify(body) : body,
    })
    const data = typeof res.data === 'string' ? safeParse(res.data) : res.data
    return { status: res.status, data }
  }

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

function safeParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

/** True when a 400 is about the request body rather than the key. */
function isPayloadError(status, data) {
  return status === 400 && /invalid json payload|root element|cannot bind/i.test(data?.error?.message || '')
}

async function request(body) {
  let { status, data } = await post(body, false)

  // A mis-serialized body and a bad key both come back as 400, so retry the
  // one case we can fix ourselves before blaming the key.
  if (Capacitor.isNativePlatform() && isPayloadError(status, data)) {
    ({ status, data } = await post(body, true))
  }

  return { status, data }
}

async function generate(parts, tools) {
  const body = {
    contents: [{ parts }],
    ...(tools ? { tools } : {}),
  }

  if (import.meta.env.DEV && window.__aiMock) {
    return window.__aiMock(body)
  }

  const { status, data } = await request(body)
  const message = data?.error?.message || ''

  if (status === 429) throw new Error('무료 한도에 걸렸어요. 1분쯤 뒤에 다시 시도해 주세요.')
  if (status === 503) throw new Error('지금 이용자가 몰려 있어요. 잠시 뒤에 다시 시도해 주세요.')
  if (status === 401 || status === 403 || /api key not valid|api_key_invalid/i.test(message)) {
    throw new Error(`API 키 문제예요. 설정에서 키를 다시 넣어 주세요. (${message || status})`)
  }
  if (status < 200 || status >= 300) {
    // Anything else - a malformed request, a retired model, a blocked region -
    // reports what Google actually said rather than guessing at the cause.
    throw new Error(`요청이 실패했어요 (${status}) ${message}`.trim())
  }

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('')
    .trim()
  if (!text) throw new Error('빈 답변이 왔어요. 다시 시도해 주세요.')
  return text
}

/**
 * One tiny round trip so the settings screen can prove the key works, and say
 * exactly what went wrong when it doesn't.
 */
export async function testAiConnection() {
  try {
    const { status, data } = await request({ contents: [{ parts: [{ text: '안녕' }] }] })
    if (status >= 200 && status < 300) return { ok: true, text: '연결 성공 - 자동 요약을 쓸 수 있어요.' }
    return { ok: false, text: `실패 (${status}) ${data?.error?.message || ''}`.trim() }
  } catch (err) {
    return { ok: false, text: `연결 안 됨 - ${err.message}` }
  }
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

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

const YOUTUBE_ID = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/)|youtu\.be\/)([\w-]{11})/

/**
 * The canonical watch URL for a YouTube link, or null if it isn't one.
 *
 * The share sheet hands over "youtu.be/ID?si=..." and the API rejects the
 * whole request as an invalid argument when the URI carries those extra
 * parameters, so only the video id survives the trip.
 */
function youtubeUri(url) {
  const match = url.match(YOUTUBE_ID)
  return match ? `https://www.youtube.com/watch?v=${match[1]}` : null
}

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

// Reading a video means the model actually watches it, which takes far longer
// than summarizing text. Both are capped so a request can never hang forever.
const VIDEO_TIMEOUT = 180000
const TEXT_TIMEOUT = 60000

/** True when this source makes the model watch a video, so it will be slow. */
export function isVideoSource(url) {
  return Boolean(youtubeUri(url || ''))
}

/**
 * Sends one request. `asText` controls how the body reaches the native layer:
 * CapacitorHttp normally serializes a plain object itself, but when it gets
 * that wrong the API rejects the payload, so the caller can retry pre-encoded.
 */
async function post(body, asText, timeoutMs) {
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
      connectTimeout: timeoutMs,
      readTimeout: timeoutMs,
    })
    const data = typeof res.data === 'string' ? safeParse(res.data) : res.data
    return { status: res.status, data }
  }

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: abort.signal,
    })
    return { status: res.status, data: await res.json().catch(() => ({})) }
  } finally {
    clearTimeout(timer)
  }
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

async function request(body, timeoutMs = TEXT_TIMEOUT) {
  let result
  try {
    result = await post(body, false, timeoutMs)
  } catch (err) {
    if (err.name === 'AbortError' || /timeout|timed out/i.test(err.message || '')) {
      throw new Error('시간이 너무 오래 걸려서 멈췄어요. 다시 시도해 주세요.')
    }
    throw err
  }

  // A mis-serialized body and a bad key both come back as 400, so retry the
  // one case we can fix ourselves before blaming the key.
  if (Capacitor.isNativePlatform() && isPayloadError(result.status, result.data)) {
    result = await post(body, true, timeoutMs)
  }

  return result
}

async function generate(parts, tools, timeoutMs) {
  const body = {
    contents: [{ parts }],
    ...(tools ? { tools } : {}),
  }

  if (import.meta.env.DEV && window.__aiMock) {
    return window.__aiMock(body)
  }

  const { status, data } = await request(body, timeoutMs)
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
  const video = youtubeUri(url)
  if (video) {
    // Gemini reads public YouTube videos directly from the URL.
    return {
      parts: [{ file_data: { file_uri: video } }, { text: promptText }],
      tools: undefined,
      timeout: VIDEO_TIMEOUT,
    }
  }
  if (url) {
    // For articles, let the model fetch the page itself.
    return { parts: [{ text: promptText }], tools: [{ url_context: {} }], timeout: TEXT_TIMEOUT }
  }
  return { parts: [{ text: promptText }], tools: undefined, timeout: TEXT_TIMEOUT }
}

/** The whole reprocessing step, automatically: returns the summary markdown. */
export function summarizeItem(item) {
  const prompt = buildSummaryPrompt({
    title: item.title,
    sourceType: item.source_type,
    sourceUrl: item.source_url,
    rawContent: item.raw_content,
  })
  const { parts, tools, timeout } = partsFor(item, prompt)
  return generate(parts, tools, timeout)
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

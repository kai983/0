import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { buildCardsPrompt, buildSummaryPrompt } from './promptTemplate'

const KEY_STORAGE = 'knowledge-archive:gemini-key:v1'
const MODEL_STORAGE = 'knowledge-archive:gemini-model:v1'

// Free models go down one at a time - measured, not assumed: while
// gemini-flash-latest answered every request with "high demand", the other two
// answered normally in the same minute. So the app carries a list and moves to
// the next one rather than reporting a busy model as a dead end. The alias
// leads because it follows Google's current flash model.
const MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest']

const endpointFor = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

/** The model that last answered, tried first so a working one stays working. */
function preferredModel() {
  try {
    const saved = localStorage.getItem(MODEL_STORAGE)
    return MODELS.includes(saved) ? saved : ''
  } catch {
    return ''
  }
}

function rememberModel(model) {
  try {
    if (model === MODELS[0]) localStorage.removeItem(MODEL_STORAGE)
    else localStorage.setItem(MODEL_STORAGE, model)
  } catch {
    // Best effort - without storage every request just starts from the top.
  }
}

/** Every model, starting with the one that worked last time. */
function modelOrder() {
  const first = preferredModel()
  return first ? [first, ...MODELS.filter((m) => m !== first)] : [...MODELS]
}

/** Google is out of capacity for this model, or retired it - try another. */
function modelUnavailable(status, data) {
  if (status === 503) return true
  return status === 404 && /model/i.test(data?.error?.message || '')
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms))

/** An error the UI can tell apart: waiting on Google is not a broken app. */
export class AiError extends Error {
  constructor(message, kind = 'error') {
    super(message)
    this.name = 'AiError'
    this.kind = kind
  }
}

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
async function post(model, body, asText, timeoutMs) {
  const key = aiKey.get()
  // The key travels as a query parameter as well as a header. Either alone is
  // enough for Google, and a native HTTP layer that drops custom headers would
  // otherwise look exactly like a rejected key.
  const url = `${endpointFor(model)}?key=${encodeURIComponent(key)}`
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

/** One request to one model, with the payload retry native builds need. */
async function requestModel(model, body, timeoutMs) {
  let result
  try {
    result = await post(model, body, false, timeoutMs)
  } catch (err) {
    if (err.name === 'AbortError' || /timeout|timed out/i.test(err.message || '')) {
      throw new AiError('시간이 너무 오래 걸려서 멈췄어요. 다시 시도해 주세요.')
    }
    throw err
  }

  // A mis-serialized body and a bad key both come back as 400, so retry the
  // one case we can fix ourselves before blaming the key.
  if (Capacitor.isNativePlatform() && isPayloadError(result.status, result.data)) {
    result = await post(model, body, true, timeoutMs)
  }

  return result
}

/**
 * Walks the model list until one answers. A busy or retired model is skipped
 * immediately; only when every model is busy does it wait and go round once
 * more, because that is the one case where waiting can actually help.
 */
async function request(body, timeoutMs = TEXT_TIMEOUT) {
  let last
  for (let pass = 0; pass < 2; pass++) {
    if (pass > 0) await wait(2000)
    for (const model of modelOrder()) {
      const result = await requestModel(model, body, timeoutMs)
      last = result
      if (!modelUnavailable(result.status, result.data)) {
        if (result.status >= 200 && result.status < 300) rememberModel(model)
        return result
      }
    }
  }
  return last
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

  if (status === 429) {
    throw new AiError('무료 한도에 걸렸어요. 1분쯤 뒤에 다시 시도해 주세요.', 'busy')
  }
  if (status === 503) {
    // Every model was busy, twice over - nothing here is broken, so this reads
    // as a wait rather than a failure.
    throw new AiError('구글 무료 모델이 지금 전부 혼잡해요. 잠시 뒤 다시 눌러 주세요.', 'busy')
  }
  if (status === 401 || status === 403 || /api key not valid|api_key_invalid/i.test(message)) {
    throw new AiError(`API 키 문제예요. 설정에서 키를 다시 넣어 주세요. (${message || status})`)
  }
  if (status < 200 || status >= 300) {
    // Anything else - a malformed request, a retired model, a blocked region -
    // reports what Google actually said rather than guessing at the cause.
    throw new AiError(`요청이 실패했어요 (${status}) ${message}`.trim())
  }

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('')
    .trim()
  if (!text) throw new AiError('빈 답변이 왔어요. 다시 시도해 주세요.')
  return text
}

/**
 * One tiny round trip so the settings screen can prove the key works, and say
 * exactly what went wrong when it doesn't.
 */
export async function testAiConnection() {
  try {
    // request() already walks every model twice, so anything still busy here
    // means Google has no free capacity at all right now.
    const { status, data } = await request({ contents: [{ parts: [{ text: '안녕' }] }] })

    if (status >= 200 && status < 300) {
      const model = preferredModel() || MODELS[0]
      return { state: 'ok', text: `연결 성공 - 자동 요약을 쓸 수 있어요. (${model})` }
    }
    if (status === 503) {
      return {
        state: 'busy',
        text: '구글 무료 모델이 지금 전부 혼잡해요. 키와 연결은 정상이니 잠시 뒤 다시 해보세요.',
      }
    }
    if (status === 429) {
      return { state: 'busy', text: '오늘 무료 한도를 다 썼어요. 내일 다시 쓸 수 있어요.' }
    }
    return { state: 'bad', text: `실패 (${status}) ${data?.error?.message || ''}`.trim() }
  } catch (err) {
    return { state: 'bad', text: `연결 안 됨 - ${err.message}` }
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

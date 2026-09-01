import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { ITEMS_KEY } from './store'
import { CARDS_KEY, CARDS_CHANGED } from './cards'
import { THEME_KEY } from './theme'

const LAST_BACKUP_KEY = 'knowledge-archive:last-backup:v1'
const FORMAT = 'knowledge-archive-backup'
const FORMAT_VERSION = 1

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readList(key) {
  const value = read(key)
  return Array.isArray(value) ? value : []
}

/**
 * Everything the app knows, in one object.
 *
 * The API key is deliberately left out: a backup file travels through a
 * messenger or a cloud drive, and a key does not belong in either.
 */
export function buildBackup() {
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    app: __APP_VERSION__,
    items: readList(ITEMS_KEY),
    cards: readList(CARDS_KEY),
    theme: localStorage.getItem(THEME_KEY) || null,
  }
}

/**
 * ASCII on purpose. A Korean name reads better, but it travels through
 * download managers, messengers and file pickers that mangle or drop it -
 * Chromium discards the name entirely and saves it as "download".
 */
export function backupFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10)
  return `knowledge-archive-backup-${stamp}.json`
}

/** ISO date of the last successful export, or null. */
export function lastBackupAt() {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

function markBackupDone() {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
  } catch {
    // Best effort; the backup itself still succeeded.
  }
}

/**
 * Hands the backup file to the system share sheet, so it can land in a drive,
 * a chat or an email - wherever the user already keeps things.
 */
export async function exportBackup() {
  const data = buildBackup()
  if (!data.items.length && !data.cards.length) {
    return { ok: false, text: '아직 저장된 지식이 없어요.' }
  }

  const json = JSON.stringify(data, null, 2)
  const name = backupFilename()

  try {
    if (Capacitor.isNativePlatform()) {
      const written = await Filesystem.writeFile({
        path: name,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      })
      await Share.share({
        title: name,
        // Some targets read the file, others only the text, so send both.
        files: [written.uri],
        dialogTitle: '백업 파일 저장하기',
      })
    } else {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = name
      // Chromium only honours the download name for a link in the document.
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }
  } catch (err) {
    // Cancelling the share sheet lands here too, which is not a failure.
    if (/cancel/i.test(err?.message || '')) return { ok: false, text: '' }
    return { ok: false, text: `내보내지 못했어요 - ${err.message}` }
  }

  markBackupDone()
  return {
    ok: true,
    text: `지식 ${data.items.length}개와 학습 카드 ${data.cards.length}장을 내보냈어요.`,
  }
}

/** Reads and validates a backup file the user picked. */
export function parseBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('백업 파일이 아니에요. 내보내기로 만든 .json 파일을 골라 주세요.')
  }
  if (data?.format !== FORMAT || !Array.isArray(data.items)) {
    throw new Error('이 앱에서 만든 백업 파일이 아니에요.')
  }
  if (data.version > FORMAT_VERSION) {
    throw new Error('더 새로운 버전에서 만든 백업이에요. 앱을 업데이트해 주세요.')
  }
  return data
}

function mergeById(existing, incoming) {
  const known = new Set(existing.map((row) => row.id))
  const added = incoming.filter((row) => row && row.id && !known.has(row.id))
  return { merged: [...existing, ...added], added: added.length }
}

/**
 * Adds what the file has and the device doesn't, matching on id, so importing
 * the same file twice changes nothing the second time.
 */
export function importBackup(data) {
  const currentItems = readList(ITEMS_KEY)
  const currentCards = readList(CARDS_KEY)
  const wasEmpty = currentItems.length === 0

  const items = mergeById(currentItems, data.items)
  const cards = mergeById(currentCards, Array.isArray(data.cards) ? data.cards : [])

  localStorage.setItem(ITEMS_KEY, JSON.stringify(items.merged))
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards.merged))
  window.dispatchEvent(new Event(CARDS_CHANGED))

  // Restoring onto a fresh install brings the look back too; on a device that
  // already has knowledge in it, changing the theme would just be startling.
  if (wasEmpty && data.theme) {
    localStorage.setItem(THEME_KEY, data.theme)
  }

  return {
    items: items.added,
    cards: cards.added,
    skipped: data.items.length - items.added,
    themeRestored: Boolean(wasEmpty && data.theme),
  }
}

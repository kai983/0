const STORAGE_KEY = 'knowledge-archive:cards:v1';

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const DEFAULT_EASE = 2.5;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Anything watching a card count (the nav badge) refreshes on this. */
export const CARDS_CHANGED = 'cards:changed';

function writeAll(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  window.dispatchEvent(new Event(CARDS_CHANGED));
}

function genId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** Start of the day `days` from now, so a card due "tomorrow" arrives at 00:00. */
function inDays(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Parses the question and answer pairs the review prompt asks Claude for.
 * Tolerates "Q:" / "질문:" and "A:" / "답:" and lets an answer run over
 * several lines.
 */
export function parseCards(text) {
  const cards = [];
  let current = null;
  let field = null;

  for (const rawLine of (text || '').split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const q = line.match(/^(?:Q|질문)\s*[:.]\s*(.*)$/i);
    if (q) {
      if (current?.front && current?.back) cards.push(current);
      current = { front: q[1].trim(), back: '' };
      field = 'front';
      continue;
    }

    const a = line.match(/^(?:A|답변?)\s*[:.]\s*(.*)$/i);
    if (a && current) {
      current.back = a[1].trim();
      field = 'back';
      continue;
    }

    // continuation of whatever we are in the middle of
    if (current && field) {
      current[field] = `${current[field]} ${line}`.trim();
    }
  }
  if (current?.front && current?.back) cards.push(current);

  return cards.filter((c) => c.front && c.back);
}

/**
 * SM-2 style scheduling, trimmed to the four buttons the review screen shows.
 * "again" keeps the card in the current session; the rest push it out in days.
 */
export function schedule(card, grade) {
  let { ease = DEFAULT_EASE, interval = 0, reps = 0, lapses = 0 } = card;

  if (grade === 'again') {
    ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
    return {
      ease,
      interval: 0,
      reps: 0,
      lapses: lapses + 1,
      due: new Date().toISOString(),
    };
  }

  if (grade === 'hard') {
    ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
    interval = reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
  } else if (grade === 'easy') {
    ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
    interval = reps === 0 ? 2 : Math.max(2, Math.round(interval * ease * 1.3));
  } else {
    // good
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else interval = Math.max(1, Math.round(interval * ease));
  }

  return { ease, interval, reps: reps + 1, lapses, due: inDays(interval) };
}

export const cards = {
  all() {
    return Promise.resolve(readAll());
  },

  forItem(itemId) {
    return Promise.resolve(readAll().filter((c) => c.item_id === itemId));
  },

  /** Cards ready to review, oldest due first. */
  due() {
    const now = new Date().toISOString();
    const list = readAll()
      .filter((c) => c.due <= now)
      .sort((a, b) => a.due.localeCompare(b.due));
    return Promise.resolve(list);
  },

  /** When the next card comes back, for the empty state. */
  nextDue() {
    const upcoming = readAll()
      .map((c) => c.due)
      .sort();
    return Promise.resolve(upcoming[0] || null);
  },

  addMany(itemId, pairs) {
    const now = new Date().toISOString();
    const list = readAll();
    const created = pairs.map((p) => ({
      id: genId(),
      item_id: itemId,
      front: p.front,
      back: p.back,
      ease: DEFAULT_EASE,
      interval: 0,
      reps: 0,
      lapses: 0,
      due: now,
      created_at: now,
      updated_at: now,
    }));
    writeAll([...list, ...created]);
    return Promise.resolve(created);
  },

  grade(id, grade) {
    const list = readAll();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.reject(new Error('찾을 수 없습니다'));
    list[idx] = {
      ...list[idx],
      ...schedule(list[idx], grade),
      updated_at: new Date().toISOString(),
    };
    writeAll(list);
    return Promise.resolve(list[idx]);
  },

  remove(id) {
    writeAll(readAll().filter((c) => c.id !== id));
    return Promise.resolve(null);
  },

  removeForItem(itemId) {
    writeAll(readAll().filter((c) => c.item_id !== itemId));
    return Promise.resolve(null);
  },
};

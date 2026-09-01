import { buildSummaryPrompt } from './promptTemplate';

export const ITEMS_KEY = 'knowledge-archive:items:v1';
const STORAGE_KEY = ITEMS_KEY;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function genId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  return [];
}

/**
 * One line to show under a title in the list: the AI summary's headline if the
 * item has been reprocessed, otherwise the start of the original note.
 */
export function excerptOf(item) {
  const summary = (item.summary || '').trim();
  if (summary) {
    const lines = summary
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    if (lines.length) return lines[0].replace(/^[-*•]\s*/, '');
  }
  return (item.raw_content || '').trim().split('\n').filter(Boolean)[0] || '';
}

export const store = {
  list({ q, tag } = {}) {
    let items = readAll().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    if (q) {
      const needle = q.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          (r.raw_content || '').toLowerCase().includes(needle) ||
          (r.summary || '').toLowerCase().includes(needle)
      );
    }
    if (tag) {
      items = items.filter((r) => r.tags.includes(tag));
    }
    return Promise.resolve(items);
  },

  tags() {
    const set = new Set();
    readAll().forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Promise.resolve([...set].sort());
  },

  get(id) {
    const item = readAll().find((r) => r.id === id);
    if (!item) return Promise.reject(new Error('찾을 수 없습니다'));
    return Promise.resolve(item);
  },

  create({ title, sourceType, sourceUrl, rawContent, tags }) {
    if (!title || !title.trim()) return Promise.reject(new Error('제목을 입력해주세요'));
    const now = new Date().toISOString();
    const item = {
      id: genId(),
      title: title.trim(),
      source_type: sourceType || 'text',
      source_url: sourceUrl || '',
      raw_content: rawContent || '',
      summary: '',
      tags: normalizeTags(tags),
      created_at: now,
      updated_at: now,
    };
    const items = readAll();
    items.push(item);
    writeAll(items);
    return Promise.resolve(item);
  },

  update(id, patch) {
    const items = readAll();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return Promise.reject(new Error('찾을 수 없습니다'));
    const existing = items[idx];
    const updated = {
      ...existing,
      ...('title' in patch ? { title: patch.title.trim() } : {}),
      ...('sourceType' in patch ? { source_type: patch.sourceType } : {}),
      ...('sourceUrl' in patch ? { source_url: patch.sourceUrl } : {}),
      ...('rawContent' in patch ? { raw_content: patch.rawContent } : {}),
      ...('summary' in patch ? { summary: patch.summary } : {}),
      ...('tags' in patch ? { tags: normalizeTags(patch.tags) } : {}),
      updated_at: new Date().toISOString(),
    };
    items[idx] = updated;
    writeAll(items);
    return Promise.resolve(updated);
  },

  remove(id) {
    const items = readAll().filter((r) => r.id !== id);
    writeAll(items);
    return Promise.resolve(null);
  },

  getPrompt(id) {
    const item = readAll().find((r) => r.id === id);
    if (!item) return Promise.reject(new Error('찾을 수 없습니다'));
    const prompt = buildSummaryPrompt({
      title: item.title,
      sourceType: item.source_type,
      sourceUrl: item.source_url,
      rawContent: item.raw_content,
    });
    return Promise.resolve({ prompt });
  },
};

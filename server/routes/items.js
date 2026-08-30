const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { buildSummaryPrompt } = require('../promptTemplate');

const router = express.Router();

function serialize(row) {
  return {
    ...row,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
  };
}

// GET /api/items?q=&tag=
router.get('/', (req, res) => {
  const { q, tag } = req.query;
  let rows = db.prepare('SELECT * FROM items ORDER BY updated_at DESC').all();

  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.raw_content || '').toLowerCase().includes(needle) ||
        (r.summary || '').toLowerCase().includes(needle)
    );
  }
  if (tag) {
    rows = rows.filter((r) => r.tags.split(',').includes(tag));
  }

  res.json(rows.map(serialize));
});

// GET /api/items/tags -> distinct tag list
router.get('/tags', (req, res) => {
  const rows = db.prepare('SELECT tags FROM items').all();
  const set = new Set();
  rows.forEach((r) => r.tags.split(',').forEach((t) => t && set.add(t)));
  res.json([...set].sort());
});

// GET /api/items/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(serialize(row));
});

// POST /api/items
router.post('/', (req, res) => {
  const { title, sourceType, sourceUrl, rawContent, tags } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  const now = new Date().toISOString();
  const id = nanoid();
  const tagsStr = Array.isArray(tags) ? tags.filter(Boolean).join(',') : '';

  db.prepare(
    `INSERT INTO items (id, title, source_type, source_url, raw_content, summary, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title.trim(), sourceType || 'text', sourceUrl || null, rawContent || '', '', tagsStr, now, now);

  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  res.status(201).json(serialize(row));
});

// PUT /api/items/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const { title, sourceType, sourceUrl, rawContent, summary, tags } = req.body;
  const tagsStr = Array.isArray(tags) ? tags.filter(Boolean).join(',') : existing.tags;

  db.prepare(
    `UPDATE items SET title = ?, source_type = ?, source_url = ?, raw_content = ?, summary = ?, tags = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    title !== undefined ? title.trim() : existing.title,
    sourceType !== undefined ? sourceType : existing.source_type,
    sourceUrl !== undefined ? sourceUrl : existing.source_url,
    rawContent !== undefined ? rawContent : existing.raw_content,
    summary !== undefined ? summary : existing.summary,
    tagsStr,
    new Date().toISOString(),
    req.params.id
  );

  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  res.json(serialize(row));
});

// DELETE /api/items/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

// GET /api/items/:id/prompt -> generated AI prompt text
router.get('/:id/prompt', (req, res) => {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });

  const prompt = buildSummaryPrompt({
    title: row.title,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    rawContent: row.raw_content,
  });

  res.json({ prompt });
});

module.exports = router;

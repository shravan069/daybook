const express = require('express');
const db = require('../database');
const requireLogin = require('../middleware');

const router = express.Router();

// GET /diary — get all diary entries for logged in user
router.get('/', requireLogin, (req, res) => {
  const entries = db.prepare(`
    SELECT * FROM diary_entries
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.userId);

  res.json(entries);
});

// POST /diary — create a new diary entry
router.post('/', requireLogin, (req, res) => {
  const { title, content, mood } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const result = db.prepare(`
    INSERT INTO diary_entries (user_id, title, content, mood)
    VALUES (?, ?, ?, ?)
  `).run(req.user.userId, title, content, mood || 'okay');

  res.json({
    id: result.lastInsertRowid,
    title,
    content,
    mood: mood || 'okay',
    created_at: new Date().toISOString()
  });
});

// DELETE /diary/:id — delete a diary entry
router.delete('/:id', requireLogin, (req, res) => {
  // Make sure user can only delete their OWN entries
  const entry = db.prepare(
    'SELECT * FROM diary_entries WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.userId);

  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  db.prepare(
    'DELETE FROM diary_entries WHERE id = ?'
  ).run(req.params.id);

  res.json({ message: 'Entry deleted' });
});

module.exports = router;
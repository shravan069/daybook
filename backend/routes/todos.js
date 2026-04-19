const express = require('express');
const db = require('../database');
const requireLogin = require('../middleware');

const router = express.Router();

// GET /todos — get all todos for logged in user
router.get('/', requireLogin, (req, res) => {
  const todos = db.prepare(`
    SELECT * FROM todos
    WHERE user_id = ?
    ORDER BY
      CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        ELSE 3
      END,
      created_at DESC
  `).all(req.user.userId);

  res.json(todos);
});

// POST /todos — create a new todo
router.post('/', requireLogin, (req, res) => {
  const { task, priority } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  const result = db.prepare(`
    INSERT INTO todos (user_id, task, priority)
    VALUES (?, ?, ?)
  `).run(req.user.userId, task, priority || 'medium');

  res.json({
    id: result.lastInsertRowid,
    task,
    priority: priority || 'medium',
    completed: 0,
    created_at: new Date().toISOString()
  });
});

// PUT /todos/:id/complete — toggle complete/incomplete
router.put('/:id/complete', requireLogin, (req, res) => {
  const todo = db.prepare(
    'SELECT * FROM todos WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.userId);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // Toggle — if done make undone, if undone make done
  const newState = todo.completed === 0 ? 1 : 0;

  db.prepare(
    'UPDATE todos SET completed = ? WHERE id = ?'
  ).run(newState, req.params.id);

  res.json({ completed: newState });
});

// DELETE /todos/:id — delete a todo
router.delete('/:id', requireLogin, (req, res) => {
  const todo = db.prepare(
    'SELECT * FROM todos WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.userId);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  db.prepare(
    'DELETE FROM todos WHERE id = ?'
  ).run(req.params.id);

  res.json({ message: 'Todo deleted' });
});

module.exports = router;
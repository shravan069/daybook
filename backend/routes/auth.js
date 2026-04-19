const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
require('dotenv').config();

const router = express.Router();

// POST /auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if email already exists
  const existing = db.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).get(email);

  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Hash the password — never store plain text!
  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  ).run(name, email, password_hash);

  res.json({ message: 'Account created! Please log in.' });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const user = db.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).get(email);

  if (!user) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  // Issue token — expires in 7 days
  const token = jwt.sign(
    { userId: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, name: user.name });
});

module.exports = router;
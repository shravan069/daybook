const jwt = require('jsonwebtoken');
require('dotenv').config();

function requireLogin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired — please log in again' });
  }
}

module.exports = requireLogin;
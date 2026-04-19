require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./backend/routes/auth');
const diaryRoutes = require('./backend/routes/diary');
const todoRoutes = require('./backend/routes/todos');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('frontend')); // will serve your HTML later

// Routes — completely separate!
app.use('/auth', authRoutes);
app.use('/diary', diaryRoutes);
app.use('/todos', todoRoutes);

// Health check — just to confirm server is running
app.get('/health', (req, res) => {
  res.json({ status: 'DayBook is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DayBook running at http://localhost:${PORT}`);
});
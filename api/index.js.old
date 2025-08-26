const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Password check middleware
const PASSWORD_HASH = bcrypt.hashSync(process.env.PASSWORD || 'financeflow123', 10);

const checkPassword = (req, res, next) => {
  const { password } = req.body;
  if (!password || !bcrypt.compareSync(password, PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  next();
};

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(10) CHECK (type IN ('income', 'expense')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initDB();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/verify', checkPassword, (req, res) => {
  res.json({ success: true });
});

app.get('/api/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { date, description, category, amount, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO transactions (date, description, category, amount, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [date, description, category, amount, type]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = app;
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initDB();

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
      res.json({ 
        data: result.rows,
        total: result.rows.length,
        page: 1,
        limit: 100,
        totalPages: 1
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  } else if (req.method === 'POST') {
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
  } else if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    try {
      await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
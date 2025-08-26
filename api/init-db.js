import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Create transactions table if it doesn't exist
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

    res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize database',
      details: error.message 
    });
  }
}

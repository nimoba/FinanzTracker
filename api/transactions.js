import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Password check middleware
const PASSWORD_HASH = bcrypt.hashSync(process.env.PASSWORD || 'financeflow123', 10);

function checkPassword(password) {
  if (!password || !bcrypt.compareSync(password, PASSWORD_HASH)) {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all transactions
      const result = await pool.query(
        'SELECT * FROM transactions ORDER BY date DESC, created_at DESC'
      );
      res.status(200).json(result.rows);
      
    } else if (req.method === 'POST') {
      const { date, description, category, amount, type, password } = req.body;
      
      // Check password for POST requests
      if (!checkPassword(password)) {
        return res.status(401).json({ error: 'Invalid password' });
      }
      
      // Insert new transaction
      const result = await pool.query(
        'INSERT INTO transactions (date, description, category, amount, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [date, description, category, amount, type]
      );
      
      res.status(201).json(result.rows[0]);
      
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database operation failed',
      details: error.message 
    });
  }
}

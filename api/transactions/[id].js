import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Password check
const PASSWORD_HASH = bcrypt.hashSync(process.env.PASSWORD || 'financeflow123', 10);

function checkPassword(password) {
  if (!password || !bcrypt.compareSync(password, PASSWORD_HASH)) {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;
    const { password } = req.body;

    // Check password
    if (!checkPassword(password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete transaction
    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete transaction',
      details: error.message 
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting pending transactions migration...');

    // Add new columns to transaktionen table
    console.log('Adding status column...');
    await sql`
      ALTER TABLE transaktionen 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'confirmed'
    `;

    console.log('Adding original_amount column...');
    await sql`
      ALTER TABLE transaktionen 
      ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2)
    `;

    console.log('Adding pending_amount column...');
    await sql`
      ALTER TABLE transaktionen 
      ADD COLUMN IF NOT EXISTS pending_amount DECIMAL(10,2)
    `;

    console.log('Adding cancelled_amount column...');
    await sql`
      ALTER TABLE transaktionen 
      ADD COLUMN IF NOT EXISTS cancelled_amount DECIMAL(10,2) DEFAULT 0
    `;

    console.log('Adding auto_confirm_date column...');
    await sql`
      ALTER TABLE transaktionen 
      ADD COLUMN IF NOT EXISTS auto_confirm_date DATE
    `;

    console.log('Adding parent_transaction_id column...');
    await sql`
      ALTER TABLE transaktionen 
      ADD COLUMN IF NOT EXISTS parent_transaction_id INTEGER REFERENCES transaktionen(id)
    `;

    // Create transaction_status_history table
    console.log('Creating transaction_status_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS transaction_status_history (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transaktionen(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2),
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Update existing transactions to set original_amount = betrag where null
    console.log('Updating existing transactions...');
    await sql`
      UPDATE transaktionen 
      SET original_amount = betrag 
      WHERE original_amount IS NULL
    `;

    console.log('✅ Pending transactions migration completed successfully');

    res.status(200).json({ 
      success: true, 
      message: 'Pending transactions migration completed successfully' 
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
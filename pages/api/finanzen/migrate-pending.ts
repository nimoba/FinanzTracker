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
    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'confirmed'
      `;
    } catch (error) {
      console.log('Status column may already exist');
    }

    console.log('Adding original_amount column...');
    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2)
      `;
    } catch (error) {
      console.log('Original_amount column may already exist');
    }

    console.log('Adding pending_amount column...');
    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD COLUMN IF NOT EXISTS pending_amount DECIMAL(10,2)
      `;
    } catch (error) {
      console.log('Pending_amount column may already exist');
    }

    console.log('Adding cancelled_amount column...');
    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD COLUMN IF NOT EXISTS cancelled_amount DECIMAL(10,2) DEFAULT 0
      `;
    } catch (error) {
      console.log('Cancelled_amount column may already exist');
    }

    console.log('Adding auto_confirm_date column...');
    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD COLUMN IF NOT EXISTS auto_confirm_date DATE
      `;
    } catch (error) {
      console.log('Auto_confirm_date column may already exist');
    }

    console.log('Adding parent_transaction_id column...');
    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD COLUMN IF NOT EXISTS parent_transaction_id INTEGER REFERENCES transaktionen(id)
      `;
    } catch (error) {
      console.log('Parent_transaction_id column may already exist');
    }

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

    // Set pending_amount for pending transactions
    await sql`
      UPDATE transaktionen 
      SET pending_amount = betrag 
      WHERE status = 'pending' AND pending_amount IS NULL
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
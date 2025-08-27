import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting transfer functionality migration...');

    // Add transfer_id column to transaktionen table if it doesn't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'transaktionen' AND column_name = 'transfer_id'
        ) THEN
          ALTER TABLE transaktionen ADD COLUMN transfer_id INTEGER REFERENCES transaktionen(id) ON DELETE CASCADE;
          CREATE INDEX IF NOT EXISTS idx_transaktionen_transfer_id ON transaktionen(transfer_id);
        END IF;
      END $$;
    `;

    console.log('✅ Transfer functionality added to database');

    res.status(200).json({ 
      success: true, 
      message: 'Transfer functionality migration completed successfully!'
    });

  } catch (error) {
    console.error('Transfer migration error:', error);
    res.status(500).json({ 
      error: 'Transfer migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
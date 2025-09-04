import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all unique symbols
    const { rows: holdings } = await sql`
      SELECT DISTINCT symbol FROM holdings
    `;

    let updated = 0;
    for (const holding of holdings) {
      try {
        // Call price API for each symbol
        const response = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${holding.symbol}/price`
        );
        
        if (response.ok) {
          updated++;
        }
      } catch (error) {
        console.error(`Error updating ${holding.symbol}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated prices for ${updated} symbols`,
      updated
    });

  } catch (error) {
    console.error('Sync prices error:', error);
    res.status(500).json({ 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
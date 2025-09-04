import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

// Simple mock price generator - replace with real API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  try {
    // This is a mock - replace with Yahoo Finance or Alpha Vantage API
    // For production, use: yahoo-finance2 or axios to call Alpha Vantage
    const mockPrice = Math.random() * 200 + 50;

    // Store in price history
    await sql`
      INSERT INTO price_history (symbol, date, close_price)
      VALUES (${symbol as string}, CURRENT_DATE, ${mockPrice})
      ON CONFLICT (symbol, date) 
      DO UPDATE SET close_price = ${mockPrice}
    `;

    // Update holdings
    await sql`
      UPDATE holdings 
      SET current_price = ${mockPrice}, last_updated = NOW()
      WHERE symbol = ${symbol as string}
    `;

    res.status(200).json({
      symbol: symbol as string,
      price: mockPrice,
      currency: 'EUR',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Price API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting portfolio database migration...');

    // Create portfolios table
    console.log('Creating portfolios table...');
    await sql`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create holdings table
    console.log('Creating holdings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        name VARCHAR(100),
        total_quantity DECIMAL(15,4) DEFAULT 0,
        avg_purchase_price DECIMAL(10,2) DEFAULT 0,
        current_price DECIMAL(10,2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        currency VARCHAR(3) DEFAULT 'EUR',
        market VARCHAR(20) DEFAULT 'XETRA'
      )
    `;

    // Create stock_transactions table
    console.log('Creating stock_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id SERIAL PRIMARY KEY,
        holding_id INTEGER REFERENCES holdings(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell', 'dividend')),
        quantity DECIMAL(15,4) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        fees DECIMAL(10,2) DEFAULT 0,
        date DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create price_history table
    console.log('Creating price_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        open_price DECIMAL(10,2),
        close_price DECIMAL(10,2) NOT NULL,
        high_price DECIMAL(10,2),
        low_price DECIMAL(10,2),
        volume BIGINT,
        currency VARCHAR(3) DEFAULT 'EUR',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(symbol, date)
      )
    `;

    // Create indexes for better performance
    console.log('Creating indexes...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON holdings(portfolio_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_transactions_holding ON stock_transactions(holding_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date ON price_history(symbol, date DESC)`;
    } catch (indexError) {
      console.log('Some indexes may already exist');
    }

    // Insert default portfolio if none exists
    const { rows: existingPortfolios } = await sql`
      SELECT COUNT(*) as count FROM portfolios
    `;

    if (parseInt(existingPortfolios[0]?.count as string || '0') === 0) {
      console.log('Creating default portfolio...');
      await sql`
        INSERT INTO portfolios (name, description, user_id)
        VALUES ('Mein Hauptdepot', 'Standard Portfolio für alle Investitionen', 1)
      `;
    }

    console.log('✅ Portfolio database migration completed successfully');

    // Get some basic stats
    const { rows: stats } = await sql`
      SELECT 
        (SELECT COUNT(*) FROM portfolios) as portfolios_count,
        (SELECT COUNT(*) FROM holdings) as holdings_count,
        (SELECT COUNT(*) FROM stock_transactions) as transactions_count,
        (SELECT COUNT(*) FROM price_history) as price_history_count
    `;

    res.status(200).json({ 
      success: true, 
      message: 'Portfolio database migration completed successfully',
      stats: stats[0]
    });

  } catch (error) {
    console.error('❌ Portfolio migration error:', error);
    res.status(500).json({ 
      error: 'Portfolio migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
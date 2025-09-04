// pages/api/portfolio/setup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting portfolio database migration...');

    // Erweitere bestehende holdings table um fehlende Spalten
    console.log('Adding missing columns to holdings table...');
    
    // Prüfe und füge WKN Spalte hinzu
    try {
      await sql`ALTER TABLE holdings ADD COLUMN wkn VARCHAR(20)`;
      console.log('Added WKN column');
    } catch (error) {
      console.log('WKN column already exists or error:', error);
    }

    // Prüfe und füge ISIN Spalte hinzu  
    try {
      await sql`ALTER TABLE holdings ADD COLUMN isin VARCHAR(20)`;
      console.log('Added ISIN column');
    } catch (error) {
      console.log('ISIN column already exists or error:', error);
    }

    // Prüfe und füge typ Spalte hinzu
    try {
      await sql`ALTER TABLE holdings ADD COLUMN typ VARCHAR(20) DEFAULT 'stock'`;
      console.log('Added typ column');
    } catch (error) {
      console.log('typ column already exists or error:', error);
    }

    // Portfolio Transaktionen (Käufe/Verkäufe)
    console.log('Creating portfolio_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS portfolio_transactions (
        id SERIAL PRIMARY KEY,
        holding_id INTEGER NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
        typ VARCHAR(10) NOT NULL CHECK (typ IN ('kauf', 'verkauf')),
        quantity DECIMAL(15,6) NOT NULL,
        price DECIMAL(15,6) NOT NULL,
        fees DECIMAL(10,2) DEFAULT 0,
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Cash Positionen im Portfolio
    console.log('Creating portfolio_cash table...');
    await sql`
      CREATE TABLE IF NOT EXISTS portfolio_cash (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(5) DEFAULT 'EUR',
        interest_rate DECIMAL(5,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Cache für Marktdaten
    console.log('Creating market_data table...');
    await sql`
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        wkn VARCHAR(20),
        date DATE NOT NULL,
        price DECIMAL(15,6) NOT NULL,
        currency VARCHAR(5) DEFAULT 'EUR',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(symbol, date)
      )
    `;

    // Historische Portfolio-Werte
    console.log('Creating portfolio_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS portfolio_history (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        total_value DECIMAL(15,2) NOT NULL,
        cash_value DECIMAL(15,2) DEFAULT 0,
        holdings_value DECIMAL(15,2) DEFAULT 0,
        daily_change DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(portfolio_id, date)
      )
    `;

    // Erweitere konten Tabelle um Portfolio-Flag falls nicht vorhanden
    try {
      await sql`ALTER TABLE konten ADD COLUMN ist_portfolio BOOLEAN DEFAULT FALSE`;
      console.log('Added ist_portfolio column to konten');
    } catch (error) {
      console.log('ist_portfolio column already exists or error:', error);
    }

    // Portfolio-Konto erstellen falls nicht vorhanden
    console.log('Creating/updating portfolio account...');
    await sql`
      INSERT INTO konten (name, typ, saldo, farbe, ist_portfolio)
      SELECT 'Portfolio', 'investment', 0, '#10B981', TRUE
      WHERE NOT EXISTS (SELECT 1 FROM konten WHERE ist_portfolio = TRUE)
    `;

    // Investment Kategorien hinzufügen falls nicht vorhanden
    console.log('Creating investment categories...');
    await sql`
      INSERT INTO kategorien (name, typ, icon, farbe)
      SELECT 'Investment', 'ausgabe', '📈', '#10B981'
      WHERE NOT EXISTS (SELECT 1 FROM kategorien WHERE name = 'Investment' AND typ = 'ausgabe')
    `;

    await sql`
      INSERT INTO kategorien (name, typ, icon, farbe)
      SELECT 'Investment', 'einnahme', '💰', '#10B981'
      WHERE NOT EXISTS (SELECT 1 FROM kategorien WHERE name = 'Investment' AND typ = 'einnahme')
    `;

    // Erstelle Indizes für bessere Performance
    console.log('Creating indexes...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_market_data_symbol_date ON market_data(symbol, date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_portfolio_history_portfolio_date ON portfolio_history(portfolio_id, date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_holding ON portfolio_transactions(holding_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_date ON portfolio_transactions(transaction_date)`;
      console.log('Indexes created');
    } catch (error) {
      console.log('Some indexes might already exist:', error);
    }

    // Erstelle Standard-Portfolio falls keins existiert
    console.log('Creating default portfolio...');
    await sql`
      INSERT INTO portfolios (name, description)
      SELECT 'Mein Portfolio', 'Haupt-Investment-Portfolio'
      WHERE NOT EXISTS (SELECT 1 FROM portfolios LIMIT 1)
    `;

    // Hole Statistiken
    const { rows: portfolioCount } = await sql`SELECT COUNT(*) as count FROM portfolios`;
    const { rows: holdingsCount } = await sql`SELECT COUNT(*) as count FROM holdings`;
    const { rows: transactionsCount } = await sql`SELECT COUNT(*) as count FROM portfolio_transactions`;

    console.log('Portfolio migration completed successfully');

    res.status(200).json({ 
      success: true, 
      message: 'Portfolio-System erfolgreich eingerichtet',
      statistics: {
        portfolios: parseInt(portfolioCount[0]?.count || '0'),
        holdings: parseInt(holdingsCount[0]?.count || '0'),
        transactions: parseInt(transactionsCount[0]?.count || '0')
      }
    });

  } catch (error) {
    console.error('Portfolio setup error:', error);
    res.status(500).json({ 
      error: 'Fehler beim Setup des Portfolio-Systems',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
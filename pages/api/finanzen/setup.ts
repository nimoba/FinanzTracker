import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS kategorien (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        typ VARCHAR(20) CHECK (typ IN ('einnahme', 'ausgabe')),
        farbe VARCHAR(7) DEFAULT '#36a2eb',
        icon VARCHAR(10) DEFAULT '💰'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS konten (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        typ VARCHAR(50) NOT NULL,
        saldo DECIMAL(10,2) DEFAULT 0,
        farbe VARCHAR(7) DEFAULT '#36a2eb',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transaktionen (
        id SERIAL PRIMARY KEY,
        konto_id INTEGER REFERENCES konten(id) ON DELETE CASCADE,
        betrag DECIMAL(10,2) NOT NULL,
        typ VARCHAR(20) CHECK (typ IN ('einnahme', 'ausgabe')),
        kategorie_id INTEGER REFERENCES kategorien(id),
        datum DATE NOT NULL,
        beschreibung TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        kategorie_id INTEGER REFERENCES kategorien(id) ON DELETE CASCADE,
        betrag DECIMAL(10,2) NOT NULL,
        monat DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(kategorie_id, monat)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sparziele (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        zielbetrag DECIMAL(10,2) NOT NULL,
        aktuell DECIMAL(10,2) DEFAULT 0,
        zieldatum DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add default categories
    const defaultCategories = [
      // Income categories
      { name: 'Gehalt', typ: 'einnahme', icon: '💼', farbe: '#22c55e' },
      { name: 'Freelancing', typ: 'einnahme', icon: '💻', farbe: '#10b981' },
      { name: 'Zinsen', typ: 'einnahme', icon: '🏦', farbe: '#059669' },
      { name: 'Geschenke', typ: 'einnahme', icon: '🎁', farbe: '#047857' },
      { name: 'Sonstiges', typ: 'einnahme', icon: '💰', farbe: '#065f46' },
      
      // Expense categories
      { name: 'Lebensmittel', typ: 'ausgabe', icon: '🛒', farbe: '#f44336' },
      { name: 'Miete', typ: 'ausgabe', icon: '🏠', farbe: '#e53e3e' },
      { name: 'Transport', typ: 'ausgabe', icon: '🚗', farbe: '#dc2626' },
      { name: 'Gesundheit', typ: 'ausgabe', icon: '⚕️', farbe: '#b91c1c' },
      { name: 'Unterhaltung', typ: 'ausgabe', icon: '🎬', farbe: '#991b1b' },
      { name: 'Kleidung', typ: 'ausgabe', icon: '👕', farbe: '#7f1d1d' },
      { name: 'Bildung', typ: 'ausgabe', icon: '📚', farbe: '#ff9800' },
      { name: 'Versicherungen', typ: 'ausgabe', icon: '🛡️', farbe: '#f57c00' },
      { name: 'Abonnements', typ: 'ausgabe', icon: '📱', farbe: '#ef6c00' },
      { name: 'Sonstiges', typ: 'ausgabe', icon: '💸', farbe: '#e65100' },
    ];

    for (const category of defaultCategories) {
      await sql`
        INSERT INTO kategorien (name, typ, icon, farbe)
        VALUES (${category.name}, ${category.typ}, ${category.icon}, ${category.farbe})
        ON CONFLICT DO NOTHING;
      `;
    }

    // Add a default account
    await sql`
      INSERT INTO konten (name, typ, saldo, farbe)
      VALUES ('Girokonto', 'Girokonto', 0, '#36a2eb')
      ON CONFLICT DO NOTHING;
    `;

    res.status(200).json({ 
      success: true, 
      message: 'Database setup complete with default categories and account' 
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed', details: error });
  }
}
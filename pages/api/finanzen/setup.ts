// Fixed Database Setup API with corrected SQL syntax

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting database setup...');
    
    // Test database connection first
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (connError) {
      console.error('❌ Database connection failed:', connError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: connError instanceof Error ? connError.message : 'Unknown connection error'
      });
    }

    // Create kategorien table with simplified constraints
    console.log('Creating kategorien table...');
    await sql`
      CREATE TABLE IF NOT EXISTS kategorien (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        typ VARCHAR(20) NOT NULL,
        farbe VARCHAR(7) DEFAULT '#36a2eb',
        icon VARCHAR(10) DEFAULT '💰',
        parent_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add foreign key constraint separately (if not exists)
    try {
      await sql`
        ALTER TABLE kategorien 
        ADD CONSTRAINT fk_kategorien_parent 
        FOREIGN KEY (parent_id) REFERENCES kategorien(id) ON DELETE CASCADE
      `;
    } catch (fkError) {
      // Constraint might already exist, ignore error
      console.log('Foreign key constraint may already exist');
    }

    // Create konten table
    console.log('Creating konten table...');
    await sql`
      CREATE TABLE IF NOT EXISTS konten (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        typ VARCHAR(50) NOT NULL,
        saldo DECIMAL(10,2) DEFAULT 0,
        farbe VARCHAR(7) DEFAULT '#36a2eb',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create transaktionen table
    console.log('Creating transaktionen table...');
    await sql`
      CREATE TABLE IF NOT EXISTS transaktionen (
        id SERIAL PRIMARY KEY,
        konto_id INTEGER NOT NULL,
        betrag DECIMAL(10,2) NOT NULL,
        typ VARCHAR(20) NOT NULL,
        kategorie_id INTEGER,
        datum DATE NOT NULL,
        beschreibung TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add foreign key constraints for transaktionen
    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD CONSTRAINT fk_transaktionen_konto 
        FOREIGN KEY (konto_id) REFERENCES konten(id) ON DELETE CASCADE
      `;
    } catch (fkError) {
      console.log('FK constraint transaktionen->konten may already exist');
    }

    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD CONSTRAINT fk_transaktionen_kategorie 
        FOREIGN KEY (kategorie_id) REFERENCES kategorien(id)
      `;
    } catch (fkError) {
      console.log('FK constraint transaktionen->kategorien may already exist');
    }

    // Create budgets table
    console.log('Creating budgets table...');
    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        kategorie_id INTEGER NOT NULL,
        betrag DECIMAL(10,2) NOT NULL,
        monat DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add foreign key constraint for budgets
    try {
      await sql`
        ALTER TABLE budgets 
        ADD CONSTRAINT fk_budgets_kategorie 
        FOREIGN KEY (kategorie_id) REFERENCES kategorien(id) ON DELETE CASCADE
      `;
    } catch (fkError) {
      console.log('FK constraint budgets->kategorien may already exist');
    }

    // Create sparziele table
    console.log('Creating sparziele table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sparziele (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        zielbetrag DECIMAL(10,2) NOT NULL,
        aktuell DECIMAL(10,2) DEFAULT 0,
        zieldatum DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Tables created successfully');

    // Check if categories already exist
    const { rows: existingCategories } = await sql`
      SELECT COUNT(*) as count FROM kategorien
    `;
    
    if (parseInt(existingCategories[0].count) > 0) {
      console.log(`Found ${existingCategories[0].count} existing categories`);
      return res.status(200).json({ 
        success: true, 
        message: `Database already initialized with ${existingCategories[0].count} categories`,
        existing: true
      });
    }

    // Add default main categories
    console.log('Adding default categories...');
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

    // Insert main categories one by one with better error handling
    const insertedCategories = [];
    for (const category of defaultCategories) {
      try {
        const { rows } = await sql`
          INSERT INTO kategorien (name, typ, icon, farbe)
          VALUES (${category.name}, ${category.typ}, ${category.icon}, ${category.farbe})
          RETURNING id, name
        `;
        insertedCategories.push(rows[0]);
        console.log(`✅ Inserted category: ${category.name} (ID: ${rows[0].id})`);
      } catch (categoryError) {
        console.log(`⚠️ Category ${category.name} might already exist:`, categoryError);
        // Try to get existing category
        try {
          const { rows } = await sql`
            SELECT id, name FROM kategorien WHERE name = ${category.name} AND typ = ${category.typ} AND parent_id IS NULL
          `;
          if (rows.length > 0) {
            insertedCategories.push(rows[0]);
            console.log(`✅ Found existing category: ${category.name} (ID: ${rows[0].id})`);
          }
        } catch (selectError) {
          console.error(`❌ Error with category ${category.name}:`, selectError);
        }
      }
    }

    console.log(`Main categories processed: ${insertedCategories.length}`);

    // Add subcategories
    console.log('Adding subcategories...');
    const subcategories = [
      // Unterhaltung subcategories
      { name: 'Videospiele', parentName: 'Unterhaltung', icon: '🎮', farbe: '#9c27b0' },
      { name: 'Kino & Theater', parentName: 'Unterhaltung', icon: '🎭', farbe: '#9c27b0' },
      { name: 'Ausgehen', parentName: 'Unterhaltung', icon: '🍺', farbe: '#9c27b0' },
      { name: 'Streaming', parentName: 'Unterhaltung', icon: '📺', farbe: '#9c27b0' },
      
      // Lebensmittel subcategories
      { name: 'Supermarkt', parentName: 'Lebensmittel', icon: '🏪', farbe: '#f44336' },
      { name: 'Restaurant', parentName: 'Lebensmittel', icon: '🍽️', farbe: '#f44336' },
      { name: 'Café', parentName: 'Lebensmittel', icon: '☕', farbe: '#f44336' },
      { name: 'Lieferservice', parentName: 'Lebensmittel', icon: '🥡', farbe: '#f44336' },
      
      // Transport subcategories
      { name: 'Öffentliche Verkehrsmittel', parentName: 'Transport', icon: '🚇', farbe: '#dc2626' },
      { name: 'Benzin', parentName: 'Transport', icon: '⛽', farbe: '#dc2626' },
      { name: 'Taxi/Uber', parentName: 'Transport', icon: '🚕', farbe: '#dc2626' },
      { name: 'Parkgebühren', parentName: 'Transport', icon: '🅿️', farbe: '#dc2626' },
      
      // Gehalt subcategories
      { name: 'Grundgehalt', parentName: 'Gehalt', icon: '💼', farbe: '#22c55e' },
      { name: 'Bonus', parentName: 'Gehalt', icon: '🎯', farbe: '#22c55e' },
      { name: 'Überstunden', parentName: 'Gehalt', icon: '⏰', farbe: '#22c55e' },
      
      // Kleidung subcategories
      { name: 'Arbeitskleidung', parentName: 'Kleidung', icon: '👔', farbe: '#7f1d1d' },
      { name: 'Freizeitkleidung', parentName: 'Kleidung', icon: '👕', farbe: '#7f1d1d' },
      { name: 'Schuhe', parentName: 'Kleidung', icon: '👟', farbe: '#7f1d1d' },
    ];

    const insertedSubcategories = [];
    for (const subcat of subcategories) {
      try {
        // Find parent category ID
        const { rows: parentRows } = await sql`
          SELECT id, typ FROM kategorien WHERE name = ${subcat.parentName} AND parent_id IS NULL
        `;
        
        if (parentRows.length > 0) {
          const parentId = parentRows[0].id;
          const parentType = parentRows[0].typ;
          
          try {
            const { rows } = await sql`
              INSERT INTO kategorien (name, typ, icon, farbe, parent_id)
              VALUES (${subcat.name}, ${parentType}, ${subcat.icon}, ${subcat.farbe}, ${parentId})
              RETURNING id, name
            `;
            insertedSubcategories.push(rows[0]);
            console.log(`✅ Inserted subcategory: ${subcat.name} under ${subcat.parentName} (ID: ${rows[0].id})`);
          } catch (subcatError) {
            console.log(`⚠️ Subcategory ${subcat.name} might already exist:`, subcatError);
          }
        } else {
          console.log(`⚠️ Parent category ${subcat.parentName} not found for ${subcat.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing subcategory ${subcat.name}:`, error);
      }
    }

    console.log(`Subcategories processed: ${insertedSubcategories.length}`);

    // Add a default account
    console.log('Adding default account...');
    try {
      const { rows: existingAccounts } = await sql`
        SELECT COUNT(*) as count FROM konten
      `;
      
      if (parseInt(existingAccounts[0].count) === 0) {
        await sql`
          INSERT INTO konten (name, typ, saldo, farbe)
          VALUES ('Girokonto', 'Girokonto', 0, '#36a2eb')
        `;
        console.log('✅ Default account created');
      } else {
        console.log('⚠️ Accounts already exist, skipping default account creation');
      }
    } catch (accountError) {
      console.log('⚠️ Error creating default account:', accountError);
    }

    // Final verification
    const { rows: finalCategories } = await sql`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
             COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
      FROM kategorien
    `;

    const { rows: finalAccounts } = await sql`
      SELECT COUNT(*) as count FROM konten
    `;

    console.log('Setup completed successfully!');

    res.status(200).json({ 
      success: true, 
      message: 'Database setup completed successfully!',
      stats: {
        total_categories: parseInt(finalCategories[0].total),
        main_categories: parseInt(finalCategories[0].main_categories),
        subcategories: parseInt(finalCategories[0].subcategories),
        accounts: parseInt(finalAccounts[0].count)
      }
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    res.status(500).json({ 
      error: 'Database setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
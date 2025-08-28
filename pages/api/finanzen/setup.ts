// Enhanced Database Setup API with 3-level categories and transfer support

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

type DatabaseCategory = {
  id: number;
  name: string;
  typ: string;
};

type InsertedCategory = DatabaseCategory & {
  originalName: string;
};

type InsertedLevel2Category = DatabaseCategory & {
  originalName: string;
  parentOriginalName: string;
};

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

    // Create kategorien table with 3-level support
    console.log('Creating kategorien table...');
    await sql`
      CREATE TABLE IF NOT EXISTS kategorien (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        typ VARCHAR(20) NOT NULL,
        farbe VARCHAR(7) DEFAULT '#36a2eb',
        icon VARCHAR(10) DEFAULT '💰',
        parent_id INTEGER,
        level INTEGER DEFAULT 1,
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

    // Create transaktionen table with transfer support
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
        transfer_id UUID,
        ziel_konto_id INTEGER,
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

    try {
      await sql`
        ALTER TABLE transaktionen 
        ADD CONSTRAINT fk_transaktionen_ziel_konto 
        FOREIGN KEY (ziel_konto_id) REFERENCES konten(id)
      `;
    } catch (fkError) {
      console.log('FK constraint transaktionen->ziel_konto may already exist');
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
    
    const existingCount = parseInt(existingCategories[0]?.count as string || '0');
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing categories`);
      return res.status(200).json({ 
        success: true, 
        message: `Database already initialized with ${existingCount} categories`,
        existing: true
      });
    }

    // Add Level 1 categories (High Level)
    console.log('Adding Level 1 categories...');
    const level1Categories = [
      // Income categories
      { name: 'Einkommen', typ: 'einnahme', icon: '💰', farbe: '#22c55e', level: 1 },
      { name: 'Investments', typ: 'einnahme', icon: '📈', farbe: '#10b981', level: 1 },
      { name: 'Sonstige Einnahmen', typ: 'einnahme', icon: '🎁', farbe: '#059669', level: 1 },
      
      // Expense categories
      { name: 'Essen & Trinken', typ: 'ausgabe', icon: '🍽️', farbe: '#f44336', level: 1 },
      { name: 'Einkaufen', typ: 'ausgabe', icon: '🛍️', farbe: '#e53e3e', level: 1 },
      { name: 'Wohnen', typ: 'ausgabe', icon: '🏠', farbe: '#dc2626', level: 1 },
      { name: 'Transport', typ: 'ausgabe', icon: '🚗', farbe: '#b91c1c', level: 1 },
      { name: 'Fahrzeug', typ: 'ausgabe', icon: '🚙', farbe: '#991b1b', level: 1 },
      { name: 'Kultur & Unterhaltung', typ: 'ausgabe', icon: '🎭', farbe: '#7f1d1d', level: 1 },
      { name: 'Kommunikation & Technik', typ: 'ausgabe', icon: '📱', farbe: '#ff9800', level: 1 },
      { name: 'Finanzaufwand', typ: 'ausgabe', icon: '🏦', farbe: '#f57c00', level: 1 },
      { name: 'Sonstiges', typ: 'ausgabe', icon: '❓', farbe: '#ef6c00', level: 1 },
    ];

    const insertedLevel1: InsertedCategory[] = [];
    for (const category of level1Categories) {
      try {
        const { rows } = await sql`
          INSERT INTO kategorien (name, typ, icon, farbe, level, parent_id)
          VALUES (${category.name}, ${category.typ}, ${category.icon}, ${category.farbe}, ${category.level}, null)
          RETURNING id, name, typ
        `;
        const insertedCategory: InsertedCategory = {
          id: rows[0].id as number,
          name: rows[0].name as string,
          typ: rows[0].typ as string,
          originalName: category.name
        };
        insertedLevel1.push(insertedCategory);
        console.log(`✅ Inserted Level 1 category: ${category.name} (ID: ${rows[0].id})`);
      } catch (categoryError) {
        console.error(`❌ Error with Level 1 category ${category.name}:`, categoryError);
      }
    }

    // Add Level 2 categories
    console.log('Adding Level 2 categories...');
    const level2Categories = [
      // Einkommen subcategories
      { name: 'Gehalt', parentName: 'Einkommen', icon: '💼', farbe: '#22c55e' },
      { name: 'Freelancing', parentName: 'Einkommen', icon: '💻', farbe: '#16a34a' },
      { name: 'Nebenjob', parentName: 'Einkommen', icon: '⏰', farbe: '#15803d' },
      
      // Investments subcategories
      { name: 'Dividenden', parentName: 'Investments', icon: '💎', farbe: '#10b981' },
      { name: 'Zinsen', parentName: 'Investments', icon: '🏦', farbe: '#059669' },
      { name: 'Krypto', parentName: 'Investments', icon: '₿', farbe: '#047857' },
      
      // Sonstige Einnahmen subcategories
      { name: 'Geschenke', parentName: 'Sonstige Einnahmen', icon: '🎁', farbe: '#059669' },
      { name: 'Verkäufe', parentName: 'Sonstige Einnahmen', icon: '💱', farbe: '#047857' },
      { name: 'Cashback', parentName: 'Sonstige Einnahmen', icon: '💰', farbe: '#065f46' },

      // Essen & Trinken subcategories
      { name: 'Lebensmittel', parentName: 'Essen & Trinken', icon: '🛒', farbe: '#f44336' },
      { name: 'Restaurant', parentName: 'Essen & Trinken', icon: '🍽️', farbe: '#ef4444' },
      { name: 'Café & Bar', parentName: 'Essen & Trinken', icon: '☕', farbe: '#dc2626' },
      { name: 'Lieferservice', parentName: 'Essen & Trinken', icon: '🥡', farbe: '#b91c1c' },
      
      // Einkaufen subcategories
      { name: 'Kleidung', parentName: 'Einkaufen', icon: '👕', farbe: '#e53e3e' },
      { name: 'Elektronik', parentName: 'Einkaufen', icon: '💻', farbe: '#dc2626' },
      { name: 'Haushalt', parentName: 'Einkaufen', icon: '🏠', farbe: '#b91c1c' },
      { name: 'Geschenke', parentName: 'Einkaufen', icon: '🎁', farbe: '#991b1b' },
      { name: 'Bücher', parentName: 'Einkaufen', icon: '📚', farbe: '#7f1d1d' },
      
      // Wohnen subcategories
      { name: 'Miete', parentName: 'Wohnen', icon: '🏠', farbe: '#dc2626' },
      { name: 'Nebenkosten', parentName: 'Wohnen', icon: '⚡', farbe: '#b91c1c' },
      { name: 'Internet & TV', parentName: 'Wohnen', icon: '📺', farbe: '#991b1b' },
      { name: 'Möbel', parentName: 'Wohnen', icon: '🪑', farbe: '#7f1d1d' },
      { name: 'Reparaturen', parentName: 'Wohnen', icon: '🔧', farbe: '#6b1d1d' },
      
      // Transport subcategories
      { name: 'Öffentliche Verkehrsmittel', parentName: 'Transport', icon: '🚇', farbe: '#b91c1c' },
      { name: 'Taxi & Rideshare', parentName: 'Transport', icon: '🚕', farbe: '#991b1b' },
      { name: 'Flug & Bahn', parentName: 'Transport', icon: '✈️', farbe: '#7f1d1d' },
      
      // Fahrzeug subcategories
      { name: 'Benzin', parentName: 'Fahrzeug', icon: '⛽', farbe: '#991b1b' },
      { name: 'Wartung', parentName: 'Fahrzeug', icon: '🔧', farbe: '#7f1d1d' },
      { name: 'Versicherung', parentName: 'Fahrzeug', icon: '🛡️', farbe: '#6b1d1d' },
      { name: 'Parkgebühren', parentName: 'Fahrzeug', icon: '🅿️', farbe: '#5b1d1d' },
      
      // Kultur & Unterhaltung subcategories
      { name: 'Streaming & Medien', parentName: 'Kultur & Unterhaltung', icon: '📺', farbe: '#7f1d1d' },
      { name: 'Kino & Theater', parentName: 'Kultur & Unterhaltung', icon: '🎬', farbe: '#6b1d1d' },
      { name: 'Sport & Fitness', parentName: 'Kultur & Unterhaltung', icon: '🏋️', farbe: '#5b1d1d' },
      { name: 'Hobbys', parentName: 'Kultur & Unterhaltung', icon: '🎯', farbe: '#4b1d1d' },
      { name: 'Ausgehen', parentName: 'Kultur & Unterhaltung', icon: '🍻', farbe: '#3b1d1d' },
      
      // Kommunikation & Technik subcategories
      { name: 'Handy', parentName: 'Kommunikation & Technik', icon: '📱', farbe: '#ff9800' },
      { name: 'Software', parentName: 'Kommunikation & Technik', icon: '💾', farbe: '#f57c00' },
      { name: 'Hardware', parentName: 'Kommunikation & Technik', icon: '⌨️', farbe: '#ef6c00' },
      
      // Finanzaufwand subcategories
      { name: 'Gebühren', parentName: 'Finanzaufwand', icon: '🏦', farbe: '#f57c00' },
      { name: 'Steuern', parentName: 'Finanzaufwand', icon: '📊', farbe: '#ef6c00' },
      { name: 'Versicherungen', parentName: 'Finanzaufwand', icon: '🛡️', farbe: '#e65100' },
      
      // Sonstiges subcategories
      { name: 'Gesundheit', parentName: 'Sonstiges', icon: '⚕️', farbe: '#ef6c00' },
      { name: 'Bildung', parentName: 'Sonstiges', icon: '🎓', farbe: '#e65100' },
      { name: 'Spenden', parentName: 'Sonstiges', icon: '❤️', farbe: '#d84315' },
      { name: 'Verschiedenes', parentName: 'Sonstiges', icon: '❓', farbe: '#bf360c' },
    ];

    const insertedLevel2: InsertedLevel2Category[] = [];
    for (const category of level2Categories) {
      try {
        // Find parent category ID
        const parent = insertedLevel1.find(p => p.originalName === category.parentName);
        if (parent) {
          const { rows } = await sql`
            INSERT INTO kategorien (name, typ, icon, farbe, level, parent_id)
            VALUES (${category.name}, ${parent.typ}, ${category.icon}, ${category.farbe}, 2, ${parent.id})
            RETURNING id, name, typ
          `;
          const insertedCategory: InsertedLevel2Category = {
            id: rows[0].id as number,
            name: rows[0].name as string,
            typ: rows[0].typ as string,
            originalName: category.name,
            parentOriginalName: category.parentName
          };
          insertedLevel2.push(insertedCategory);
          console.log(`✅ Inserted Level 2 category: ${category.name} under ${category.parentName} (ID: ${rows[0].id})`);
        } else {
          console.log(`⚠️ Parent category ${category.parentName} not found for ${category.name}`);
        }
      } catch (categoryError) {
        console.error(`❌ Error with Level 2 category ${category.name}:`, categoryError);
      }
    }

    // Add Level 3 categories (detailed subcategories)
    console.log('Adding Level 3 categories...');
    const level3Categories = [
      // Lebensmittel subcategories
      { name: 'Supermarkt', parentName: 'Lebensmittel', icon: '🏪', farbe: '#f44336' },
      { name: 'Bio-Markt', parentName: 'Lebensmittel', icon: '🥬', farbe: '#f44336' },
      { name: 'Bäckerei', parentName: 'Lebensmittel', icon: '🥖', farbe: '#f44336' },
      { name: 'Metzgerei', parentName: 'Lebensmittel', icon: '🥩', farbe: '#f44336' },
      
      // Restaurant subcategories
      { name: 'Fast Food', parentName: 'Restaurant', icon: '🍔', farbe: '#ef4444' },
      { name: 'Fine Dining', parentName: 'Restaurant', icon: '🍷', farbe: '#ef4444' },
      { name: 'Asiatisch', parentName: 'Restaurant', icon: '🍜', farbe: '#ef4444' },
      { name: 'Italienisch', parentName: 'Restaurant', icon: '🍝', farbe: '#ef4444' },
      { name: 'Kantinen', parentName: 'Restaurant', icon: '🥪', farbe: '#ef4444' },
      
      // Café & Bar subcategories
      { name: 'Café', parentName: 'Café & Bar', icon: '☕', farbe: '#dc2626' },
      { name: 'Bar', parentName: 'Café & Bar', icon: '🍺', farbe: '#dc2626' },
      { name: 'Cocktailbar', parentName: 'Café & Bar', icon: '🍸', farbe: '#dc2626' },
      
      // Kleidung subcategories
      { name: 'Arbeitskleidung', parentName: 'Kleidung', icon: '👔', farbe: '#e53e3e' },
      { name: 'Freizeitkleidung', parentName: 'Kleidung', icon: '👕', farbe: '#e53e3e' },
      { name: 'Schuhe', parentName: 'Kleidung', icon: '👟', farbe: '#e53e3e' },
      { name: 'Unterwäsche', parentName: 'Kleidung', icon: '🩲', farbe: '#e53e3e' },
      { name: 'Schmuck', parentName: 'Kleidung', icon: '💎', farbe: '#e53e3e' },
      
      // Elektronik subcategories
      { name: 'Smartphone', parentName: 'Elektronik', icon: '📱', farbe: '#dc2626' },
      { name: 'Computer', parentName: 'Elektronik', icon: '💻', farbe: '#dc2626' },
      { name: 'Gaming', parentName: 'Elektronik', icon: '🎮', farbe: '#dc2626' },
      { name: 'Audio', parentName: 'Elektronik', icon: '🎧', farbe: '#dc2626' },
      { name: 'TV & Video', parentName: 'Elektronik', icon: '📺', farbe: '#dc2626' },
      
      // Haushalt subcategories
      { name: 'Küchengeräte', parentName: 'Haushalt', icon: '🍽️', farbe: '#b91c1c' },
      { name: 'Reinigung', parentName: 'Haushalt', icon: '🧽', farbe: '#b91c1c' },
      { name: 'Deko', parentName: 'Haushalt', icon: '🕯️', farbe: '#b91c1c' },
      { name: 'Werkzeuge', parentName: 'Haushalt', icon: '🔨', farbe: '#b91c1c' },
      
      // Gehalt subcategories
      { name: 'Grundgehalt', parentName: 'Gehalt', icon: '💼', farbe: '#22c55e' },
      { name: 'Bonus', parentName: 'Gehalt', icon: '🎯', farbe: '#22c55e' },
      { name: 'Überstunden', parentName: 'Gehalt', icon: '⏰', farbe: '#22c55e' },
      { name: '13. Gehalt', parentName: 'Gehalt', icon: '🎊', farbe: '#22c55e' },
      
      // Sport & Fitness subcategories
      { name: 'Fitnessstudio', parentName: 'Sport & Fitness', icon: '🏋️', farbe: '#5b1d1d' },
      { name: 'Sportausrüstung', parentName: 'Sport & Fitness', icon: '⚽', farbe: '#5b1d1d' },
      { name: 'Kurse', parentName: 'Sport & Fitness', icon: '🧘', farbe: '#5b1d1d' },
      
      // Gesundheit subcategories
      { name: 'Arzt', parentName: 'Gesundheit', icon: '👨‍⚕️', farbe: '#ef6c00' },
      { name: 'Medikamente', parentName: 'Gesundheit', icon: '💊', farbe: '#ef6c00' },
      { name: 'Zahnarzt', parentName: 'Gesundheit', icon: '🦷', farbe: '#ef6c00' },
      { name: 'Wellness', parentName: 'Gesundheit', icon: '💆', farbe: '#ef6c00' },
    ];

    const insertedLevel3: DatabaseCategory[] = [];
    for (const category of level3Categories) {
      try {
        // Find parent category ID
        const parent = insertedLevel2.find(p => p.originalName === category.parentName);
        if (parent) {
          const { rows } = await sql`
            INSERT INTO kategorien (name, typ, icon, farbe, level, parent_id)
            VALUES (${category.name}, ${parent.typ}, ${category.icon}, ${category.farbe}, 3, ${parent.id})
            RETURNING id, name
          `;
          insertedLevel3.push({
            id: rows[0].id as number,
            name: rows[0].name as string,
            typ: parent.typ
          });
          console.log(`✅ Inserted Level 3 category: ${category.name} under ${category.parentName} (ID: ${rows[0].id})`);
        } else {
          console.log(`⚠️ Parent category ${category.parentName} not found for ${category.name}`);
        }
      } catch (categoryError) {
        console.error(`❌ Error with Level 3 category ${category.name}:`, categoryError);
      }
    }

    // Add default accounts
    console.log('Adding default accounts...');
    try {
      const { rows: existingAccounts } = await sql`
        SELECT COUNT(*) as count FROM konten
      `;
      
      const accountCount = parseInt(existingAccounts[0]?.count as string || '0');
      if (accountCount === 0) {
        const defaultAccounts = [
          { name: 'Girokonto', typ: 'Girokonto', farbe: '#36a2eb' },
          { name: 'Sparkonto', typ: 'Sparkonto', farbe: '#4bc0c0' },
          { name: 'Bargeld', typ: 'Bargeld', farbe: '#ff6384' },
        ];

        for (const account of defaultAccounts) {
          await sql`
            INSERT INTO konten (name, typ, saldo, farbe)
            VALUES (${account.name}, ${account.typ}, 0, ${account.farbe})
          `;
        }
        console.log('✅ Default accounts created');
      } else {
        console.log('⚠️ Accounts already exist, skipping default account creation');
      }
    } catch (accountError) {
      console.log('⚠️ Error creating default accounts:', accountError);
    }

    // Final verification
    const { rows: finalCategories } = await sql`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN level = 1 THEN 1 END) as level1,
             COUNT(CASE WHEN level = 2 THEN 1 END) as level2,
             COUNT(CASE WHEN level = 3 THEN 1 END) as level3
      FROM kategorien
    `;

    const { rows: finalAccounts } = await sql`
      SELECT COUNT(*) as count FROM konten
    `;

    console.log('Setup completed successfully!');

    res.status(200).json({ 
      success: true, 
      message: 'Database setup completed successfully with 3-level categories!',
      stats: {
        total_categories: parseInt(finalCategories[0]?.total as string || '0'),
        level1_categories: parseInt(finalCategories[0]?.level1 as string || '0'),
        level2_categories: parseInt(finalCategories[0]?.level2 as string || '0'),
        level3_categories: parseInt(finalCategories[0]?.level3 as string || '0'),
        accounts: parseInt(finalAccounts[0]?.count as string || '0')
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
// Enhanced Database Setup API with 3-level categories and transfer support

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting enhanced database setup with 3-level categories...');
    
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

    // Create enhanced transaktionen table with transfer support
    console.log('Creating transaktionen table with transfer support...');
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
        ADD CONSTRAINT fk_transaktionen_ziel 
        FOREIGN KEY (ziel_konto_id) REFERENCES konten(id)
      `;
    } catch (fkError) {
      console.log('FK constraint transaktionen->ziel_konto may already exist');
    }

    // Create other tables...
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

    try {
      await sql`
        ALTER TABLE budgets 
        ADD CONSTRAINT fk_budgets_kategorie 
        FOREIGN KEY (kategorie_id) REFERENCES kategorien(id) ON DELETE CASCADE
      `;
    } catch (fkError) {
      console.log('FK constraint budgets->kategorien may already exist');
    }

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

    // Create 3-Level Category System
    console.log('Adding 3-level category system...');

    // Level 1: Main Categories (both income and expense versions)
    const mainCategories = [
      // Income categories
      { name: 'Essen & Trinken', typ: 'einnahme', icon: '🍽️', farbe: '#22c55e', level: 1 },
      { name: 'Einkaufen', typ: 'einnahme', icon: '🛒', farbe: '#16a34a', level: 1 },
      { name: 'Wohnen', typ: 'einnahme', icon: '🏠', farbe: '#059669', level: 1 },
      { name: 'Transport', typ: 'einnahme', icon: '🚗', farbe: '#047857', level: 1 },
      { name: 'Fahrzeug', typ: 'einnahme', icon: '🚙', farbe: '#065f46', level: 1 },
      { name: 'Kultur & Unterhaltung', typ: 'einnahme', icon: '🎭', farbe: '#10b981', level: 1 },
      { name: 'Kommunikation & Technik', typ: 'einnahme', icon: '📱', farbe: '#34d399', level: 1 },
      { name: 'Finanzaufwand', typ: 'einnahme', icon: '🏦', farbe: '#6ee7b7', level: 1 },
      { name: 'Investments', typ: 'einnahme', icon: '📈', farbe: '#a7f3d0', level: 1 },
      { name: 'Sonstiges', typ: 'einnahme', icon: '💰', farbe: '#d1fae5', level: 1 },

      // Expense categories
      { name: 'Essen & Trinken', typ: 'ausgabe', icon: '🍽️', farbe: '#f44336', level: 1 },
      { name: 'Einkaufen', typ: 'ausgabe', icon: '🛒', farbe: '#e53e3e', level: 1 },
      { name: 'Wohnen', typ: 'ausgabe', icon: '🏠', farbe: '#dc2626', level: 1 },
      { name: 'Transport', typ: 'ausgabe', icon: '🚗', farbe: '#b91c1c', level: 1 },
      { name: 'Fahrzeug', typ: 'ausgabe', icon: '🚙', farbe: '#991b1b', level: 1 },
      { name: 'Kultur & Unterhaltung', typ: 'ausgabe', icon: '🎭', farbe: '#7f1d1d', level: 1 },
      { name: 'Kommunikation & Technik', typ: 'ausgabe', icon: '📱', farbe: '#ef4444', level: 1 },
      { name: 'Finanzaufwand', typ: 'ausgabe', icon: '🏦', farbe: '#fca5a5', level: 1 },
      { name: 'Investments', typ: 'ausgabe', icon: '📈', farbe: '#fecaca', level: 1 },
      { name: 'Sonstiges', typ: 'ausgabe', icon: '💸', farbe: '#fee2e2', level: 1 },
    ];

    console.log('Adding main categories (Level 1)...');
    const categoryMap = new Map();
    
    for (const category of mainCategories) {
      try {
        const { rows } = await sql`
          INSERT INTO kategorien (name, typ, icon, farbe, level, parent_id)
          VALUES (${category.name}, ${category.typ}, ${category.icon}, ${category.farbe}, ${category.level}, null)
          RETURNING id, name, typ
        `;
        categoryMap.set(`${category.name}_${category.typ}`, rows[0].id);
        console.log(`✅ Added Level 1: ${category.name} (${category.typ}) - ID: ${rows[0].id}`);
      } catch (error) {
        console.log(`⚠️ Main category ${category.name} (${category.typ}) might already exist`);
      }
    }

    // Level 2: Subcategories
    const subcategories = [
      // Essen & Trinken - Level 2
      { name: 'Restaurant & Gastronomie', parent: 'Essen & Trinken', icon: '🍽️', farbe: '#f44336' },
      { name: 'Lebensmittel Einkauf', parent: 'Essen & Trinken', icon: '🛒', farbe: '#f44336' },
      { name: 'Getränke', parent: 'Essen & Trinken', icon: '🥤', farbe: '#f44336' },
      { name: 'Süßigkeiten & Snacks', parent: 'Essen & Trinken', icon: '🍬', farbe: '#f44336' },

      // Einkaufen - Level 2
      { name: 'Kleidung & Mode', parent: 'Einkaufen', icon: '👕', farbe: '#e53e3e' },
      { name: 'Haushaltswaren', parent: 'Einkaufen', icon: '🧽', farbe: '#e53e3e' },
      { name: 'Elektronik & Geräte', parent: 'Einkaufen', icon: '📱', farbe: '#e53e3e' },
      { name: 'Sport & Freizeit', parent: 'Einkaufen', icon: '⚽', farbe: '#e53e3e' },
      { name: 'Geschenke', parent: 'Einkaufen', icon: '🎁', farbe: '#e53e3e' },

      // Wohnen - Level 2
      { name: 'Miete & Nebenkosten', parent: 'Wohnen', icon: '🏠', farbe: '#dc2626' },
      { name: 'Strom & Energie', parent: 'Wohnen', icon: '💡', farbe: '#dc2626' },
      { name: 'Internet & Telefon', parent: 'Wohnen', icon: '🌐', farbe: '#dc2626' },
      { name: 'Möbel & Einrichtung', parent: 'Wohnen', icon: '🛏️', farbe: '#dc2626' },
      { name: 'Reparaturen & Wartung', parent: 'Wohnen', icon: '🔨', farbe: '#dc2626' },

      // Transport - Level 2
      { name: 'Öffentliche Verkehrsmittel', parent: 'Transport', icon: '🚇', farbe: '#b91c1c' },
      { name: 'Taxi & Ridesharing', parent: 'Transport', icon: '🚕', farbe: '#b91c1c' },
      { name: 'Fahrrad', parent: 'Transport', icon: '🚲', farbe: '#b91c1c' },
      { name: 'Flug & Fernreisen', parent: 'Transport', icon: '✈️', farbe: '#b91c1c' },

      // Fahrzeug - Level 2
      { name: 'Kraftstoff', parent: 'Fahrzeug', icon: '⛽', farbe: '#991b1b' },
      { name: 'Wartung & Reparatur', parent: 'Fahrzeug', icon: '🔧', farbe: '#991b1b' },
      { name: 'Versicherung & Steuern', parent: 'Fahrzeug', icon: '🛡️', farbe: '#991b1b' },
      { name: 'Parken & Maut', parent: 'Fahrzeug', icon: '🅿️', farbe: '#991b1b' },

      // Kultur & Unterhaltung - Level 2
      { name: 'Streaming & Abonnements', parent: 'Kultur & Unterhaltung', icon: '📺', farbe: '#7f1d1d' },
      { name: 'Kino & Theater', parent: 'Kultur & Unterhaltung', icon: '🎬', farbe: '#7f1d1d' },
      { name: 'Gaming', parent: 'Kultur & Unterhaltung', icon: '🎮', farbe: '#7f1d1d' },
      { name: 'Bücher & Medien', parent: 'Kultur & Unterhaltung', icon: '📚', farbe: '#7f1d1d' },
      { name: 'Events & Konzerte', parent: 'Kultur & Unterhaltung', icon: '🎪', farbe: '#7f1d1d' },

      // Kommunikation & Technik - Level 2
      { name: 'Mobilfunk', parent: 'Kommunikation & Technik', icon: '📱', farbe: '#ef4444' },
      { name: 'Software & Apps', parent: 'Kommunikation & Technik', icon: '💿', farbe: '#ef4444' },
      { name: 'Hardware', parent: 'Kommunikation & Technik', icon: '💻', farbe: '#ef4444' },
      { name: 'Cloud & Storage', parent: 'Kommunikation & Technik', icon: '☁️', farbe: '#ef4444' },

      // Finanzaufwand - Level 2
      { name: 'Bankgebühren', parent: 'Finanzaufwand', icon: '🏦', farbe: '#fca5a5' },
      { name: 'Versicherungen', parent: 'Finanzaufwand', icon: '🛡️', farbe: '#fca5a5' },
      { name: 'Kredite & Zinsen', parent: 'Finanzaufwand', icon: '💳', farbe: '#fca5a5' },
      { name: 'Steuern & Abgaben', parent: 'Finanzaufwand', icon: '🧾', farbe: '#fca5a5' },

      // Investments - Level 2
      { name: 'Aktien & ETFs', parent: 'Investments', icon: '📊', farbe: '#fecaca' },
      { name: 'Kryptowährungen', parent: 'Investments', icon: '₿', farbe: '#fecaca' },
      { name: 'Immobilien', parent: 'Investments', icon: '🏘️', farbe: '#fecaca' },
      { name: 'Sparpläne', parent: 'Investments', icon: '💰', farbe: '#fecaca' },

      // Sonstiges - Level 2
      { name: 'Gesundheit & Medizin', parent: 'Sonstiges', icon: '⚕️', farbe: '#fee2e2' },
      { name: 'Bildung & Weiterbildung', parent: 'Sonstiges', icon: '🎓', farbe: '#fee2e2' },
      { name: 'Spenden & Unterstützung', parent: 'Sonstiges', icon: '💝', farbe: '#fee2e2' },
      { name: 'Verschiedenes', parent: 'Sonstiges', icon: '❓', farbe: '#fee2e2' },
    ];

    console.log('Adding subcategories (Level 2)...');
    const subcategoryMap = new Map();

    for (const subcat of subcategories) {
      // Add to both income and expense
      for (const typ of ['einnahme', 'ausgabe']) {
        const parentId = categoryMap.get(`${subcat.parent}_${typ}`);
        if (parentId) {
          try {
            const { rows } = await sql`
              INSERT INTO kategorien (name, typ, icon, farbe, level, parent_id)
              VALUES (${subcat.name}, ${typ}, ${subcat.icon}, ${subcat.farbe}, 2, ${parentId})
              RETURNING id, name, typ
            `;
            subcategoryMap.set(`${subcat.name}_${typ}`, rows[0].id);
            console.log(`✅ Added Level 2: ${subcat.name} (${typ}) under ${subcat.parent} - ID: ${rows[0].id}`);
          } catch (error) {
            console.log(`⚠️ Subcategory ${subcat.name} (${typ}) might already exist`);
          }
        }
      }
    }

    // Level 3: Sub-subcategories
    const subSubcategories = [
      // Restaurant & Gastronomie - Level 3
      { name: 'Fast Food', parent: 'Restaurant & Gastronomie', icon: '🍟', farbe: '#f44336' },
      { name: 'Fine Dining', parent: 'Restaurant & Gastronomie', icon: '🍷', farbe: '#f44336' },
      { name: 'Café & Bäckerei', parent: 'Restaurant & Gastronomie', icon: '☕', farbe: '#f44336' },
      { name: 'Lieferdienst', parent: 'Restaurant & Gastronomie', icon: '🥡', farbe: '#f44336' },

      // Lebensmittel Einkauf - Level 3
      { name: 'Supermarkt', parent: 'Lebensmittel Einkauf', icon: '🏪', farbe: '#f44336' },
      { name: 'Bio-Markt', parent: 'Lebensmittel Einkauf', icon: '🌱', farbe: '#f44336' },
      { name: 'Wochenmarkt', parent: 'Lebensmittel Einkauf', icon: '🥕', farbe: '#f44336' },
      { name: 'Online-Lieferung', parent: 'Lebensmittel Einkauf', icon: '📦', farbe: '#f44336' },

      // Kleidung & Mode - Level 3
      { name: 'Arbeitskleidung', parent: 'Kleidung & Mode', icon: '👔', farbe: '#e53e3e' },
      { name: 'Freizeitkleidung', parent: 'Kleidung & Mode', icon: '👕', farbe: '#e53e3e' },
      { name: 'Schuhe', parent: 'Kleidung & Mode', icon: '👟', farbe: '#e53e3e' },
      { name: 'Accessoires', parent: 'Kleidung & Mode', icon: '👒', farbe: '#e53e3e' },

      // Streaming & Abonnements - Level 3
      { name: 'Netflix', parent: 'Streaming & Abonnements', icon: '📺', farbe: '#7f1d1d' },
      { name: 'Spotify', parent: 'Streaming & Abonnements', icon: '🎵', farbe: '#7f1d1d' },
      { name: 'YouTube Premium', parent: 'Streaming & Abonnements', icon: '📱', farbe: '#7f1d1d' },
      { name: 'Amazon Prime', parent: 'Streaming & Abonnements', icon: '📦', farbe: '#7f1d1d' },

      // Gaming - Level 3
      { name: 'PlayStation', parent: 'Gaming', icon: '🎮', farbe: '#7f1d1d' },
      { name: 'Steam', parent: 'Gaming', icon: '💻', farbe: '#7f1d1d' },
      { name: 'Mobile Games', parent: 'Gaming', icon: '📱', farbe: '#7f1d1d' },
      { name: 'Nintendo', parent: 'Gaming', icon: '🎮', farbe: '#7f1d1d' },

      // Öffentliche Verkehrsmittel - Level 3
      { name: 'Monatskarte', parent: 'Öffentliche Verkehrsmittel', icon: '🎫', farbe: '#b91c1c' },
      { name: 'Einzelfahrt', parent: 'Öffentliche Verkehrsmittel', icon: '🎟️', farbe: '#b91c1c' },
      { name: 'Fernverkehr', parent: 'Öffentliche Verkehrsmittel', icon: '🚆', farbe: '#b91c1c' },

      // Kraftstoff - Level 3
      { name: 'Super', parent: 'Kraftstoff', icon: '⛽', farbe: '#991b1b' },
      { name: 'Diesel', parent: 'Kraftstoff', icon: '⛽', farbe: '#991b1b' },
      { name: 'Elektro', parent: 'Kraftstoff', icon: '🔌', farbe: '#991b1b' },

      // Versicherungen - Level 3
      { name: 'Krankenversicherung', parent: 'Versicherungen', icon: '🏥', farbe: '#fca5a5' },
      { name: 'Autoversicherung', parent: 'Versicherungen', icon: '🚗', farbe: '#fca5a5' },
      { name: 'Hausratversicherung', parent: 'Versicherungen', icon: '🏠', farbe: '#fca5a5' },
      { name: 'Berufsunfähigkeit', parent: 'Versicherungen', icon: '🛡️', farbe: '#fca5a5' },
    ];

    console.log('Adding sub-subcategories (Level 3)...');
    let level3Count = 0;

    for (const subSubcat of subSubcategories) {
      // Add to both income and expense
      for (const typ of ['einnahme', 'ausgabe']) {
        const parentId = subcategoryMap.get(`${subSubcat.parent}_${typ}`);
        if (parentId) {
          try {
            const { rows } = await sql`
              INSERT INTO kategorien (name, typ, icon, farbe, level, parent_id)
              VALUES (${subSubcat.name}, ${typ}, ${subSubcat.icon}, ${subSubcat.farbe}, 3, ${parentId})
              RETURNING id, name
            `;
            level3Count++;
            console.log(`✅ Added Level 3: ${subSubcat.name} (${typ}) under ${subSubcat.parent} - ID: ${rows[0].id}`);
          } catch (error) {
            console.log(`⚠️ Sub-subcategory ${subSubcat.name} (${typ}) might already exist`);
          }
        }
      }
    }

    // Add default accounts
    console.log('Adding default accounts...');
    try {
      const { rows: existingAccounts } = await sql`
        SELECT COUNT(*) as count FROM konten
      `;
      
      if (parseInt(existingAccounts[0].count) === 0) {
        const defaultAccounts = [
          { name: 'Girokonto', typ: 'Girokonto', farbe: '#36a2eb' },
          { name: 'Sparkonto', typ: 'Sparkonto', farbe: '#22c55e' },
          { name: 'Kreditkarte', typ: 'Kreditkarte', farbe: '#f44336' },
        ];

        for (const account of defaultAccounts) {
          await sql`
            INSERT INTO konten (name, typ, saldo, farbe)
            VALUES (${account.name}, ${account.typ}, 0, ${account.farbe})
          `;
          console.log(`✅ Added account: ${account.name}`);
        }
      }
    } catch (accountError) {
      console.log('⚠️ Error creating default accounts:', accountError);
    }

    // Final verification
    const { rows: finalStats } = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN level = 1 THEN 1 END) as level_1,
        COUNT(CASE WHEN level = 2 THEN 1 END) as level_2,
        COUNT(CASE WHEN level = 3 THEN 1 END) as level_3
      FROM kategorien
    `;

    const { rows: finalAccounts } = await sql`
      SELECT COUNT(*) as count FROM konten
    `;

    console.log('3-Level category setup completed successfully!');

    res.status(200).json({ 
      success: true, 
      message: '3-Level category system and transfer support setup completed!',
      stats: {
        total_categories: parseInt(finalStats[0].total),
        level_1_categories: parseInt(finalStats[0].level_1),
        level_2_categories: parseInt(finalStats[0].level_2),
        level_3_categories: parseInt(finalStats[0].level_3),
        accounts: parseInt(finalAccounts[0].count)
      },
      features: [
        '✅ 3-Level category hierarchy',
        '✅ Transfer support between accounts',
        '✅ Enhanced transaction tracking',
        '✅ Comprehensive category structure'
      ]
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
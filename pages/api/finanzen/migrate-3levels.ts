import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting 3-level category migration...');

    // First, ensure parent_id column exists
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'kategorien' AND column_name = 'parent_id'
        ) THEN
          ALTER TABLE kategorien ADD COLUMN parent_id INTEGER REFERENCES kategorien(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    // Clear existing categories to set up new structure
    const { rows: existingCount } = await sql`SELECT COUNT(*) as count FROM kategorien`;
    console.log(`Found ${existingCount[0].count} existing categories`);
    
    if (existingCount[0].count > 0) {
      console.log('Clearing existing categories to set up new structure...');
      await sql`DELETE FROM kategorien`;
    }

    // Define the 3-level category structure
    const categoryStructure = {
      // INCOME CATEGORIES
      'Investments': {
        type: 'einnahme',
        icon: '📈',
        color: '#10b981',
        subcategories: {
          'Aktien & ETFs': {
            icon: '📊',
            children: ['Dividenden', 'Kursgewinne', 'ETF-Ausschüttungen']
          },
          'Kryptowährungen': {
            icon: '₿',
            children: ['Bitcoin', 'Ethereum', 'Altcoins']
          },
          'Immobilien': {
            icon: '🏠',
            children: ['Mieteinnahmen', 'Immobiliengewinne', 'REITs']
          }
        }
      },
      'Finanzaufwand': {
        type: 'einnahme',
        icon: '💰',
        color: '#22c55e',
        subcategories: {
          'Gehalt & Lohn': {
            icon: '💼',
            children: ['Grundgehalt', 'Bonus', 'Überstunden', '13. Gehalt']
          },
          'Selbstständigkeit': {
            icon: '💻',
            children: ['Freelancing', 'Beratung', 'Verkauf']
          },
          'Sonstige Einnahmen': {
            icon: '💸',
            children: ['Steuererstattung', 'Geschenke', 'Versicherungsleistungen']
          }
        }
      },

      // EXPENSE CATEGORIES  
      'Essen & Trinken': {
        type: 'ausgabe',
        icon: '🍽️',
        color: '#f44336',
        subcategories: {
          'Restaurants & Cafés': {
            icon: '🍽️',
            children: ['Fine Dining', 'Fast Food', 'Café & Bäckerei', 'Lieferservice']
          },
          'Lebensmittel': {
            icon: '🛒',
            children: ['Supermarkt', 'Bio-Markt', 'Wochenmarkt', 'Getränke']
          },
          'Alkohol & Ausgehen': {
            icon: '🍺',
            children: ['Bar & Kneipe', 'Wein & Spirituosen', 'Clubs', 'Events']
          }
        }
      },
      'Einkaufen': {
        type: 'ausgabe',
        icon: '🛍️',
        color: '#e91e63',
        subcategories: {
          'Kleidung': {
            icon: '👕',
            children: ['Arbeitskleidung', 'Freizeitkleidung', 'Schuhe', 'Accessoires']
          },
          'Elektronik': {
            icon: '📱',
            children: ['Smartphones', 'Computer', 'Gaming', 'Smart Home']
          },
          'Haushaltswaren': {
            icon: '🏠',
            children: ['Möbel', 'Dekoration', 'Küche', 'Bad']
          }
        }
      },
      'Wohnen': {
        type: 'ausgabe',
        icon: '🏠',
        color: '#ff6b35',
        subcategories: {
          'Miete & Nebenkosten': {
            icon: '🏠',
            children: ['Kaltmiete', 'Nebenkosten', 'Strom', 'Gas', 'Wasser']
          },
          'Hausrat & Einrichtung': {
            icon: '🛋️',
            children: ['Möbel', 'Haushaltsgeräte', 'Reparaturen', 'Renovierung']
          },
          'Garten & Außenbereich': {
            icon: '🌱',
            children: ['Pflanzen', 'Gartengeräte', 'Gartenpflege']
          }
        }
      },
      'Transport': {
        type: 'ausgabe',
        icon: '🚇',
        color: '#2196f3',
        subcategories: {
          'Öffentliche Verkehrsmittel': {
            icon: '🚇',
            children: ['Monatskarte', 'Einzelfahrten', 'Fernverkehr']
          },
          'Taxi & Fahrdienste': {
            icon: '🚕',
            children: ['Taxi', 'Uber', 'Bolt', 'Car-Sharing']
          },
          'Flugreisen': {
            icon: '✈️',
            children: ['Inlandsflüge', 'Europa', 'Langstrecke']
          }
        }
      },
      'Fahrzeug': {
        type: 'ausgabe',
        icon: '🚗',
        color: '#dc2626',
        subcategories: {
          'Kraftstoff': {
            icon: '⛽',
            children: ['Benzin', 'Diesel', 'Elektro']
          },
          'Wartung & Reparatur': {
            icon: '🔧',
            children: ['Inspektion', 'Reparaturen', 'Reifen', 'TÜV']
          },
          'Versicherung & Steuern': {
            icon: '📋',
            children: ['KFZ-Versicherung', 'KFZ-Steuer', 'Vignetten']
          },
          'Parken': {
            icon: '🅿️',
            children: ['Parkgebühren', 'Parkhaus', 'Knöllchen']
          }
        }
      },
      'Kultur & Unterhaltung': {
        type: 'ausgabe',
        icon: '🎬',
        color: '#9c27b0',
        subcategories: {
          'Streaming & Medien': {
            icon: '📺',
            children: ['Netflix', 'Amazon Prime', 'Spotify', 'YouTube Premium']
          },
          'Gaming': {
            icon: '🎮',
            children: ['Videospiele', 'Gaming-Hardware', 'Online-Services']
          },
          'Kultur': {
            icon: '🎭',
            children: ['Kino', 'Theater', 'Konzerte', 'Museen']
          },
          'Sport & Hobbies': {
            icon: '⚽',
            children: ['Fitnessstudio', 'Sportausrüstung', 'Events', 'Kurse']
          }
        }
      },
      'Kommunikation & Technik': {
        type: 'ausgabe',
        icon: '📱',
        color: '#ff9800',
        subcategories: {
          'Mobilfunk & Internet': {
            icon: '📞',
            children: ['Handyvertrag', 'Internet', 'Festnetz']
          },
          'Software & Apps': {
            icon: '💻',
            children: ['Software-Lizenzen', 'App-Käufe', 'Cloud-Services']
          },
          'Hardware': {
            icon: '🖥️',
            children: ['Computer', 'Zubehör', 'Reparaturen']
          }
        }
      },
      'Sonstiges': {
        type: 'ausgabe',
        icon: '💸',
        color: '#607d8b',
        subcategories: {
          'Gesundheit': {
            icon: '⚕️',
            children: ['Arztkosten', 'Medikamente', 'Wellness', 'Versicherungen']
          },
          'Bildung': {
            icon: '📚',
            children: ['Kurse', 'Bücher', 'Online-Learning', 'Zertifikate']
          },
          'Verschiedenes': {
            icon: '❓',
            children: ['Geschenke', 'Spenden', 'Gebühren', 'Unbekannt']
          }
        }
      }
    };

    let stats = { mainCategories: 0, subcategories: 0, thirdLevel: 0 };

    // Insert categories level by level
    for (const [mainName, mainData] of Object.entries(categoryStructure)) {
      // Insert main category (Level 1)
      const { rows: mainCatRows } = await sql`
        INSERT INTO kategorien (name, typ, icon, farbe)
        VALUES (${mainName}, ${mainData.type}, ${mainData.icon}, ${mainData.color})
        RETURNING id
      `;
      const mainCategoryId = mainCatRows[0].id;
      stats.mainCategories++;
      console.log(`✅ Level 1: ${mainName} (ID: ${mainCategoryId})`);

      // Insert subcategories (Level 2)
      for (const [subName, subData] of Object.entries(mainData.subcategories)) {
        const { rows: subCatRows } = await sql`
          INSERT INTO kategorien (name, typ, icon, farbe, parent_id)
          VALUES (${subName}, ${mainData.type}, ${subData.icon}, ${mainData.color}, ${mainCategoryId})
          RETURNING id
        `;
        const subCategoryId = subCatRows[0].id;
        stats.subcategories++;
        console.log(`  ✅ Level 2: ${subName} (ID: ${subCategoryId})`);

        // Insert third level categories
        for (const childName of subData.children) {
          const { rows: childRows } = await sql`
            INSERT INTO kategorien (name, typ, icon, farbe, parent_id)
            VALUES (${childName}, ${mainData.type}, ${subData.icon}, ${mainData.color}, ${subCategoryId})
            RETURNING id
          `;
          stats.thirdLevel++;
          console.log(`    ✅ Level 3: ${childName} (ID: ${childRows[0].id})`);
        }
      }
    }

    console.log('Migration completed successfully!');
    res.status(200).json({
      success: true,
      message: '3-level category structure created successfully!',
      stats
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
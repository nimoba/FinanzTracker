import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add parent_id column if it doesn't exist
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

    // Add subcategories
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

      // Gesundheit subcategories
      { name: 'Arztbesuche', parentName: 'Gesundheit', icon: '👨‍⚕️', farbe: '#b91c1c' },
      { name: 'Medikamente', parentName: 'Gesundheit', icon: '💊', farbe: '#b91c1c' },
      { name: 'Fitness', parentName: 'Gesundheit', icon: '🏋️', farbe: '#b91c1c' },

      // Bildung subcategories
      { name: 'Kurse', parentName: 'Bildung', icon: '📖', farbe: '#ff9800' },
      { name: 'Bücher', parentName: 'Bildung', icon: '📚', farbe: '#ff9800' },
      { name: 'Online-Lernen', parentName: 'Bildung', icon: '💻', farbe: '#ff9800' },
    ];

    let addedCount = 0;

    for (const subcat of subcategories) {
      // Find parent category ID
      const { rows: parentRows } = await sql`
        SELECT id, typ FROM kategorien WHERE name = ${subcat.parentName} AND parent_id IS NULL
      `;
      
      if (parentRows.length > 0) {
        const parentId = parentRows[0].id;
        const parentType = parentRows[0].typ;
        
        // Check if subcategory already exists
        const { rows: existingRows } = await sql`
          SELECT id FROM kategorien WHERE name = ${subcat.name} AND parent_id = ${parentId}
        `;

        if (existingRows.length === 0) {
          await sql`
            INSERT INTO kategorien (name, typ, icon, farbe, parent_id)
            VALUES (${subcat.name}, ${parentType}, ${subcat.icon}, ${subcat.farbe}, ${parentId})
          `;
          addedCount++;
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Migration completed successfully. Added ${addedCount} subcategories.`,
      addedCount 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', details: error });
  }
}
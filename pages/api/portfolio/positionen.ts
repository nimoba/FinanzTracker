// pages/api/portfolio/positionen.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { rows: positionen } = await sql`
        SELECT 
          p.*,
          COALESCE(SUM(pt.anzahl * CASE WHEN pt.typ = 'kauf' THEN 1 ELSE -1 END), 0) as gehaltene_anteile,
          COALESCE(SUM(CASE WHEN pt.typ = 'kauf' THEN pt.anzahl * pt.preis + pt.gebuehren 
                           ELSE -1 * pt.anzahl * pt.preis - pt.gebuehren END), 0) as investiert,
          COALESCE(
            SUM(CASE WHEN pt.typ = 'kauf' THEN pt.anzahl * pt.preis + pt.gebuehren ELSE 0 END) /
            NULLIF(SUM(CASE WHEN pt.typ = 'kauf' THEN pt.anzahl ELSE 0 END), 0), 0
          ) as durchschnittspreis
        FROM portfolio_positionen p
        LEFT JOIN portfolio_transaktionen pt ON p.id = pt.position_id
        GROUP BY p.id
        HAVING COALESCE(SUM(pt.anzahl * CASE WHEN pt.typ = 'kauf' THEN 1 ELSE -1 END), 0) > 0
        ORDER BY p.created_at DESC
      `;
      
      res.status(200).json(positionen);
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Positionen' });
    }
  } 
  
  else if (req.method === 'POST') {
    const { symbol, wkn, isin, name, typ, waehrung = 'EUR' } = req.body;
    
    try {
      const { rows } = await sql`
        INSERT INTO portfolio_positionen (symbol, wkn, isin, name, typ, waehrung)
        VALUES (${symbol}, ${wkn}, ${isin}, ${name}, ${typ}, ${waehrung})
        RETURNING *
      `;
      
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Error creating position:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen der Position' });
    }
  }
  
  else if (req.method === 'DELETE') {
    const { id } = req.query;
    
    // WICHTIG: Query-Parameter zu String konvertieren
    const idStr = Array.isArray(id) ? id[0] : id;
    
    if (!idStr) {
      return res.status(400).json({ error: 'ID erforderlich' });
    }
    
    try {
      await sql`DELETE FROM portfolio_positionen WHERE id = ${idStr}`;
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting position:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Position' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
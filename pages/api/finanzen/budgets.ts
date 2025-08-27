import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { monat } = req.query;
      
      if (!monat) {
        return res.status(400).json({ error: 'Monat parameter required' });
      }
      
      const { rows } = await sql`
        SELECT b.*, k.name as kategorie_name, k.icon as kategorie_icon,
               COALESCE(SUM(t.betrag), 0) as ausgegeben
        FROM budgets b
        LEFT JOIN kategorien k ON b.kategorie_id = k.id
        LEFT JOIN transaktionen t ON t.kategorie_id = b.kategorie_id 
          AND t.typ = 'ausgabe' 
          AND DATE_TRUNC('month', t.datum) = DATE_TRUNC('month', b.monat::date)
        WHERE b.monat = ${monat as string}
        GROUP BY b.id, k.name, k.icon
        ORDER BY k.name
      `;
      
      res.status(200).json(rows);
    } else if (req.method === 'POST') {
      const { kategorie_id, betrag, monat } = req.body;
      
      try {
        const { rows } = await sql`
          INSERT INTO budgets (kategorie_id, betrag, monat)
          VALUES (${kategorie_id}, ${betrag}, ${monat})
          RETURNING *
        `;
        res.status(201).json(rows[0]);
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          // Update existing budget
          const { rows } = await sql`
            UPDATE budgets 
            SET betrag = ${betrag}
            WHERE kategorie_id = ${kategorie_id} AND monat = ${monat}
            RETURNING *
          `;
          res.status(200).json(rows[0]);
        } else {
          throw error;
        }
      }
    } else if (req.method === 'DELETE') {
      const { kategorie_id, monat } = req.query;
      
      await sql`
        DELETE FROM budgets 
        WHERE kategorie_id = ${kategorie_id as string} AND monat = ${monat as string}
      `;
      
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
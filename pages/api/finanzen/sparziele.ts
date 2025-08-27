import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM sparziele ORDER BY created_at DESC
      `;
      res.status(200).json(rows);
    } else if (req.method === 'POST') {
      const { name, zielbetrag, aktuell, zieldatum } = req.body;
      const { rows } = await sql`
        INSERT INTO sparziele (name, zielbetrag, aktuell, zieldatum)
        VALUES (${name}, ${zielbetrag}, ${aktuell || 0}, ${zieldatum})
        RETURNING *
      `;
      res.status(201).json(rows[0]);
    } else if (req.method === 'PUT') {
      const { id, name, zielbetrag, aktuell, zieldatum } = req.body;
      const { rows } = await sql`
        UPDATE sparziele 
        SET name = ${name}, zielbetrag = ${zielbetrag}, aktuell = ${aktuell}, zieldatum = ${zieldatum}
        WHERE id = ${id}
        RETURNING *
      `;
      res.status(200).json(rows[0]);
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM sparziele WHERE id = ${id as string}`;
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
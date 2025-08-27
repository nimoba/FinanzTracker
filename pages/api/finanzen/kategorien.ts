import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { typ } = req.query;
      
      let query = 'SELECT * FROM kategorien';
      const params: any[] = [];
      
      if (typ) {
        query += ' WHERE typ = $1';
        params.push(typ);
      }
      
      query += ' ORDER BY name';
      
      const { rows } = params.length > 0 
        ? await sql.query(query, params)
        : await sql`
          SELECT k.*, p.name as parent_name 
          FROM kategorien k 
          LEFT JOIN kategorien p ON k.parent_id = p.id 
          ORDER BY COALESCE(p.name, k.name), k.parent_id NULLS FIRST, k.name
        `;
        
      res.status(200).json(rows);
    } else if (req.method === 'POST') {
      const { name, typ, farbe, icon, parent_id } = req.body;
      const { rows } = await sql`
        INSERT INTO kategorien (name, typ, farbe, icon, parent_id)
        VALUES (${name}, ${typ}, ${farbe || '#36a2eb'}, ${icon || '💰'}, ${parent_id || null})
        RETURNING *
      `;
      res.status(201).json(rows[0]);
    } else if (req.method === 'PUT') {
      const { id, name, typ, farbe, icon, parent_id } = req.body;
      const { rows } = await sql`
        UPDATE kategorien 
        SET name = ${name}, typ = ${typ}, farbe = ${farbe}, icon = ${icon}, parent_id = ${parent_id || null}
        WHERE id = ${id}
        RETURNING *
      `;
      res.status(200).json(rows[0]);
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      // Check if category has transactions
      const { rows: transactions } = await sql`
        SELECT COUNT(*) as count FROM transaktionen WHERE kategorie_id = ${id as string}
      `;
      
      if (parseInt(transactions[0].count) > 0) {
        return res.status(400).json({ error: 'Kategorie hat noch Transaktionen und kann nicht gelöscht werden' });
      }
      
      await sql`DELETE FROM kategorien WHERE id = ${id as string}`;
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
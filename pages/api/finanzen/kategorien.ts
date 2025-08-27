// Fixed Kategorien API - resolves 500 errors

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { typ } = req.query;
      
      let rows;
      if (typ) {
        // Filter by type
        const result = await sql`
          SELECT k.*, p.name as parent_name 
          FROM kategorien k 
          LEFT JOIN kategorien p ON k.parent_id = p.id 
          WHERE k.typ = ${typ as string}
          ORDER BY COALESCE(p.name, k.name), k.parent_id NULLS FIRST, k.name
        `;
        rows = result.rows;
      } else {
        // Get all categories
        const result = await sql`
          SELECT k.*, p.name as parent_name 
          FROM kategorien k 
          LEFT JOIN kategorien p ON k.parent_id = p.id 
          ORDER BY COALESCE(p.name, k.name), k.parent_id NULLS FIRST, k.name
        `;
        rows = result.rows;
      }
        
      res.status(200).json(rows);
    } 
    else if (req.method === 'POST') {
      const { name, typ, farbe, icon, parent_id } = req.body;
      
      if (!name || !typ) {
        return res.status(400).json({ error: 'Name and type are required' });
      }
      
      const { rows } = await sql`
        INSERT INTO kategorien (name, typ, farbe, icon, parent_id)
        VALUES (${name}, ${typ}, ${farbe || '#36a2eb'}, ${icon || '💰'}, ${parent_id || null})
        RETURNING *
      `;
      res.status(201).json(rows[0]);
    } 
    else if (req.method === 'PUT') {
      const { id, name, typ, farbe, icon, parent_id } = req.body;
      
      if (!id || !name || !typ) {
        return res.status(400).json({ error: 'ID, name and type are required' });
      }
      
      const { rows } = await sql`
        UPDATE kategorien 
        SET name = ${name}, typ = ${typ}, farbe = ${farbe}, icon = ${icon}, parent_id = ${parent_id || null}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.status(200).json(rows[0]);
    } 
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }
      
      // Check if category has transactions
      const { rows: transactions } = await sql`
        SELECT COUNT(*) as count FROM transaktionen WHERE kategorie_id = ${id as string}
      `;
      
      if (parseInt(transactions[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Kategorie hat noch Transaktionen und kann nicht gelöscht werden',
          transaction_count: parseInt(transactions[0].count)
        });
      }
      
      // Check if category has subcategories
      const { rows: subcategories } = await sql`
        SELECT COUNT(*) as count FROM kategorien WHERE parent_id = ${id as string}
      `;
      
      if (parseInt(subcategories[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Kategorie hat noch Unterkategorien und kann nicht gelöscht werden',
          subcategory_count: parseInt(subcategories[0].count)
        });
      }
      
      const { rows } = await sql`
        DELETE FROM kategorien WHERE id = ${id as string}
        RETURNING id
      `;
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.status(200).json({ success: true, deleted_id: rows[0].id });
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
// Enhanced Categories API with 3-level support

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { typ, level, parent_id, hierarchical } = req.query;
      
      let rows;
      if (hierarchical === 'true') {
        // Return hierarchical structure
        if (typ) {
          const result = await sql`
            WITH RECURSIVE category_tree AS (
              -- Level 1 categories (root)
              SELECT id, name, typ, farbe, icon, level, parent_id, 
                     name as full_path,
                     ARRAY[id] as path_ids
              FROM kategorien 
              WHERE parent_id IS NULL AND typ = ${typ as string}
              
              UNION ALL
              
              -- Recursive part: children
              SELECT k.id, k.name, k.typ, k.farbe, k.icon, k.level, k.parent_id,
                     ct.full_path || ' > ' || k.name as full_path,
                     ct.path_ids || k.id as path_ids
              FROM kategorien k
              INNER JOIN category_tree ct ON k.parent_id = ct.id
            )
            SELECT * FROM category_tree
            ORDER BY path_ids
          `;
          rows = result.rows;
        } else {
          const result = await sql`
            WITH RECURSIVE category_tree AS (
              -- Level 1 categories (root)
              SELECT id, name, typ, farbe, icon, level, parent_id, 
                     name as full_path,
                     ARRAY[id] as path_ids
              FROM kategorien 
              WHERE parent_id IS NULL
              
              UNION ALL
              
              -- Recursive part: children
              SELECT k.id, k.name, k.typ, k.farbe, k.icon, k.level, k.parent_id,
                     ct.full_path || ' > ' || k.name as full_path,
                     ct.path_ids || k.id as path_ids
              FROM kategorien k
              INNER JOIN category_tree ct ON k.parent_id = ct.id
            )
            SELECT * FROM category_tree
            ORDER BY path_ids
          `;
          rows = result.rows;
        }
      } else if (level) {
        // Filter by level
        if (typ && parent_id) {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            WHERE k.level = ${parseInt(level as string)}
              AND k.typ = ${typ as string}
              AND k.parent_id = ${parseInt(parent_id as string)}
            ORDER BY p2.name NULLS FIRST, p1.name NULLS FIRST, k.name
          `;
          rows = result.rows;
        } else if (typ) {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            WHERE k.level = ${parseInt(level as string)}
              AND k.typ = ${typ as string}
            ORDER BY p2.name NULLS FIRST, p1.name NULLS FIRST, k.name
          `;
          rows = result.rows;
        } else if (parent_id) {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            WHERE k.level = ${parseInt(level as string)}
              AND k.parent_id = ${parseInt(parent_id as string)}
            ORDER BY p2.name NULLS FIRST, p1.name NULLS FIRST, k.name
          `;
          rows = result.rows;
        } else {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            WHERE k.level = ${parseInt(level as string)}
            ORDER BY p2.name NULLS FIRST, p1.name NULLS FIRST, k.name
          `;
          rows = result.rows;
        }
      } else if (parent_id) {
        // Get children of specific parent
        if (typ) {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            WHERE k.parent_id = ${parseInt(parent_id as string)}
              AND k.typ = ${typ as string}
            ORDER BY k.name
          `;
          rows = result.rows;
        } else {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            WHERE k.parent_id = ${parseInt(parent_id as string)}
            ORDER BY k.name
          `;
          rows = result.rows;
        }
      } else {
        // Get all categories with parent info
        if (typ) {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            WHERE k.typ = ${typ as string}
            ORDER BY k.level, p2.name NULLS FIRST, p1.name NULLS FIRST, k.name
          `;
          rows = result.rows;
        } else {
          const result = await sql`
            SELECT k.*, 
                   p1.name as parent_name,
                   p2.name as grandparent_name
            FROM kategorien k 
            LEFT JOIN kategorien p1 ON k.parent_id = p1.id
            LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
            ORDER BY k.level, p2.name NULLS FIRST, p1.name NULLS FIRST, k.name
          `;
          rows = result.rows;
        }
      }
        
      res.status(200).json(rows);
    } 
    else if (req.method === 'POST') {
      const { name, typ, farbe, icon, parent_id, level } = req.body;
      
      if (!name || !typ) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      // Determine level based on parent
      let categoryLevel = 1;
      if (parent_id) {
        const { rows: parentRows } = await sql`
          SELECT level FROM kategorien WHERE id = ${parent_id}
        `;
        if (parentRows.length > 0) {
          categoryLevel = parentRows[0].level + 1;
          if (categoryLevel > 3) {
            return res.status(400).json({ error: 'Maximum 3 levels allowed' });
          }
        }
      }
      
      const { rows } = await sql`
        INSERT INTO kategorien (name, typ, farbe, icon, parent_id, level)
        VALUES (${name}, ${typ}, ${farbe || '#36a2eb'}, ${icon || '💰'}, ${parent_id || null}, ${categoryLevel})
        RETURNING *
      `;
      res.status(201).json(rows[0]);
    } 
    else if (req.method === 'PUT') {
      const { id, name, typ, farbe, icon, parent_id } = req.body;
      
      if (!id || !name || !typ) {
        return res.status(400).json({ error: 'ID, name and type are required' });
      }

      // Determine new level based on parent
      let newLevel = 1;
      if (parent_id) {
        const { rows: parentRows } = await sql`
          SELECT level FROM kategorien WHERE id = ${parent_id}
        `;
        if (parentRows.length > 0) {
          newLevel = parentRows[0].level + 1;
          if (newLevel > 3) {
            return res.status(400).json({ error: 'Maximum 3 levels allowed' });
          }
        }
      }
      
      const { rows } = await sql`
        UPDATE kategorien 
        SET name = ${name}, typ = ${typ}, farbe = ${farbe}, icon = ${icon}, 
            parent_id = ${parent_id || null}, level = ${newLevel}
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
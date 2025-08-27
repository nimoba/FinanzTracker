// Enhanced Kategorien API - supports 3-level hierarchy and tree structure

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

// Helper function to build category tree
function buildCategoryTree(categories: any[]) {
  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // First pass: create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const categoryWithChildren = categoryMap.get(cat.id);
    
    if (cat.parent_id === null) {
      // Root level category
      rootCategories.push(categoryWithChildren);
    } else {
      // Child category - add to parent's children
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    }
  });

  return rootCategories;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { typ, tree, level } = req.query;
      
      let whereClause = '';
      let params: any[] = [];
      
      if (typ) {
        whereClause += ' WHERE k.typ = $1';
        params.push(typ);
      }
      
      if (level) {
        const levelFilter = level === '1' ? 'k.parent_id IS NULL' : 
                           level === '2' ? 'k.parent_id IS NOT NULL AND EXISTS (SELECT 1 FROM kategorien p WHERE p.id = k.parent_id AND p.parent_id IS NULL)' :
                           level === '3' ? 'k.parent_id IS NOT NULL AND EXISTS (SELECT 1 FROM kategorien p WHERE p.id = k.parent_id AND p.parent_id IS NOT NULL)' : '';
        
        if (levelFilter) {
          whereClause += (whereClause ? ' AND ' : ' WHERE ') + levelFilter;
        }
      }
      
      const query = `
        SELECT k.*, p.name as parent_name, 
               CASE 
                 WHEN k.parent_id IS NULL THEN 1
                 WHEN EXISTS (SELECT 1 FROM kategorien gp WHERE gp.id = (SELECT parent_id FROM kategorien WHERE id = k.parent_id) AND gp.parent_id IS NULL) THEN 3
                 ELSE 2
               END as level
        FROM kategorien k 
        LEFT JOIN kategorien p ON k.parent_id = p.id 
        ${whereClause}
        ORDER BY 
          CASE WHEN k.parent_id IS NULL THEN k.name ELSE 
            (SELECT name FROM kategorien WHERE id = 
              (SELECT CASE WHEN p.parent_id IS NULL THEN p.id ELSE p.parent_id END FROM kategorien p WHERE p.id = k.parent_id)
            )
          END,
          CASE WHEN k.parent_id IS NULL THEN 0 ELSE 
            CASE WHEN (SELECT parent_id FROM kategorien WHERE id = k.parent_id) IS NULL THEN 1 ELSE 2 END
          END,
          p.name, k.name
      `;
      
      const result = await sql.query(query, params);
      const rows = result.rows;
      
      // If tree structure is requested, build hierarchy
      if (tree === 'true') {
        const treeData = buildCategoryTree(rows);
        res.status(200).json(treeData);
      } else {
        res.status(200).json(rows);
      }
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
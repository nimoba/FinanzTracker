// Enhanced Kategorien API with 3-Level Support

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

// Helper function to build category hierarchy tree
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
      // Root level category (Level 1)
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
      const { typ, tree = 'false', level, parent_id } = req.query;
      
      let query = `
        SELECT k.*, p.name as parent_name, p.level as parent_level
        FROM kategorien k 
        LEFT JOIN kategorien p ON k.parent_id = p.id 
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (typ) {
        query += ` AND k.typ = $${params.length + 1}`;
        params.push(typ);
      }
      
      if (level) {
        query += ` AND k.level = $${params.length + 1}`;
        params.push(level);
      }
      
      if (parent_id) {
        query += ` AND k.parent_id = $${params.length + 1}`;
        params.push(parent_id);
      }
      
      query += ` ORDER BY k.level, COALESCE(p.name, k.name), k.parent_id NULLS FIRST, k.name`;
      
      const { rows } = await sql.query(query, params);
      
      if (tree === 'true') {
        // Return hierarchical tree structure
        const categoryTree = buildCategoryTree(rows);
        res.status(200).json(categoryTree);
      } else {
        // Return flat list
        res.status(200).json(rows);
      }
    } 
    else if (req.method === 'POST') {
      const { name, typ, farbe, icon, parent_id, level = 1 } = req.body;
      
      if (!name || !typ) {
        return res.status(400).json({ error: 'Name and type are required' });
      }
      
      // Validate level based on parent
      if (parent_id) {
        const { rows: parentRows } = await sql`
          SELECT level FROM kategorien WHERE id = ${parent_id}
        `;
        
        if (parentRows.length === 0) {
          return res.status(400).json({ error: 'Parent category not found' });
        }
        
        const expectedLevel = parentRows[0].level + 1;
        if (level !== expectedLevel) {
          return res.status(400).json({ 
            error: `Invalid level. Expected level ${expectedLevel} for this parent.` 
          });
        }
      }
      
      const { rows } = await sql`
        INSERT INTO kategorien (name, typ, farbe, icon, parent_id, level)
        VALUES (${name}, ${typ}, ${farbe || '#36a2eb'}, ${icon || '💰'}, ${parent_id || null}, ${level})
        RETURNING *
      `;
      res.status(201).json(rows[0]);
    } 
    else if (req.method === 'PUT') {
      const { id, name, typ, farbe, icon, parent_id, level } = req.body;
      
      if (!id || !name || !typ) {
        return res.status(400).json({ error: 'ID, name and type are required' });
      }
      
      // Check if category has children when trying to change it
      const { rows: childrenCheck } = await sql`
        SELECT COUNT(*) as count FROM kategorien WHERE parent_id = ${id}
      `;
      
      if (parseInt(childrenCheck[0].count) > 0 && parent_id !== null) {
        return res.status(400).json({ 
          error: 'Cannot move category that has subcategories' 
        });
      }
      
      const { rows } = await sql`
        UPDATE kategorien 
        SET name = ${name}, typ = ${typ}, farbe = ${farbe}, icon = ${icon}, 
            parent_id = ${parent_id || null}, level = ${level || 1}
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
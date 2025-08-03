import { Request, Response } from 'express';
import { query } from '../config/database';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../shared/types';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM categories ORDER BY type, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

export const createCategory = async (req: Request<{}, Category, CreateCategoryRequest>, res: Response) => {
  try {
    const { name, type, color, icon, parent_id } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const result = await query(
      `INSERT INTO categories (name, type, color, icon, parent_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, type, color || '#3b82f6', icon || 'tag', parent_id || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request<{ id: string }, Category, UpdateCategoryRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, color, icon, parent_id } = req.body;
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (type !== undefined) {
      updateFields.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (parent_id !== undefined) {
      updateFields.push(`parent_id = $${paramCount++}`);
      values.push(parent_id);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE categories SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
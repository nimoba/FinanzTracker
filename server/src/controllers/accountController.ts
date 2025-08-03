import { Request, Response } from 'express';
import { query } from '../config/database';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../../../shared/types';

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM accounts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

export const getAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

export const createAccount = async (req: Request<{}, Account, CreateAccountRequest>, res: Response) => {
  try {
    const { name, type, balance, color, icon } = req.body;
    
    if (!name || !type || balance === undefined) {
      return res.status(400).json({ error: 'Name, type, and balance are required' });
    }
    
    const result = await query(
      `INSERT INTO accounts (name, type, balance, color, icon) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, type, balance, color || '#3b82f6', icon || 'wallet']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const updateAccount = async (req: Request<{ id: string }, Account, UpdateAccountRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, balance, color, icon } = req.body;
    
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
    if (balance !== undefined) {
      updateFields.push(`balance = $${paramCount++}`);
      values.push(balance);
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE accounts SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM accounts WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
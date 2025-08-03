import { Request, Response } from 'express';
import { query } from '../config/database';
import { Goal, CreateGoalRequest, UpdateGoalRequest } from '../../../shared/types';

export const getGoals = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM goals ORDER BY target_date ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const getGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM goals WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
};

export const createGoal = async (req: Request<{}, Goal, CreateGoalRequest>, res: Response) => {
  try {
    const { name, target_amount, current_amount, target_date } = req.body;
    
    if (!name || !target_amount || !target_date) {
      return res.status(400).json({ error: 'Name, target amount, and target date are required' });
    }
    
    const result = await query(
      `INSERT INTO goals (name, target_amount, current_amount, target_date) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, target_amount, current_amount || 0, target_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const updateGoal = async (req: Request<{ id: string }, Goal, UpdateGoalRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const { name, target_amount, current_amount, target_date } = req.body;
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (target_amount !== undefined) {
      updateFields.push(`target_amount = $${paramCount++}`);
      values.push(target_amount);
    }
    if (current_amount !== undefined) {
      updateFields.push(`current_amount = $${paramCount++}`);
      values.push(current_amount);
    }
    if (target_date !== undefined) {
      updateFields.push(`target_date = $${paramCount++}`);
      values.push(target_date);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE goals SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM goals WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

export const updateGoalProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const result = await query(
      `UPDATE goals SET current_amount = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [amount, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ error: 'Failed to update goal progress' });
  }
};
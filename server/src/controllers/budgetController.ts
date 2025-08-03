import { Request, Response } from 'express';
import { query } from '../config/database';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest } from '../../../shared/types';

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT b.*, c.name as category_name, c.type as category_type, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

export const getBudget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT b.*, c.name as category_name, c.type as category_type, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
};

export const createBudget = async (req: Request<{}, Budget, CreateBudgetRequest>, res: Response) => {
  try {
    const { category_id, amount, period, start_date } = req.body;
    
    if (!category_id || !amount || !period || !start_date) {
      return res.status(400).json({ error: 'Category ID, amount, period, and start date are required' });
    }
    
    const result = await query(
      `INSERT INTO budgets (category_id, amount, period, start_date) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [category_id, amount, period, start_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating budget:', error);
    if ((error as any).code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Budget already exists for this category and period' });
    } else {
      res.status(500).json({ error: 'Failed to create budget' });
    }
  }
};

export const updateBudget = async (req: Request<{ id: string }, Budget, UpdateBudgetRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const { category_id, amount, period, start_date } = req.body;
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (amount !== undefined) {
      updateFields.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (period !== undefined) {
      updateFields.push(`period = $${paramCount++}`);
      values.push(period);
    }
    if (start_date !== undefined) {
      updateFields.push(`start_date = $${paramCount++}`);
      values.push(start_date);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE budgets SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM budgets WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

export const getBudgetProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get budget details
    const budgetResult = await query(
      'SELECT * FROM budgets WHERE id = $1',
      [id]
    );
    
    if (budgetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const budget = budgetResult.rows[0];
    
    // Calculate date range based on period
    let startDate = new Date(budget.start_date);
    let endDate = new Date(startDate);
    
    if (budget.period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (budget.period === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // Get total spent in this category during the period
    const spentResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as spent
       FROM transactions 
       WHERE category_id = $1 
       AND type = 'expense'
       AND date >= $2 
       AND date < $3`,
      [budget.category_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );
    
    const spent = parseFloat(spentResult.rows[0].spent);
    const budgetAmount = parseFloat(budget.amount);
    const remaining = budgetAmount - spent;
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    
    res.json({
      spent,
      remaining,
      percentage: Math.min(percentage, 100)
    });
  } catch (error) {
    console.error('Error fetching budget progress:', error);
    res.status(500).json({ error: 'Failed to fetch budget progress' });
  }
};
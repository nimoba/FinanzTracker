import { Request, Response } from 'express';
import { query } from '../config/database';
import { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest, 
  TransactionFilters,
  PaginatedResponse 
} from '../../../shared/types';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const {
      account_id,
      category_id,
      type,
      start_date,
      end_date,
      search,
      page = '1',
      limit = '20'
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 1;

    if (account_id) {
      whereConditions.push(`t.account_id = $${paramCount++}`);
      queryParams.push(parseInt(account_id, 10));
    }
    if (category_id) {
      whereConditions.push(`t.category_id = $${paramCount++}`);
      queryParams.push(parseInt(category_id, 10));
    }
    if (type) {
      whereConditions.push(`t.type = $${paramCount++}`);
      queryParams.push(type);
    }
    if (start_date) {
      whereConditions.push(`t.date >= $${paramCount++}`);
      queryParams.push(start_date);
    }
    if (end_date) {
      whereConditions.push(`t.date <= $${paramCount++}`);
      queryParams.push(end_date);
    }
    if (search) {
      whereConditions.push(`t.description ILIKE $${paramCount++}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM transactions t ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get transactions with account and category info
    const transactionsResult = await query(
      `SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        c.name as category_name,
        c.type as category_type,
        c.color as category_color,
        c.icon as category_icon
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...queryParams, limitNum, offset]
    );

    const totalPages = Math.ceil(total / limitNum);

    const response: PaginatedResponse<Transaction> = {
      data: transactionsResult.rows.map(row => ({
        id: row.id,
        account_id: row.account_id,
        amount: parseFloat(row.amount),
        type: row.type,
        category_id: row.category_id,
        date: row.date,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        account: row.account_name ? {
          id: row.account_id,
          name: row.account_name,
          type: row.account_type,
          balance: 0,
          color: '',
          icon: '',
          created_at: new Date(),
          updated_at: new Date()
        } : undefined,
        category: row.category_name ? {
          id: row.category_id,
          name: row.category_name,
          type: row.category_type,
          color: row.category_color,
          icon: row.category_icon,
          created_at: new Date(),
          updated_at: new Date()
        } : undefined
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT 
        t.*,
        a.name as account_name,
        c.name as category_name
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const createTransaction = async (req: Request<{}, Transaction, CreateTransactionRequest>, res: Response) => {
  try {
    const { account_id, amount, type, category_id, date, description } = req.body;
    
    if (!account_id || !amount || !type || !date || !description) {
      return res.status(400).json({ error: 'Account ID, amount, type, date, and description are required' });
    }
    
    const result = await query(
      `INSERT INTO transactions (account_id, amount, type, category_id, date, description) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [account_id, amount, type, category_id || null, date, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const updateTransaction = async (req: Request<{ id: string }, Transaction, UpdateTransactionRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const { account_id, amount, type, category_id, date, description } = req.body;
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (account_id !== undefined) {
      updateFields.push(`account_id = $${paramCount++}`);
      values.push(account_id);
    }
    if (amount !== undefined) {
      updateFields.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (type !== undefined) {
      updateFields.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (date !== undefined) {
      updateFields.push(`date = $${paramCount++}`);
      values.push(date);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE transactions SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM transactions WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};
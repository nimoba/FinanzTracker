import { Request, Response } from 'express';
import { query } from '../config/database';
import { AnalyticsOverview, SpendingByCategory, CashFlowData } from '../../../shared/types';

export const getOverview = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE date >= $1 AND date <= $2';
      params.push(start_date, end_date);
    }
    
    // Get income and expenses
    const transactionResult = await query(
      `SELECT 
        type,
        COALESCE(SUM(amount), 0) as total
       FROM transactions 
       ${dateFilter}
       GROUP BY type`,
      params
    );
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactionResult.rows.forEach(row => {
      if (row.type === 'income') {
        totalIncome = parseFloat(row.total);
      } else if (row.type === 'expense') {
        totalExpenses = parseFloat(row.total);
      }
    });
    
    // Get account balances
    const accountResult = await query(
      `SELECT name, balance, type FROM accounts ORDER BY balance DESC`
    );
    
    const overview: AnalyticsOverview = {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_income: totalIncome - totalExpenses,
      account_balances: accountResult.rows.map(row => ({
        account_name: row.name,
        balance: parseFloat(row.balance),
        type: row.type
      }))
    };
    
    res.json(overview);
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
};

export const getSpendingByCategory = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND t.date >= $1 AND t.date <= $2';
      params.push(start_date, end_date);
    }
    
    const result = await query(
      `SELECT 
        c.name as category_name,
        COALESCE(SUM(t.amount), 0) as amount
       FROM categories c
       LEFT JOIN transactions t ON c.id = t.category_id AND t.type = 'expense' ${dateFilter}
       WHERE c.type = 'expense'
       GROUP BY c.id, c.name
       HAVING SUM(t.amount) > 0
       ORDER BY SUM(t.amount) DESC`,
      params
    );
    
    const totalSpending = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
    
    const spendingByCategory: SpendingByCategory[] = result.rows.map(row => {
      const amount = parseFloat(row.amount);
      return {
        category_name: row.category_name,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
      };
    });
    
    res.json(spendingByCategory);
  } catch (error) {
    console.error('Error fetching spending by category:', error);
    res.status(500).json({ error: 'Failed to fetch spending by category' });
  }
};

export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, period = 'daily' } = req.query;
    
    let dateFilter = '';
    let groupBy = '';
    let dateFormat = '';
    const params: any[] = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE date >= $1 AND date <= $2';
      params.push(start_date, end_date);
    }
    
    // Set grouping based on period
    switch (period) {
      case 'monthly':
        groupBy = 'DATE_TRUNC(\'month\', date)';
        dateFormat = 'TO_CHAR(DATE_TRUNC(\'month\', date), \'YYYY-MM\')';
        break;
      case 'weekly':
        groupBy = 'DATE_TRUNC(\'week\', date)';
        dateFormat = 'TO_CHAR(DATE_TRUNC(\'week\', date), \'YYYY-MM-DD\')';
        break;
      default: // daily
        groupBy = 'date';
        dateFormat = 'TO_CHAR(date, \'YYYY-MM-DD\')';
    }
    
    const result = await query(
      `SELECT 
        ${dateFormat} as date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
       FROM transactions 
       ${dateFilter}
       GROUP BY ${groupBy}
       ORDER BY ${groupBy}`,
      params
    );
    
    const cashFlow: CashFlowData[] = result.rows.map(row => ({
      date: row.date,
      income: parseFloat(row.income),
      expenses: parseFloat(row.expenses),
      net: parseFloat(row.income) - parseFloat(row.expenses)
    }));
    
    res.json(cashFlow);
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow' });
  }
};
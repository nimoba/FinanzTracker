import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get all portfolios with holdings summary
      const { rows: portfolios } = await sql`
        SELECT 
          p.*,
          COUNT(h.id) as holdings_count,
          COALESCE(SUM(h.total_quantity * h.current_price), 0) as total_value,
          COALESCE(SUM(h.total_quantity * h.avg_purchase_price), 0) as total_cost
        FROM portfolios p
        LEFT JOIN holdings h ON p.id = h.portfolio_id
        WHERE p.user_id = 1
        GROUP BY p.id, p.name, p.description, p.created_at
        ORDER BY p.created_at DESC
      `;

      // Calculate P&L for each portfolio
      const portfoliosWithPnL = portfolios.map(portfolio => ({
        ...portfolio,
        unrealized_pnl: parseFloat(portfolio.total_value) - parseFloat(portfolio.total_cost),
        unrealized_pnl_percent: parseFloat(portfolio.total_cost) > 0 ? 
          ((parseFloat(portfolio.total_value) - parseFloat(portfolio.total_cost)) / parseFloat(portfolio.total_cost)) * 100 : 0
      }));

      res.status(200).json(portfoliosWithPnL);

    } else if (req.method === 'POST') {
      // Create new portfolio
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Portfolio name is required' });
      }

      const { rows } = await sql`
        INSERT INTO portfolios (name, description, user_id)
        VALUES (${name}, ${description || ''}, 1)
        RETURNING *
      `;

      res.status(201).json(rows[0]);

    } else if (req.method === 'PUT') {
      // Update portfolio
      const { id, name, description } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: 'Portfolio ID and name are required' });
      }

      const { rows } = await sql`
        UPDATE portfolios 
        SET name = ${name}, description = ${description || ''}
        WHERE id = ${id} AND user_id = 1
        RETURNING *
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      res.status(200).json(rows[0]);

    } else if (req.method === 'DELETE') {
      // Delete portfolio
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Portfolio ID is required' });
      }

      // Check if portfolio has holdings
      const { rows: holdings } = await sql`
        SELECT COUNT(*) as count FROM holdings WHERE portfolio_id = ${id as string}
      `;

      if (parseInt(holdings[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete portfolio with holdings. Please remove all holdings first.' 
        });
      }

      const { rows } = await sql`
        DELETE FROM portfolios 
        WHERE id = ${id as string} AND user_id = 1
        RETURNING *
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      res.status(200).json({ success: true, deletedPortfolio: rows[0] });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Portfolio API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
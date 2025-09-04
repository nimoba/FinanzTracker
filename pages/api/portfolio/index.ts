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
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      // Calculate P&L for each portfolio
      const portfoliosWithPnL = portfolios.map(portfolio => ({
        ...portfolio,
        unrealized_pnl: portfolio.total_value - portfolio.total_cost,
        unrealized_pnl_percent: portfolio.total_cost > 0 ? 
          ((portfolio.total_value - portfolio.total_cost) / portfolio.total_cost) * 100 : 0
      }));

      res.status(200).json(portfoliosWithPnL);

    } else if (req.method === 'POST') {
      // Create new portfolio
      const { name, description } = req.body;
      
      const { rows } = await sql`
        INSERT INTO portfolios (name, description, user_id)
        VALUES (${name}, ${description || ''}, 1)
        RETURNING *
      `;

      res.status(201).json(rows[0]);

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
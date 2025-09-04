import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { portfolio_id } = req.query;

      let query = portfolio_id
        ? `SELECT h.*, 
            (h.total_quantity * h.current_price) as current_value,
            (h.total_quantity * h.avg_purchase_price) as total_cost,
            (h.total_quantity * h.current_price) - (h.total_quantity * h.avg_purchase_price) as unrealized_pnl,
            CASE WHEN h.avg_purchase_price > 0 THEN 
              (((h.current_price - h.avg_purchase_price) / h.avg_purchase_price) * 100)
            ELSE 0 END as unrealized_pnl_percent
          FROM holdings h
          WHERE h.portfolio_id = $1
          ORDER BY h.current_value DESC`
        : `SELECT h.*, 
            (h.total_quantity * h.current_price) as current_value,
            (h.total_quantity * h.avg_purchase_price) as total_cost,
            (h.total_quantity * h.current_price) - (h.total_quantity * h.avg_purchase_price) as unrealized_pnl,
            CASE WHEN h.avg_purchase_price > 0 THEN 
              (((h.current_price - h.avg_purchase_price) / h.avg_purchase_price) * 100)
            ELSE 0 END as unrealized_pnl_percent
          FROM holdings h
          JOIN portfolios p ON h.portfolio_id = p.id
          WHERE p.user_id = 1
          ORDER BY h.current_value DESC`;

      const params = portfolio_id ? [portfolio_id] : [];
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);

    } else if (req.method === 'POST') {
      // Add new holding
      const { 
        portfolio_id, 
        symbol, 
        name, 
        quantity, 
        price, 
        fees, 
        date, 
        note 
      } = req.body;

      await sql`BEGIN`;

      try {
        // Check if holding exists
        const { rows: existing } = await sql`
          SELECT * FROM holdings 
          WHERE portfolio_id = ${portfolio_id} AND symbol = ${symbol.toUpperCase()}
        `;

        let holdingId;
        if (existing.length > 0) {
          // Update existing holding
          const newQuantity = existing[0].total_quantity + quantity;
          const totalCost = (existing[0].total_quantity * existing[0].avg_purchase_price) + 
                          (quantity * price) + fees;
          const newAvgPrice = totalCost / newQuantity;

          await sql`
            UPDATE holdings 
            SET total_quantity = ${newQuantity}, avg_purchase_price = ${newAvgPrice}
            WHERE id = ${existing[0].id}
          `;
          holdingId = existing[0].id;
        } else {
          // Create new holding
          const { rows: newHolding } = await sql`
            INSERT INTO holdings (
              portfolio_id, symbol, name, total_quantity, 
              avg_purchase_price, current_price
            )
            VALUES (
              ${portfolio_id}, ${symbol.toUpperCase()}, ${name}, 
              ${quantity}, ${price}, ${price}
            )
            RETURNING id
          `;
          holdingId = newHolding[0].id;
        }

        // Record transaction
        await sql`
          INSERT INTO stock_transactions (
            holding_id, type, quantity, price, fees, date, note
          )
          VALUES (
            ${holdingId}, 'buy', ${quantity}, ${price}, ${fees || 0}, ${date}, ${note || ''}
          )
        `;

        await sql`COMMIT`;
        res.status(201).json({ success: true });

      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Holdings API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
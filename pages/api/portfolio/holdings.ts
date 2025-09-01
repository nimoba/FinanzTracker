import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { portfolio_id } = req.query;

      let query;
      let params: any[] = [];

      if (portfolio_id) {
        // Get holdings for specific portfolio
        query = `
          SELECT 
            h.*,
            p.name as portfolio_name,
            (h.total_quantity * h.current_price) as current_value,
            (h.total_quantity * h.avg_purchase_price) as total_cost,
            (h.total_quantity * h.current_price) - (h.total_quantity * h.avg_purchase_price) as unrealized_pnl,
            CASE 
              WHEN h.avg_purchase_price > 0 THEN 
                (((h.current_price - h.avg_purchase_price) / h.avg_purchase_price) * 100)
              ELSE 0 
            END as unrealized_pnl_percent
          FROM holdings h
          JOIN portfolios p ON h.portfolio_id = p.id
          WHERE h.portfolio_id = $1
          ORDER BY h.current_value DESC
        `;
        params = [portfolio_id];
      } else {
        // Get all holdings across portfolios
        query = `
          SELECT 
            h.*,
            p.name as portfolio_name,
            (h.total_quantity * h.current_price) as current_value,
            (h.total_quantity * h.avg_purchase_price) as total_cost,
            (h.total_quantity * h.current_price) - (h.total_quantity * h.avg_purchase_price) as unrealized_pnl,
            CASE 
              WHEN h.avg_purchase_price > 0 THEN 
                (((h.current_price - h.avg_purchase_price) / h.avg_purchase_price) * 100)
              ELSE 0 
            END as unrealized_pnl_percent
          FROM holdings h
          JOIN portfolios p ON h.portfolio_id = p.id
          WHERE p.user_id = 1
          ORDER BY h.current_value DESC
        `;
      }

      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);

    } else if (req.method === 'POST') {
      // Add new holding or buy more shares
      const { 
        portfolio_id, 
        symbol, 
        name, 
        quantity, 
        price, 
        fees = 0, 
        date, 
        note,
        type = 'buy' 
      } = req.body;

      if (!portfolio_id || !symbol || !quantity || !price || !date) {
        return res.status(400).json({ 
          error: 'Portfolio ID, symbol, quantity, price, and date are required' 
        });
      }

      await sql`BEGIN`;

      try {
        // Check if holding already exists
        const { rows: existingHoldings } = await sql`
          SELECT * FROM holdings 
          WHERE portfolio_id = ${portfolio_id} AND symbol = ${symbol.toUpperCase()}
        `;

        let holdingId;
        let newQuantity = parseFloat(quantity);
        let newAvgPrice = parseFloat(price);

        if (existingHoldings.length > 0) {
          // Update existing holding
          const holding = existingHoldings[0];
          const currentQuantity = parseFloat(holding.total_quantity);
          const currentAvgPrice = parseFloat(holding.avg_purchase_price);

          if (type === 'buy') {
            // Calculate new average price
            const totalCost = (currentQuantity * currentAvgPrice) + (newQuantity * newAvgPrice) + parseFloat(fees);
            newQuantity = currentQuantity + newQuantity;
            newAvgPrice = totalCost / newQuantity;
          } else if (type === 'sell') {
            newQuantity = currentQuantity - newQuantity;
            newAvgPrice = currentAvgPrice; // Keep same avg price for remaining shares
            
            if (newQuantity < 0) {
              throw new Error('Cannot sell more shares than owned');
            }
          }

          // Update holding
          await sql`
            UPDATE holdings 
            SET 
              total_quantity = ${newQuantity},
              avg_purchase_price = ${newAvgPrice},
              name = ${name || holding.name},
              last_updated = NOW()
            WHERE id = ${holding.id}
          `;
          holdingId = holding.id;

        } else {
          if (type === 'sell') {
            return res.status(400).json({ error: 'Cannot sell shares you do not own' });
          }

          // Create new holding
          const { rows: newHoldings } = await sql`
            INSERT INTO holdings (
              portfolio_id, symbol, name, total_quantity, 
              avg_purchase_price, current_price
            )
            VALUES (
              ${portfolio_id}, ${symbol.toUpperCase()}, ${name}, 
              ${newQuantity}, ${newAvgPrice}, ${price}
            )
            RETURNING *
          `;
          holdingId = newHoldings[0].id;
        }

        // Record the transaction
        await sql`
          INSERT INTO stock_transactions (
            holding_id, type, quantity, price, fees, date, note
          )
          VALUES (
            ${holdingId}, ${type}, ${Math.abs(parseFloat(quantity))}, 
            ${price}, ${fees}, ${date}, ${note || ''}
          )
        `;

        await sql`COMMIT`;

        // Return updated holding
        const { rows: updatedHolding } = await sql`
          SELECT 
            h.*,
            (h.total_quantity * h.current_price) as current_value,
            (h.total_quantity * h.avg_purchase_price) as total_cost
          FROM holdings h
          WHERE h.id = ${holdingId}
        `;

        res.status(201).json(updatedHolding[0]);

      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }

    } else if (req.method === 'DELETE') {
      // Remove holding completely
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Holding ID is required' });
      }

      await sql`BEGIN`;

      try {
        // Delete all transactions first
        await sql`
          DELETE FROM stock_transactions WHERE holding_id = ${id as string}
        `;

        // Delete the holding
        const { rows } = await sql`
          DELETE FROM holdings WHERE id = ${id as string}
          RETURNING *
        `;

        if (rows.length === 0) {
          return res.status(404).json({ error: 'Holding not found' });
        }

        await sql`COMMIT`;
        res.status(200).json({ success: true, deletedHolding: rows[0] });

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
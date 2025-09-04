import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Find all pending transactions where auto_confirm_date has passed
    const { rows: expiredTransactions } = await sql`
      SELECT * FROM transaktionen 
      WHERE status = 'pending' 
        AND auto_confirm_date IS NOT NULL 
        AND auto_confirm_date <= CURRENT_DATE
    `;

    let confirmedCount = 0;
    
    for (const transaction of expiredTransactions) {
      try {
        // Update transaction status to confirmed
        await sql`
          UPDATE transaktionen 
          SET 
            status = 'confirmed',
            betrag = ${transaction.pending_amount || transaction.betrag},
            auto_confirm_date = NULL
          WHERE id = ${transaction.id}
        `;

        // Record in history
        await sql`
          INSERT INTO transaction_status_history (transaction_id, status, amount, note)
          VALUES (${transaction.id}, 'auto_confirmed', ${transaction.pending_amount || transaction.betrag}, 'Automatically confirmed after auto-confirm date')
        `;

        // Update account balance
        const amount = parseFloat(transaction.pending_amount || transaction.betrag);
        const balanceChange = transaction.typ === 'einnahme' ? amount : -amount;
        
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${balanceChange}
          WHERE id = ${transaction.konto_id}
        `;

        confirmedCount++;
      } catch (error) {
        console.error(`Error confirming transaction ${transaction.id}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully auto-confirmed ${confirmedCount} transactions`,
      confirmedCount
    });

  } catch (error) {
    console.error('Error in auto-confirm:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
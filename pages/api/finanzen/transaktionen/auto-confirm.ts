import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Find all pending transactions where auto_confirm_date has passed
    const { rows: expiredTransactions } = await sql`
      SELECT id, beschreibung, betrag, auto_confirm_date, konto_id, pending_amount
      FROM transaktionen 
      WHERE status = 'pending' 
        AND auto_confirm_date IS NOT NULL 
        AND auto_confirm_date <= CURRENT_DATE
    `;

    if (expiredTransactions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No transactions to auto-confirm',
        confirmedCount: 0
      });
    }

    let confirmedCount = 0;
    const confirmedTransactions = [];

    for (const transaction of expiredTransactions) {
      try {
        // Update transaction status to confirmed
        await sql`
          UPDATE transaktionen 
          SET 
            status = 'confirmed',
            betrag = ${transaction.pending_amount || transaction.betrag}, -- Ensure betrag reflects the pending amount
            auto_confirm_date = NULL -- Clear the auto-confirm date
          WHERE id = ${transaction.id}
        `;

        // Record in status history
        await sql`
          INSERT INTO transaction_status_history (transaction_id, status, amount, note)
          VALUES (
            ${transaction.id}, 
            'auto_confirmed', 
            ${transaction.pending_amount || transaction.betrag},
            'Automatically confirmed after auto-confirm date'
          )
        `;

        // Update account balance (subtract for expenses, add for income)
        // Note: This assumes the pending amount wasn't already affecting the balance
        // You may need to adjust this based on your balance calculation logic
        const amount = parseFloat(transaction.pending_amount || transaction.betrag);
        
        // Get transaction type to determine if we add or subtract
        const { rows: transactionDetails } = await sql`
          SELECT typ FROM transaktionen WHERE id = ${transaction.id}
        `;
        
        if (transactionDetails.length > 0) {
          const typ = transactionDetails[0].typ;
          const balanceChange = typ === 'einnahme' ? amount : -amount;
          
          await sql`
            UPDATE konten 
            SET saldo = saldo + ${balanceChange}
            WHERE id = ${transaction.konto_id}
          `;
        }

        confirmedCount++;
        confirmedTransactions.push({
          id: transaction.id,
          beschreibung: transaction.beschreibung,
          betrag: amount
        });

      } catch (error) {
        console.error(`Error confirming transaction ${transaction.id}:`, error);
        // Continue with other transactions even if one fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully auto-confirmed ${confirmedCount} transactions`,
      confirmedCount,
      confirmedTransactions,
      details: {
        totalFound: expiredTransactions.length,
        successfullyConfirmed: confirmedCount,
        failedConfirmations: expiredTransactions.length - confirmedCount
      }
    });

  } catch (error) {
    console.error('Error in auto-confirm:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
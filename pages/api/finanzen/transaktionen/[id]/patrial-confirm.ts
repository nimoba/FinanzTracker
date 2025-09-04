import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { confirmAmount, note } = req.body;

  if (!id || !confirmAmount || confirmAmount <= 0) {
    return res.status(400).json({ error: 'Transaction ID and valid confirm amount required' });
  }

  try {
    // Get current transaction details
    const { rows: transactions } = await sql`
      SELECT * FROM transaktionen WHERE id = ${id as string}
    `;

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Only allow partial confirmation for pending transactions
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending transactions can be partially confirmed' });
    }

    const currentPendingAmount = parseFloat(transaction.pending_amount || transaction.betrag);
    const currentCancelledAmount = parseFloat(transaction.cancelled_amount || '0');
    const remainingPendingAmount = currentPendingAmount - currentCancelledAmount;
    
    if (parseFloat(confirmAmount) > remainingPendingAmount) {
      return res.status(400).json({ 
        error: `Confirm amount exceeds remaining pending amount of ${remainingPendingAmount}` 
      });
    }

    const newPendingAmount = remainingPendingAmount - parseFloat(confirmAmount);
    
    // Determine new status
    let newStatus = 'pending';
    if (newPendingAmount <= 0.01) { // Account for floating point precision
      newStatus = 'confirmed';
    }

    // Update transaction
    await sql`
      UPDATE transaktionen 
      SET 
        pending_amount = ${newPendingAmount},
        status = ${newStatus}
      WHERE id = ${id as string}
    `;

    // Update account balance with the confirmed amount
    const balanceChange = transaction.typ === 'einnahme' 
      ? parseFloat(confirmAmount) 
      : -parseFloat(confirmAmount);
    
    await sql`
      UPDATE konten 
      SET saldo = saldo + ${balanceChange}
      WHERE id = ${transaction.konto_id}
    `;

    // Record in history
    await sql`
      INSERT INTO transaction_status_history (transaction_id, status, amount, note)
      VALUES (${id as string}, 'partial_confirm', ${parseFloat(confirmAmount)}, ${note || ''})
    `;

    // Get updated transaction
    const { rows: updatedTransactions } = await sql`
      SELECT * FROM transaktionen WHERE id = ${id as string}
    `;

    res.status(200).json({
      success: true,
      message: `Successfully confirmed ${confirmAmount}€ from transaction`,
      transaction: updatedTransactions[0],
      details: {
        confirmedAmount: parseFloat(confirmAmount),
        remainingAmount: newPendingAmount,
        newStatus,
        fullyCompleted: newStatus === 'confirmed'
      }
    });

  } catch (error) {
    console.error('Error confirming transaction:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
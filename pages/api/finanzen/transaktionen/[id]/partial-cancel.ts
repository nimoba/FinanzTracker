import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { cancelAmount, note } = req.body;

  if (!id || !cancelAmount || cancelAmount <= 0) {
    return res.status(400).json({ error: 'Transaction ID and valid cancel amount required' });
  }

  try {
    // Get current transaction
    const { rows: transactions } = await sql`
      SELECT * FROM transaktionen WHERE id = ${id as string}
    `;

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Only allow partial cancellation for pending transactions
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending transactions can be partially cancelled' });
    }

    const currentPendingAmount = parseFloat(transaction.pending_amount || transaction.betrag);
    const currentCancelledAmount = parseFloat(transaction.cancelled_amount || '0');
    const maxCancellable = currentPendingAmount - currentCancelledAmount;

    if (parseFloat(cancelAmount) > maxCancellable) {
      return res.status(400).json({ 
        error: `Cancel amount exceeds maximum cancellable amount of ${maxCancellable}` 
      });
    }

    const newCancelledAmount = currentCancelledAmount + parseFloat(cancelAmount);
    const newPendingAmount = currentPendingAmount - parseFloat(cancelAmount);
    
    // Determine new status
    let newStatus = 'pending';
    if (newPendingAmount <= 0.01) { // Account for floating point precision
      newStatus = 'cancelled';
    }

    // Update transaction
    await sql`
      UPDATE transaktionen 
      SET 
        cancelled_amount = ${newCancelledAmount},
        pending_amount = ${newPendingAmount},
        status = ${newStatus},
        betrag = ${newPendingAmount}
      WHERE id = ${id as string}
    `;

    // Record in history
    await sql`
      INSERT INTO transaction_status_history (transaction_id, status, amount, note)
      VALUES (${id as string}, 'partial_cancel', ${parseFloat(cancelAmount)}, ${note || ''})
    `;

    res.status(200).json({
      success: true,
      message: `Successfully cancelled ${cancelAmount}€ from transaction`,
      details: {
        cancelledAmount: newCancelledAmount,
        remainingAmount: newPendingAmount,
        newStatus
      }
    });

  } catch (error) {
    console.error('Error cancelling transaction:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
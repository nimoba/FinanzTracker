import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {\n      // Get all transfers with linked transaction details
      const { limit = '50', offset = '0' } = req.query;
      
      const { rows } = await sql`
        SELECT 
          t1.id as from_transaction_id,
          t1.konto_id as from_account_id,
          k1.name as from_account_name,
          t1.betrag as amount,
          t1.datum as date,
          t1.beschreibung as description,
          t2.id as to_transaction_id,
          t2.konto_id as to_account_id,
          k2.name as to_account_name,
          t1.created_at
        FROM transaktionen t1
        JOIN transaktionen t2 ON t1.transfer_id = t2.id
        JOIN konten k1 ON t1.konto_id = k1.id
        JOIN konten k2 ON t2.konto_id = k2.id
        WHERE t1.typ = 'transfer_out' AND t2.typ = 'transfer_in'
        ORDER BY t1.datum DESC, t1.created_at DESC
        LIMIT ${parseInt(limit as string)} OFFSET ${parseInt(offset as string)}
      `;
      
      res.status(200).json(rows);
    } 
    else if (req.method === 'POST') {
      const { from_account_id, to_account_id, amount, date, description } = req.body;
      
      if (!from_account_id || !to_account_id || !amount || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (from_account_id === to_account_id) {
        return res.status(400).json({ error: 'Cannot transfer to the same account' });
      }
      
      const numericAmount = parseFloat(amount);
      if (numericAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }
      
      await sql`BEGIN`;
      
      try {
        // Create the outgoing transfer transaction
        const { rows: outgoingRows } = await sql`
          INSERT INTO transaktionen (konto_id, betrag, typ, datum, beschreibung)
          VALUES (${from_account_id}, ${numericAmount}, 'transfer_out', ${date}, ${description || 'Transfer'})
          RETURNING id
        `;
        const outgoingId = outgoingRows[0].id;
        
        // Create the incoming transfer transaction
        const { rows: incomingRows } = await sql`
          INSERT INTO transaktionen (konto_id, betrag, typ, datum, beschreibung, transfer_id)
          VALUES (${to_account_id}, ${numericAmount}, 'transfer_in', ${date}, ${description || 'Transfer'}, ${outgoingId})
          RETURNING id
        `;
        const incomingId = incomingRows[0].id;
        
        // Link the transactions together
        await sql`
          UPDATE transaktionen 
          SET transfer_id = ${incomingId}
          WHERE id = ${outgoingId}
        `;
        
        // Update account balances
        await sql`
          UPDATE konten 
          SET saldo = saldo - ${numericAmount}
          WHERE id = ${from_account_id}
        `;
        
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${numericAmount}
          WHERE id = ${to_account_id}
        `;
        
        await sql`COMMIT`;
        
        // Return the transfer details
        const { rows: transferDetails } = await sql`
          SELECT 
            t1.id as from_transaction_id,
            t1.konto_id as from_account_id,
            k1.name as from_account_name,
            t1.betrag as amount,
            t1.datum as date,
            t1.beschreibung as description,
            t2.id as to_transaction_id,
            t2.konto_id as to_account_id,
            k2.name as to_account_name
          FROM transaktionen t1
          JOIN transaktionen t2 ON t1.transfer_id = t2.id
          JOIN konten k1 ON t1.konto_id = k1.id
          JOIN konten k2 ON t2.konto_id = k2.id
          WHERE t1.id = ${outgoingId}
        `;
        
        res.status(201).json(transferDetails[0]);
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } 
    else if (req.method === 'DELETE') {
      const { id } = req.query; // This should be the outgoing transaction ID
      
      await sql`BEGIN`;
      
      try {
        // Get the transfer details
        const { rows: transferRows } = await sql`
          SELECT t1.*, t2.id as linked_id, t2.konto_id as to_account_id
          FROM transaktionen t1
          LEFT JOIN transaktionen t2 ON t1.transfer_id = t2.id
          WHERE t1.id = ${id as string} AND t1.typ = 'transfer_out'
        `;
        
        if (transferRows.length === 0) {
          await sql`ROLLBACK`;
          return res.status(404).json({ error: 'Transfer not found' });
        }
        
        const transfer = transferRows[0];
        
        // Reverse the balance changes
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${transfer.betrag}
          WHERE id = ${transfer.konto_id}
        `;
        
        if (transfer.to_account_id) {
          await sql`
            UPDATE konten 
            SET saldo = saldo - ${transfer.betrag}
            WHERE id = ${transfer.to_account_id}
          `;
        }
        
        // Delete both transactions
        await sql`DELETE FROM transaktionen WHERE id = ${id as string}`;
        if (transfer.linked_id) {
          await sql`DELETE FROM transaktionen WHERE id = ${transfer.linked_id}`;
        }
        
        await sql`COMMIT`;
        res.status(200).json({ success: true });
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Transfer API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
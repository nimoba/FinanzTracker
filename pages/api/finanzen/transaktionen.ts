// Enhanced Transactions API with Transfer Support

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
// Simple UUID generator function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { limit = '50', offset = '0', konto_id, kategorie_id, typ, from, to, exclude_transfers = 'false' } = req.query;
      
      let query = `
        SELECT t.*, 
               k.name as konto_name, 
               kat.name as kategorie_name, 
               kat.icon as kategorie_icon,
               zk.name as ziel_konto_name,
               CASE WHEN t.transfer_id IS NOT NULL THEN true ELSE false END as is_transfer
        FROM transaktionen t
        LEFT JOIN konten k ON t.konto_id = k.id
        LEFT JOIN kategorien kat ON t.kategorie_id = kat.id
        LEFT JOIN konten zk ON t.ziel_konto_id = zk.id
        WHERE 1=1
      `;
      
      // Exclude transfers from overall analysis if requested
      if (exclude_transfers === 'true') {
        query += ` AND t.transfer_id IS NULL`;
      }
      
      const params: any[] = [];
      
      if (konto_id) {
        query += ` AND t.konto_id = $${params.length + 1}`;
        params.push(konto_id);
      }
      
      if (kategorie_id) {
        query += ` AND t.kategorie_id = $${params.length + 1}`;
        params.push(kategorie_id);
      }
      
      if (typ && typ !== 'transfer') {
        query += ` AND t.typ = $${params.length + 1}`;
        params.push(typ);
      }
      
      if (from) {
        query += ` AND t.datum >= $${params.length + 1}`;
        params.push(from);
      }
      
      if (to) {
        query += ` AND t.datum <= $${params.length + 1}`;
        params.push(to);
      }
      
      query += ` ORDER BY t.datum DESC, t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);
    } 
    else if (req.method === 'POST') {
      const { 
        konto_id, 
        betrag, 
        typ, 
        kategorie_id, 
        datum, 
        beschreibung,
        // Transfer specific fields
        ziel_konto_id,
        is_transfer = false
      } = req.body;
      
      // Validate required fields
      if (!konto_id || !betrag || !typ || !datum) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await sql`BEGIN`;
      
      try {
        if (is_transfer && ziel_konto_id) {
          // Handle transfer between accounts
          if (konto_id === ziel_konto_id) {
            await sql`ROLLBACK`;
            return res.status(400).json({ error: 'Source and destination account cannot be the same' });
          }

          const transferId = generateUUID();
          const transferAmount = Math.abs(parseFloat(betrag));
          
          // Create outgoing transaction (negative amount from source account)
          const { rows: outgoingTransaction } = await sql`
            INSERT INTO transaktionen (konto_id, betrag, typ, datum, beschreibung, transfer_id, ziel_konto_id)
            VALUES (${konto_id}, ${-transferAmount}, 'transfer', ${datum}, ${beschreibung || 'Transfer'}, ${transferId}, ${ziel_konto_id})
            RETURNING *
          `;
          
          // Create incoming transaction (positive amount to destination account)
          const { rows: incomingTransaction } = await sql`
            INSERT INTO transaktionen (konto_id, betrag, typ, datum, beschreibung, transfer_id, ziel_konto_id)
            VALUES (${ziel_konto_id}, ${transferAmount}, 'transfer', ${datum}, ${beschreibung || 'Transfer'}, ${transferId}, ${konto_id})
            RETURNING *
          `;
          
          // Update account balances
          await sql`
            UPDATE konten 
            SET saldo = saldo - ${transferAmount}
            WHERE id = ${konto_id}
          `;
          
          await sql`
            UPDATE konten 
            SET saldo = saldo + ${transferAmount}
            WHERE id = ${ziel_konto_id}
          `;
          
          await sql`COMMIT`;
          
          res.status(201).json({
            success: true,
            message: 'Transfer completed successfully',
            transfer_id: transferId,
            outgoing: outgoingTransaction[0],
            incoming: incomingTransaction[0]
          });
        } else {
          // Handle regular transaction
          const { rows } = await sql`
            INSERT INTO transaktionen (konto_id, betrag, typ, kategorie_id, datum, beschreibung)
            VALUES (${konto_id}, ${betrag}, ${typ}, ${kategorie_id || null}, ${datum}, ${beschreibung || ''})
            RETURNING *
          `;
          
          // Update account balance
          const betragDelta = typ === 'einnahme' ? parseFloat(betrag) : -parseFloat(betrag);
          await sql`
            UPDATE konten 
            SET saldo = saldo + ${betragDelta}
            WHERE id = ${konto_id}
          `;
          
          await sql`COMMIT`;
          res.status(201).json(rows[0]);
        }
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } 
    else if (req.method === 'PUT') {
      const { id, konto_id, betrag, typ, kategorie_id, datum, beschreibung } = req.body;
      
      await sql`BEGIN`;
      
      try {
        // Get old transaction to check if it's a transfer
        const { rows: oldTransaction } = await sql`
          SELECT * FROM transaktionen WHERE id = ${id}
        `;
        
        if (oldTransaction.length === 0) {
          await sql`ROLLBACK`;
          return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const old = oldTransaction[0];
        
        // Don't allow editing transfers through regular update
        if (old.transfer_id) {
          await sql`ROLLBACK`;
          return res.status(400).json({ error: 'Cannot edit transfer transactions. Delete and recreate instead.' });
        }
        
        // Reverse old balance change
        const oldBetragDelta = old.typ === 'einnahme' ? -parseFloat(old.betrag) : parseFloat(old.betrag);
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${oldBetragDelta}
          WHERE id = ${old.konto_id}
        `;
        
        // Update transaction
        const { rows } = await sql`
          UPDATE transaktionen 
          SET konto_id = ${konto_id}, betrag = ${betrag}, typ = ${typ}, 
              kategorie_id = ${kategorie_id || null}, datum = ${datum}, beschreibung = ${beschreibung}
          WHERE id = ${id}
          RETURNING *
        `;
        
        // Apply new balance change
        const newBetragDelta = typ === 'einnahme' ? parseFloat(betrag) : -parseFloat(betrag);
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${newBetragDelta}
          WHERE id = ${konto_id}
        `;
        
        await sql`COMMIT`;
        res.status(200).json(rows[0]);
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } 
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      await sql`BEGIN`;
      
      try {
        // Get transaction to reverse balance change and check for transfers
        const { rows: transaction } = await sql`
          SELECT * FROM transaktionen WHERE id = ${id as string}
        `;
        
        if (transaction.length === 0) {
          await sql`ROLLBACK`;
          return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const t = transaction[0];
        
        if (t.transfer_id) {
          // This is a transfer - need to delete both transactions and reverse both balances
          const { rows: transferPair } = await sql`
            SELECT * FROM transaktionen WHERE transfer_id = ${t.transfer_id}
          `;
          
          for (const transferTransaction of transferPair) {
            // Reverse balance change for each account
            const balanceDelta = transferTransaction.typ === 'transfer' ? 
              -parseFloat(transferTransaction.betrag) : 0;
            
            await sql`
              UPDATE konten 
              SET saldo = saldo + ${balanceDelta}
              WHERE id = ${transferTransaction.konto_id}
            `;
          }
          
          // Delete all transactions with this transfer_id
          await sql`DELETE FROM transaktionen WHERE transfer_id = ${t.transfer_id}`;
          
          await sql`COMMIT`;
          res.status(200).json({ 
            success: true, 
            message: 'Transfer deleted successfully',
            deleted_transactions: transferPair.length
          });
        } else {
          // Regular transaction
          const betragDelta = t.typ === 'einnahme' ? -parseFloat(t.betrag) : parseFloat(t.betrag);
          await sql`
            UPDATE konten 
            SET saldo = saldo + ${betragDelta}
            WHERE id = ${t.konto_id}
          `;
          
          await sql`DELETE FROM transaktionen WHERE id = ${id as string}`;
          
          await sql`COMMIT`;
          res.status(200).json({ success: true });
        }
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
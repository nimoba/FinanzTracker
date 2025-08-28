// Transfer API - Handle transfers between accounts

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

type Account = {
  id: number;
  name: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { 
        von_konto_id, 
        zu_konto_id, 
        betrag, 
        datum, 
        beschreibung 
      } = req.body;
      
      if (!von_konto_id || !zu_konto_id || !betrag || !datum) {
        return res.status(400).json({ 
          error: 'Von-Konto, Zu-Konto, Betrag und Datum sind erforderlich' 
        });
      }

      if (von_konto_id === zu_konto_id) {
        return res.status(400).json({ 
          error: 'Quell- und Zielkonto können nicht identisch sein' 
        });
      }

      if (parseFloat(betrag) <= 0) {
        return res.status(400).json({ 
          error: 'Betrag muss größer als 0 sein' 
        });
      }

      // Verify both accounts exist
      const { rows: accountRows } = await sql`
        SELECT id, name FROM konten WHERE id IN (${von_konto_id}, ${zu_konto_id})
      `;
      
      if (accountRows.length !== 2) {
        return res.status(400).json({ error: 'Ein oder beide Konten existieren nicht' });
      }

      // Type-safe account extraction
      const accounts: Account[] = accountRows.map(row => ({
        id: row.id as number,
        name: row.name as string
      }));

      const vonKonto = accounts.find(a => a.id === parseInt(von_konto_id));
      const zuKonto = accounts.find(a => a.id === parseInt(zu_konto_id));

      // Additional safety check (though logically unnecessary after length check)
      if (!vonKonto || !zuKonto) {
        return res.status(400).json({ error: 'Fehler beim Verarbeiten der Konten-Informationen' });
      }

      // Generate unique transfer ID
      const transferId = generateUUID();
      
      // Create outgoing transaction (negative amount)
      const { rows: outgoingTransaction } = await sql`
        INSERT INTO transaktionen (
          konto_id, betrag, typ, datum, beschreibung, transfer_id, ziel_konto_id
        )
        VALUES (
          ${von_konto_id}, 
          ${-Math.abs(parseFloat(betrag))}, 
          'transfer_out', 
          ${datum}, 
          ${beschreibung || `Transfer zu ${zuKonto.name}`},
          ${transferId},
          ${zu_konto_id}
        )
        RETURNING *
      `;

      // Create incoming transaction (positive amount)
      const { rows: incomingTransaction } = await sql`
        INSERT INTO transaktionen (
          konto_id, betrag, typ, datum, beschreibung, transfer_id, ziel_konto_id
        )
        VALUES (
          ${zu_konto_id}, 
          ${Math.abs(parseFloat(betrag))}, 
          'transfer_in', 
          ${datum}, 
          ${beschreibung || `Transfer von ${vonKonto.name}`},
          ${transferId},
          ${von_konto_id}
        )
        RETURNING *
      `;

      // Update account balances
      await sql`
        UPDATE konten 
        SET saldo = saldo - ${Math.abs(parseFloat(betrag))}
        WHERE id = ${von_konto_id}
      `;

      await sql`
        UPDATE konten 
        SET saldo = saldo + ${Math.abs(parseFloat(betrag))}
        WHERE id = ${zu_konto_id}
      `;

      res.status(201).json({
        success: true,
        transfer_id: transferId,
        outgoing_transaction: outgoingTransaction[0],
        incoming_transaction: incomingTransaction[0],
        message: `Transfer von ${Math.abs(parseFloat(betrag)).toFixed(2)}€ von ${vonKonto.name} zu ${zuKonto.name} erfolgreich`
      });
    }
    else if (req.method === 'GET') {
      // Get all transfers with account information
      const { rows: transfers } = await sql`
        SELECT DISTINCT
          t1.transfer_id,
          t1.datum,
          t1.beschreibung,
          ABS(t1.betrag) as betrag,
          k1.name as von_konto,
          k1.id as von_konto_id,
          k2.name as zu_konto,
          k2.id as zu_konto_id,
          t1.created_at
        FROM transaktionen t1
        JOIN transaktionen t2 ON t1.transfer_id = t2.transfer_id AND t1.id != t2.id
        JOIN konten k1 ON t1.konto_id = k1.id
        JOIN konten k2 ON t2.konto_id = k2.id
        WHERE t1.typ = 'transfer_out' AND t1.transfer_id IS NOT NULL
        ORDER BY t1.datum DESC, t1.created_at DESC
      `;

      res.status(200).json(transfers);
    }
    else if (req.method === 'DELETE') {
      const { transfer_id } = req.query;
      
      if (!transfer_id) {
        return res.status(400).json({ error: 'Transfer ID ist erforderlich' });
      }

      // Get transfer transactions before deletion
      const { rows: transferTransactions } = await sql`
        SELECT * FROM transaktionen WHERE transfer_id = ${transfer_id as string}
      `;

      if (transferTransactions.length !== 2) {
        return res.status(404).json({ error: 'Transfer nicht gefunden oder unvollständig' });
      }

      // Reverse account balance changes
      for (const transaction of transferTransactions) {
        await sql`
          UPDATE konten 
          SET saldo = saldo - ${transaction.betrag as number}
          WHERE id = ${transaction.konto_id as number}
        `;
      }

      // Delete both transactions
      const { rowCount } = await sql`
        DELETE FROM transaktionen WHERE transfer_id = ${transfer_id as string}
      `;

      res.status(200).json({ 
        success: true, 
        message: `Transfer gelöscht, ${rowCount} Transaktionen entfernt`,
        deleted_transactions: rowCount
      });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
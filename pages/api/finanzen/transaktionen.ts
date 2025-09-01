// Enhanced Transactions API with improved Transfer Support

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { 
        limit = '50', 
        offset = '0', 
        konto_id, 
        kategorie_id, 
        typ, 
        from, 
        to, 
        exclude_transfers = 'false',
        include_only_transfers = 'false'
      } = req.query;
      
      let whereConditions = ['1=1'];
      const params: any[] = [];
      
      // Filter for transfers
      if (exclude_transfers === 'true') {
        whereConditions.push('t.transfer_id IS NULL');
      } else if (include_only_transfers === 'true') {
        whereConditions.push('t.transfer_id IS NOT NULL');
      }
      
      if (konto_id) {
        whereConditions.push(`t.konto_id = $${params.length + 1}`);
        params.push(konto_id);
      }
      
      if (kategorie_id) {
        whereConditions.push(`t.kategorie_id = $${params.length + 1}`);
        params.push(kategorie_id);
      }
      
      if (typ && typ !== 'all') {
        if (typ === 'transfer') {
          whereConditions.push('t.transfer_id IS NOT NULL');
        } else {
          whereConditions.push(`t.typ = $${params.length + 1}`);
          params.push(typ);
        }
      }
      
      if (from) {
        whereConditions.push(`t.datum >= $${params.length + 1}`);
        params.push(from);
      }
      
      if (to) {
        whereConditions.push(`t.datum <= $${params.length + 1}`);
        params.push(to);
      }
      
      const query = `
        SELECT t.*, 
               k.name as konto_name, 
               k.farbe as konto_farbe,
               kat.name as kategorie_name, 
               kat.icon as kategorie_icon,
               kat.farbe as kategorie_farbe,
               kat.level as kategorie_level,
               zk.name as ziel_konto_name,
               zk.farbe as ziel_konto_farbe,
               CASE 
                 WHEN t.transfer_id IS NOT NULL THEN true 
                 ELSE false 
               END as is_transfer,
               CASE 
                 WHEN t.transfer_id IS NOT NULL AND t.typ = 'transfer_out' THEN 'Übertrag zu ' || zk.name
                 WHEN t.transfer_id IS NOT NULL AND t.typ = 'transfer_in' THEN 'Übertrag von ' || zk.name
                 ELSE t.beschreibung
               END as display_beschreibung
        FROM transaktionen t
        LEFT JOIN konten k ON t.konto_id = k.id
        LEFT JOIN kategorien kat ON t.kategorie_id = kat.id
        LEFT JOIN konten zk ON t.ziel_konto_id = zk.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY t.datum DESC, t.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);
    } 
    else if (req.method === 'POST') {
      // For regular transactions only - transfers should use /transfers endpoint
      const { 
        konto_id, 
        betrag, 
        typ, 
        kategorie_id, 
        datum, 
        beschreibung,
        status = 'confirmed',
        auto_confirm_date,
        original_amount,
        pending_amount
      } = req.body;
      
      // Validate required fields
      if (!konto_id || !betrag || !typ || !datum) {
        return res.status(400).json({ error: 'Konto, Betrag, Typ und Datum sind erforderlich' });
      }

      if (typ === 'transfer' || typ === 'transfer_in' || typ === 'transfer_out') {
        return res.status(400).json({ 
          error: 'Für Überträge verwenden Sie bitte das /transfers Endpoint' 
        });
      }

      await sql`BEGIN`;
      
      try {
        // Create regular transaction with pending support
        const { rows } = await sql`
          INSERT INTO transaktionen (
            konto_id, betrag, typ, kategorie_id, datum, beschreibung,
            status, auto_confirm_date, original_amount, pending_amount
          )
          VALUES (
            ${konto_id}, ${betrag}, ${typ}, ${kategorie_id || null}, ${datum}, ${beschreibung || ''},
            ${status}, ${auto_confirm_date || null}, ${original_amount || betrag}, ${pending_amount || betrag}
          )
          RETURNING *
        `;
        
        // Record initial status in history
        await sql`
          INSERT INTO transaction_status_history (transaction_id, status, amount, note)
          VALUES (${rows[0].id}, ${status}, ${betrag}, 'Transaction created')
        `;
        
        // Update account balance (only for confirmed transactions)
        if (status === 'confirmed') {
          const betragFloat = parseFloat(betrag);
          const betragDelta = typ === 'einnahme' ? betragFloat : -Math.abs(betragFloat);
          
          await sql`
            UPDATE konten 
            SET saldo = saldo + ${betragDelta}
            WHERE id = ${konto_id}
          `;
        }
        // For pending transactions, we might want to track "available balance" separately
        // This depends on your business logic - pending transactions could reduce available balance
        
        await sql`COMMIT`;
        res.status(201).json(rows[0]);
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } 
    else if (req.method === 'PUT') {
      const { id, konto_id, betrag, typ, kategorie_id, datum, beschreibung } = req.body;
      
      if (!id || !konto_id || !betrag || !typ || !datum) {
        return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
      }

      await sql`BEGIN`;
      
      try {
        // Get old transaction to check if it's a transfer
        const { rows: oldTransaction } = await sql`
          SELECT * FROM transaktionen WHERE id = ${id}
        `;
        
        if (oldTransaction.length === 0) {
          await sql`ROLLBACK`;
          return res.status(404).json({ error: 'Transaktion nicht gefunden' });
        }
        
        const old = oldTransaction[0];
        
        // Don't allow editing transfers through regular update
        if (old.transfer_id) {
          await sql`ROLLBACK`;
          return res.status(400).json({ 
            error: 'Überträge können nicht bearbeitet werden. Bitte löschen und neu erstellen.' 
          });
        }
        
        // Reverse old balance change
        const oldBetragFloat = parseFloat(old.betrag);
        const oldBetragDelta = old.typ === 'einnahme' ? -oldBetragFloat : Math.abs(oldBetragFloat);
        
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
        const newBetragFloat = parseFloat(betrag);
        const newBetragDelta = typ === 'einnahme' ? newBetragFloat : -Math.abs(newBetragFloat);
        
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
      
      if (!id) {
        return res.status(400).json({ error: 'Transaction ID ist erforderlich' });
      }

      await sql`BEGIN`;
      
      try {
        // Get transaction to reverse balance change and check for transfers
        const { rows: transaction } = await sql`
          SELECT * FROM transaktionen WHERE id = ${id as string}
        `;
        
        if (transaction.length === 0) {
          await sql`ROLLBACK`;
          return res.status(404).json({ error: 'Transaktion nicht gefunden' });
        }
        
        const t = transaction[0];
        
        if (t.transfer_id) {
          await sql`ROLLBACK`;
          return res.status(400).json({ 
            error: 'Überträge müssen über das /transfers Endpoint gelöscht werden' 
          });
        }
        
        // Regular transaction - reverse balance change
        const betragFloat = parseFloat(t.betrag);
        const betragDelta = t.typ === 'einnahme' ? -betragFloat : Math.abs(betragFloat);
        
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${betragDelta}
          WHERE id = ${t.konto_id}
        `;
        
        // Delete transaction
        await sql`DELETE FROM transaktionen WHERE id = ${id as string}`;
        
        await sql`COMMIT`;
        res.status(200).json({ success: true, message: 'Transaktion erfolgreich gelöscht' });
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
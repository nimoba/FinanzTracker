import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { limit = '50', offset = '0', konto_id, kategorie_id, typ, from, to } = req.query;
      
      const { exclude_transfers = 'false' } = req.query;
      
      let query = `
        SELECT t.*, k.name as konto_name, kat.name as kategorie_name, kat.icon as kategorie_icon,
               CASE WHEN t.typ IN ('transfer_in', 'transfer_out') THEN true ELSE false END as is_transfer
        FROM transaktionen t
        LEFT JOIN konten k ON t.konto_id = k.id
        LEFT JOIN kategorien kat ON t.kategorie_id = kat.id
        WHERE 1=1
      `;
      
      // Exclude transfers from overall analysis if requested
      if (exclude_transfers === 'true') {
        query += ` AND t.typ NOT IN ('transfer_in', 'transfer_out')`;
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
      
      if (typ) {
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
    } else if (req.method === 'POST') {
      const { konto_id, betrag, typ, kategorie_id, datum, beschreibung } = req.body;
      
      // Start transaction
      await sql`BEGIN`;
      
      try {
        // Insert transaction
        const { rows } = await sql`
          INSERT INTO transaktionen (konto_id, betrag, typ, kategorie_id, datum, beschreibung)
          VALUES (${konto_id}, ${betrag}, ${typ}, ${kategorie_id}, ${datum}, ${beschreibung})
          RETURNING *
        `;
        
        // Update account balance
        const betragDelta = typ === 'einnahme' ? betrag : -betrag;
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${betragDelta}
          WHERE id = ${konto_id}
        `;
        
        await sql`COMMIT`;
        res.status(201).json(rows[0]);
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } else if (req.method === 'PUT') {
      const { id, konto_id, betrag, typ, kategorie_id, datum, beschreibung } = req.body;
      
      await sql`BEGIN`;
      
      try {
        // Get old transaction to reverse balance change
        const { rows: oldTransaction } = await sql`
          SELECT * FROM transaktionen WHERE id = ${id}
        `;
        
        if (oldTransaction.length === 0) {
          await sql`ROLLBACK`;
          return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const old = oldTransaction[0];
        
        // Reverse old balance change
        const oldBetragDelta = old.typ === 'einnahme' ? -old.betrag : old.betrag;
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${oldBetragDelta}
          WHERE id = ${old.konto_id}
        `;
        
        // Update transaction
        const { rows } = await sql`
          UPDATE transaktionen 
          SET konto_id = ${konto_id}, betrag = ${betrag}, typ = ${typ}, 
              kategorie_id = ${kategorie_id}, datum = ${datum}, beschreibung = ${beschreibung}
          WHERE id = ${id}
          RETURNING *
        `;
        
        // Apply new balance change
        const newBetragDelta = typ === 'einnahme' ? betrag : -betrag;
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
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      await sql`BEGIN`;
      
      try {
        // Get transaction to reverse balance change
        const { rows: transaction } = await sql`
          SELECT * FROM transaktionen WHERE id = ${id as string}
        `;
        
        if (transaction.length === 0) {
          await sql`ROLLBACK`;
          return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const t = transaction[0];
        
        // Reverse balance change
        const betragDelta = t.typ === 'einnahme' ? -t.betrag : t.betrag;
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${betragDelta}
          WHERE id = ${t.konto_id}
        `;
        
        // Delete transaction
        await sql`DELETE FROM transaktionen WHERE id = ${id as string}`;
        
        await sql`COMMIT`;
        res.status(200).json({ success: true });
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, from, to } = req.query;

    if (type === 'overview') {
      // Monthly income vs expenses for the last 12 months (excluding transfers)
      const { rows } = await sql`
        SELECT 
          DATE_TRUNC('month', datum) as monat,
          SUM(CASE WHEN typ = 'einnahme' THEN betrag ELSE 0 END) as einnahmen,
          SUM(CASE WHEN typ = 'ausgabe' THEN betrag ELSE 0 END) as ausgaben
        FROM transaktionen 
        WHERE datum >= CURRENT_DATE - INTERVAL '12 months'
          AND typ NOT IN ('transfer_in', 'transfer_out')
        GROUP BY DATE_TRUNC('month', datum)
        ORDER BY monat
      `;
      res.status(200).json(rows);
    } else if (type === 'categories') {
      // Spending by category
      const fromDate = (from as string) || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      const toDate = (to as string) || new Date().toISOString().split('T')[0];
      
      const { rows } = await sql`
        SELECT 
          k.name as kategorie,
          k.icon as icon,
          k.farbe as farbe,
          SUM(t.betrag) as betrag,
          COUNT(t.id) as anzahl_transaktionen
        FROM transaktionen t
        JOIN kategorien k ON t.kategorie_id = k.id
        WHERE t.datum >= ${fromDate} AND t.datum <= ${toDate}
          AND t.typ NOT IN ('transfer_in', 'transfer_out')
        GROUP BY k.id, k.name, k.icon, k.farbe
        ORDER BY betrag DESC
      `;
      res.status(200).json(rows);
    } else if (type === 'trends') {
      // Daily spending trends for the last 30 days (excluding transfers)
      const { rows } = await sql`
        SELECT 
          datum,
          SUM(CASE WHEN typ = 'einnahme' THEN betrag ELSE 0 END) as einnahmen,
          SUM(CASE WHEN typ = 'ausgabe' THEN betrag ELSE 0 END) as ausgaben
        FROM transaktionen 
        WHERE datum >= CURRENT_DATE - INTERVAL '30 days'
          AND typ NOT IN ('transfer_in', 'transfer_out')
        GROUP BY datum
        ORDER BY datum
      `;
      res.status(200).json(rows);
    } else if (type === 'summary') {
      // Dashboard summary stats
      const { rows: summary } = await sql`
        SELECT 
          (SELECT SUM(saldo) FROM konten) as gesamtsaldo,
          (SELECT SUM(betrag) FROM transaktionen WHERE typ = 'einnahme' AND DATE_TRUNC('month', datum) = DATE_TRUNC('month', CURRENT_DATE) AND typ NOT IN ('transfer_in', 'transfer_out')) as monatliche_einnahmen,
          (SELECT SUM(betrag) FROM transaktionen WHERE typ = 'ausgabe' AND DATE_TRUNC('month', datum) = DATE_TRUNC('month', CURRENT_DATE) AND typ NOT IN ('transfer_in', 'transfer_out')) as monatliche_ausgaben
      `;
      
      const { rows: budgetStatus } = await sql`
        SELECT 
          COUNT(*) as gesamt_budgets,
          COUNT(CASE WHEN ausgegeben.betrag > b.betrag THEN 1 END) as ueberschrittene_budgets
        FROM budgets b
        LEFT JOIN (
          SELECT 
            kategorie_id,
            SUM(betrag) as betrag
          FROM transaktionen 
          WHERE typ = 'ausgabe' 
            AND DATE_TRUNC('month', datum) = DATE_TRUNC('month', CURRENT_DATE)
            AND typ NOT IN ('transfer_in', 'transfer_out')
          GROUP BY kategorie_id
        ) ausgegeben ON b.kategorie_id = ausgegeben.kategorie_id
        WHERE b.monat = DATE_TRUNC('month', CURRENT_DATE)
      `;
      
      res.status(200).json({
        ...summary[0],
        ...budgetStatus[0]
      });
    } else {
      res.status(400).json({ error: 'Invalid analysis type' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
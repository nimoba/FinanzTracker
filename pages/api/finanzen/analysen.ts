// Enhanced Analysis API with Transfer Support and 3-Level Categories

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, from, to, konto_id, include_transfers = 'false' } = req.query;

    // Helper function to build transfer exclusion condition
    const getTransferFilter = (includeTransfers: string) => {
      return includeTransfers === 'true' ? '' : 'AND t.transfer_id IS NULL';
    };

    if (type === 'overview') {
      // Monthly income vs expenses for the last 12 months
      const transferFilter = getTransferFilter(include_transfers as string);
      
      let query = `
        SELECT 
          DATE_TRUNC('month', t.datum) as monat,
          SUM(CASE WHEN t.typ = 'einnahme' THEN t.betrag ELSE 0 END) as einnahmen,
          SUM(CASE WHEN t.typ = 'ausgabe' THEN t.betrag ELSE 0 END) as ausgaben,
          COUNT(t.id) as transaktionen_gesamt
        FROM transaktionen t
        WHERE t.datum >= CURRENT_DATE - INTERVAL '12 months'
          ${transferFilter}
      `;
      
      if (konto_id) {
        query += ` AND t.konto_id = $1`;
      }
      
      query += `
        GROUP BY DATE_TRUNC('month', t.datum)
        ORDER BY monat
      `;
      
      const params = konto_id ? [konto_id] : [];
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);
      
    } else if (type === 'categories') {
      // Spending by category with 3-level hierarchy support
      const fromDate = (from as string) || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      const toDate = (to as string) || new Date().toISOString().split('T')[0];
      const transferFilter = getTransferFilter(include_transfers as string);
      
      let query = `
        SELECT 
          k.id,
          k.name as kategorie,
          k.icon,
          k.farbe,
          k.level,
          k.parent_id,
          p1.name as parent_name,
          p2.name as grandparent_name,
          SUM(t.betrag) as betrag,
          COUNT(t.id) as anzahl_transaktionen,
          AVG(t.betrag) as durchschnitt_betrag
        FROM transaktionen t
        JOIN kategorien k ON t.kategorie_id = k.id
        LEFT JOIN kategorien p1 ON k.parent_id = p1.id
        LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
        WHERE t.datum >= $1 AND t.datum <= $2
          ${transferFilter}
      `;
      
      const params = [fromDate, toDate];
      
      if (konto_id) {
        query += ` AND t.konto_id = $3`;
        params.push(konto_id as string);
      }
      
      query += `
        GROUP BY k.id, k.name, k.icon, k.farbe, k.level, k.parent_id, p1.name, p2.name
        ORDER BY k.level, betrag DESC
      `;
      
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);
      
    } else if (type === 'category-hierarchy') {
      // Hierarchical category analysis
      const fromDate = (from as string) || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      const toDate = (to as string) || new Date().toISOString().split('T')[0];
      const transferFilter = getTransferFilter(include_transfers as string);
      
      // Get level 1 categories with their totals
      let query = `
        WITH category_totals AS (
          SELECT 
            COALESCE(p2.id, COALESCE(p1.id, k.id)) as main_category_id,
            COALESCE(p2.name, COALESCE(p1.name, k.name)) as main_category_name,
            COALESCE(p2.icon, COALESCE(p1.icon, k.icon)) as main_category_icon,
            COALESCE(p2.farbe, COALESCE(p1.farbe, k.farbe)) as main_category_farbe,
            SUM(t.betrag) as total_betrag,
            COUNT(t.id) as total_transactions
          FROM transaktionen t
          JOIN kategorien k ON t.kategorie_id = k.id
          LEFT JOIN kategorien p1 ON k.parent_id = p1.id
          LEFT JOIN kategorien p2 ON p1.parent_id = p2.id
          WHERE t.datum >= $1 AND t.datum <= $2
            ${transferFilter}
      `;
      
      const params = [fromDate, toDate];
      
      if (konto_id) {
        query += ` AND t.konto_id = $3`;
        params.push(konto_id as string);
      }
      
      query += `
          GROUP BY 
            COALESCE(p2.id, COALESCE(p1.id, k.id)),
            COALESCE(p2.name, COALESCE(p1.name, k.name)),
            COALESCE(p2.icon, COALESCE(p1.icon, k.icon)),
            COALESCE(p2.farbe, COALESCE(p1.farbe, k.farbe))
        )
        SELECT * FROM category_totals
        ORDER BY total_betrag DESC
      `;
      
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);
      
    } else if (type === 'trends') {
      // Daily trends for the last 30 days
      const transferFilter = getTransferFilter(include_transfers as string);
      
      let query = `
        SELECT 
          t.datum,
          SUM(CASE WHEN t.typ = 'einnahme' THEN t.betrag ELSE 0 END) as einnahmen,
          SUM(CASE WHEN t.typ = 'ausgabe' THEN t.betrag ELSE 0 END) as ausgaben,
          COUNT(t.id) as transaktionen_anzahl
        FROM transaktionen t
        WHERE t.datum >= CURRENT_DATE - INTERVAL '30 days'
          ${transferFilter}
      `;
      
      if (konto_id) {
        query += ` AND t.konto_id = $1`;
      }
      
      query += `
        GROUP BY t.datum
        ORDER BY t.datum
      `;
      
      const params = konto_id ? [konto_id] : [];
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);
      
    } else if (type === 'summary') {
      // Dashboard summary stats
      const transferFilter = getTransferFilter(include_transfers as string);
      
      let summaryQuery = `
        SELECT 
          (SELECT SUM(saldo) FROM konten ${konto_id ? `WHERE id = $1` : ''}) as gesamtsaldo,
          (SELECT SUM(t.betrag) FROM transaktionen t WHERE t.typ = 'einnahme' AND DATE_TRUNC('month', t.datum) = DATE_TRUNC('month', CURRENT_DATE) ${transferFilter} ${konto_id ? `AND t.konto_id = $1` : ''}) as monatliche_einnahmen,
          (SELECT SUM(t.betrag) FROM transaktionen t WHERE t.typ = 'ausgabe' AND DATE_TRUNC('month', t.datum) = DATE_TRUNC('month', CURRENT_DATE) ${transferFilter} ${konto_id ? `AND t.konto_id = $1` : ''}) as monatliche_ausgaben,
          (SELECT COUNT(*) FROM transaktionen t WHERE DATE_TRUNC('month', t.datum) = DATE_TRUNC('month', CURRENT_DATE) ${transferFilter} ${konto_id ? `AND t.konto_id = $1` : ''}) as monatliche_transaktionen
      `;
      
      const params = konto_id ? [konto_id] : [];
      const { rows: summary } = await sql.query(summaryQuery, params);
      
      // Budget status (only for overall analysis, not account-specific)
      let budgetStatus = { gesamt_budgets: 0, ueberschrittene_budgets: 0 };
      
      if (!konto_id) {
        const { rows } = await sql`
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
              AND transfer_id IS NULL
            GROUP BY kategorie_id
          ) ausgegeben ON b.kategorie_id = ausgegeben.kategorie_id
          WHERE b.monat = DATE_TRUNC('month', CURRENT_DATE)
        `;
        if (rows.length > 0) {
          budgetStatus = {
            gesamt_budgets: parseInt(rows[0].gesamt_budgets as string) || 0,
            ueberschrittene_budgets: parseInt(rows[0].ueberschrittene_budgets as string) || 0
          };
        }
      }
      
      res.status(200).json({
        ...summary[0],
        ...budgetStatus
      });
      
    } else if (type === 'transfers') {
      // Transfer analysis (only when specifically requested)
      const fromDate = (from as string) || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      const toDate = (to as string) || new Date().toISOString().split('T')[0];
      
      let query = `
        SELECT 
          t.transfer_id,
          t.datum,
          t.beschreibung,
          ABS(t.betrag) as betrag,
          k1.name as von_konto,
          k2.name as zu_konto,
          COUNT(*) OVER (PARTITION BY t.transfer_id) as transaction_count
        FROM transaktionen t
        JOIN konten k1 ON t.konto_id = k1.id
        LEFT JOIN konten k2 ON t.ziel_konto_id = k2.id
        WHERE t.transfer_id IS NOT NULL
          AND t.datum >= $1 AND t.datum <= $2
          AND t.betrag < 0  -- Only show outgoing transfers to avoid duplicates
      `;
      
      const params = [fromDate, toDate];
      
      if (konto_id) {
        query += ` AND (t.konto_id = $3 OR t.ziel_konto_id = $3)`;
        params.push(konto_id as string);
      }
      
      query += ` ORDER BY t.datum DESC, t.transfer_id`;
      
      const { rows } = await sql.query(query, params);
      res.status(200).json(rows);
      
    } else {
      res.status(400).json({ error: 'Invalid analysis type. Available types: overview, categories, category-hierarchy, trends, summary, transfers' });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
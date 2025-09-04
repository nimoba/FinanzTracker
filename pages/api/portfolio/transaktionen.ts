
// pages/api/portfolio/transaktionen.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { position_id } = req.query;
    
    try {
      let query = `
        SELECT pt.*, pp.name, pp.symbol, pp.typ
        FROM portfolio_transaktionen pt
        JOIN portfolio_positionen pp ON pt.position_id = pp.id
      `;
      
      if (position_id) {
        query += ` WHERE pt.position_id = $1`;
      }
      
      query += ` ORDER BY pt.datum DESC, pt.created_at DESC`;
      
      const { rows } = position_id ? 
        await sql.query(query, [position_id]) : 
        await sql.query(query, []);
      
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching portfolio transactions:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Transaktionen' });
    }
  } 
  
  else if (req.method === 'POST') {
    const { position_id, typ, anzahl, preis, gebuehren = 0, datum } = req.body;
    
    try {
      // Transaktion hinzufügen
      const { rows: transaction } = await sql`
        INSERT INTO portfolio_transaktionen (position_id, typ, anzahl, preis, gebuehren, datum)
        VALUES (${position_id}, ${typ}, ${anzahl}, ${preis}, ${gebuehren}, ${datum})
        RETURNING *
      `;
      
      // Entsprechende Finanztransaktion für Cash-Management erstellen
      const portfolioKonto = await sql`SELECT id FROM konten WHERE ist_portfolio = TRUE LIMIT 1`;
      if (portfolioKonto.rows.length > 0) {
        const portfolioKontoId = portfolioKonto.rows[0].id;
        const transactionAmount = parseFloat(anzahl) * parseFloat(preis) + parseFloat(gebuehren);
        
        // Kauf = Ausgabe vom Portfolio Cash, Verkauf = Einnahme zum Portfolio Cash
        const finanzTyp = typ === 'kauf' ? 'ausgabe' : 'einnahme';
        const betrag = typ === 'kauf' ? -transactionAmount : transactionAmount;
        
        await sql`
          INSERT INTO transaktionen (konto_id, kategorie_id, betrag, typ, datum, beschreibung)
          VALUES (
            ${portfolioKontoId}, 
            (SELECT id FROM kategorien WHERE name = 'Investment' AND typ = '${finanzTyp}' LIMIT 1),
            ${betrag},
            ${finanzTyp},
            ${datum},
            ${`${typ === 'kauf' ? 'Kauf' : 'Verkauf'}: ${anzahl} x Position ${position_id}`}
          )
        `;
        
        // Portfolio-Konto Saldo aktualisieren
        await sql`
          UPDATE konten 
          SET saldo = saldo + ${betrag}
          WHERE id = ${portfolioKontoId}
        `;
      }
      
      res.status(201).json(transaction[0]);
    } catch (error) {
      console.error('Error creating portfolio transaction:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen der Transaktion' });
    }
  }
  

else if (req.method === 'DELETE') {
    const { id } = req.query;
    
    // WICHTIG: Query-Parameter zu String konvertieren
    const idStr = Array.isArray(id) ? id[0] : id;
    
    if (!idStr) {
      return res.status(400).json({ error: 'ID erforderlich' });
    }
    
    try {
      await sql`DELETE FROM portfolio_transaktionen WHERE id = ${idStr}`;
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting portfolio transaction:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Transaktion' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
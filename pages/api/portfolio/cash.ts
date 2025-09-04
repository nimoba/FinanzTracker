import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { rows: cashPositions } = await sql`
        SELECT * FROM portfolio_cash ORDER BY created_at DESC
      `;
      
      // Hole aktuellen Cash-Saldo aus dem Portfolio-Konto
      const { rows: portfolioAccount } = await sql`
        SELECT saldo FROM konten WHERE ist_portfolio = TRUE LIMIT 1
      `;
      
      const currentCash = parseFloat(portfolioAccount[0]?.saldo || '0');
      
      res.status(200).json({
        positions: cashPositions,
        currentCash: currentCash
      });
    } catch (error) {
      console.error('Error fetching cash data:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Cash-Daten' });
    }
  }
  
  else if (req.method === 'PUT') {
    const { interest_rate } = req.body;
    
    try {
      // Hole das Standard-Portfolio
      const { rows: portfolios } = await sql`SELECT id FROM portfolios ORDER BY id LIMIT 1`;
      
      if (portfolios.length > 0) {
        await sql`
          UPDATE portfolio_cash 
          SET interest_rate = ${interest_rate}, updated_at = NOW()
          WHERE portfolio_id = ${portfolios[0].id}
        `;
        
        // Falls keine Cash-Position existiert, erstelle eine
        await sql`
          INSERT INTO portfolio_cash (portfolio_id, amount, interest_rate)
          SELECT ${portfolios[0].id}, 0, ${interest_rate}
          WHERE NOT EXISTS (SELECT 1 FROM portfolio_cash WHERE portfolio_id = ${portfolios[0].id})
        `;
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating cash interest rate:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Zinssatzes' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
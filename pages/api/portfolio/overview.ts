// pages/api/portfolio/overview.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from '@vercel/postgres';

interface PortfolioOverview {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cashValue: number;
  positionsValue: number;
  positions: Array<{
    id: number;
    name: string;
    symbol: string;
    typ: string;
    shares: number;
    currentPrice: number;
    currentValue: number;
    invested: number;
    gain: number;
    gainPercent: number;
    weight: number;
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Hole alle Positionen mit aktuellen Marktdaten
      const { rows: positions } = await sql`
        SELECT 
          p.*,
          COALESCE(SUM(pt.anzahl * CASE WHEN pt.typ = 'kauf' THEN 1 ELSE -1 END), 0) as gehaltene_anteile,
          COALESCE(SUM(CASE WHEN pt.typ = 'kauf' THEN pt.anzahl * pt.preis + pt.gebuehren 
                           ELSE -1 * pt.anzahl * pt.preis - pt.gebuehren END), 0) as investiert,
          md.preis as aktueller_preis,
          md.datum as preis_datum
        FROM portfolio_positionen p
        LEFT JOIN portfolio_transaktionen pt ON p.id = pt.position_id
        LEFT JOIN portfolio_marktdaten md ON (p.symbol = md.symbol OR p.wkn = md.wkn) 
          AND md.datum = (SELECT MAX(datum) FROM portfolio_marktdaten WHERE symbol = md.symbol OR wkn = md.wkn)
        GROUP BY p.id, md.preis, md.datum
        HAVING COALESCE(SUM(pt.anzahl * CASE WHEN pt.typ = 'kauf' THEN 1 ELSE -1 END), 0) > 0
        ORDER BY p.created_at DESC
      `;
      
      // Cash-Wert
      const { rows: cashData } = await sql`
        SELECT saldo FROM konten WHERE ist_portfolio = TRUE LIMIT 1
      `;
      const cashValue = parseFloat(cashData[0]?.saldo || '0');
      
      // Berechne Portfolio-Übersicht
      let totalValue = cashValue;
      let totalInvested = 0;
      let positionsValue = 0;
      
      const enrichedPositions = positions.map((pos: any) => {
        const shares = parseFloat(pos.gehaltene_anteile || '0');
        const invested = parseFloat(pos.investiert || '0');
        const currentPrice = parseFloat(pos.aktueller_preis || '0');
        const currentValue = shares * currentPrice;
        const gain = currentValue - invested;
        const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;
        
        totalValue += currentValue;
        totalInvested += invested;
        positionsValue += currentValue;
        
        return {
          id: pos.id,
          name: pos.name,
          symbol: pos.symbol,
          typ: pos.typ,
          shares,
          currentPrice,
          currentValue,
          invested,
          gain,
          gainPercent,
          weight: 0 // Wird unten berechnet
        };
      });
      
      // Gewichtungen berechnen
      enrichedPositions.forEach(pos => {
        pos.weight = totalValue > 0 ? (pos.currentValue / totalValue) * 100 : 0;
      });
      
      const totalGain = totalValue - totalInvested;
      const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
      
      const overview: PortfolioOverview = {
        totalValue,
        totalInvested,
        totalGain,
        totalGainPercent,
        dayChange: 0, // TODO: Implementieren basierend auf historischen Daten
        dayChangePercent: 0,
        cashValue,
        positionsValue,
        positions: enrichedPositions
      };
      
      res.status(200).json(overview);
    } catch (error) {
      console.error('Error fetching portfolio overview:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Portfolio-Übersicht' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
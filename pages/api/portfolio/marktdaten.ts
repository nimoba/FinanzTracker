// pages/api/portfolio/marktdaten.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from '@vercel/postgres';

// WKN zu Symbol Konvertierung (erweitere diese Liste nach Bedarf)
const WKN_TO_SYMBOL: Record<string, string> = {
  'A0RPWH': 'IWDA.L',        // iShares Core MSCI World
  'A1JX52': 'VWRL.L',        // Vanguard FTSE All-World
  'A0Q4DC': 'EQQQ.L',        // Invesco NASDAQ-100
  'ETF110': 'SXR8.DE',       // iShares Core DAX
  'A2PKXG': 'VFEM.L',        // Vanguard FTSE Emerging Markets
  // Füge hier weitere WKN/Symbol-Mappings hinzu
};

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  timestamp: number;
}

async function fetchYahooFinance(symbol: string): Promise<MarketData | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol,
      price: currentPrice,
      change,
      changePercent,
      currency: meta.currency || 'EUR',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

async function fetchCryptoPrice(symbol: string): Promise<MarketData | null> {
  try {
    const cryptoId = symbol.toLowerCase().replace(/[^a-z]/g, '');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=eur&include_24hr_change=true`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const priceData = data[cryptoId];
    
    if (!priceData) return null;
    
    return {
      symbol,
      price: priceData.eur,
      change: priceData.eur_24h_change || 0,
      changePercent: priceData.eur_24h_change || 0,
      currency: 'EUR',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`Error fetching crypto data for ${symbol}:`, error);
    return null;
  }
}

function resolveSymbol(identifier: string, type: string): string {
  // Wenn es eine deutsche WKN ist, konvertiere zu Yahoo Symbol
  if (WKN_TO_SYMBOL[identifier]) {
    return WKN_TO_SYMBOL[identifier];
  }
  
  // Für deutsche Aktien füge .DE hinzu falls nicht vorhanden
  if (type === 'stock' && !identifier.includes('.') && identifier.length <= 6) {
    return `${identifier}.DE`;
  }
  
  return identifier;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { symbol, wkn, type = 'stock' } = req.query;
    
    try {
      // WICHTIG: Query-Parameter zu Strings konvertieren
      const symbolStr = Array.isArray(symbol) ? symbol[0] : symbol;
      const wknStr = Array.isArray(wkn) ? wkn[0] : wkn;
      const typeStr = Array.isArray(type) ? type[0] : type;
      
      const identifier = (symbolStr || wknStr) as string;
      if (!identifier) {
        return res.status(400).json({ error: 'Symbol oder WKN erforderlich' });
      }
      
      let marketData: MarketData | null = null;
      
      if (typeStr === 'crypto') {
        marketData = await fetchCryptoPrice(identifier);
      } else {
        const resolvedSymbol = resolveSymbol(identifier, typeStr);
        marketData = await fetchYahooFinance(resolvedSymbol);
      }
      
      if (!marketData) {
        return res.status(404).json({ error: 'Marktdaten nicht gefunden' });
      }
      
      // Cache the data - HIER ist der Fix für den SQL-Parameter
      await sql`
        INSERT INTO portfolio_marktdaten (symbol, wkn, datum, preis, waehrung)
        VALUES (${marketData.symbol}, ${wknStr || identifier}, CURRENT_DATE, ${marketData.price}, ${marketData.currency})
        ON CONFLICT (symbol, datum) 
        DO UPDATE SET preis = ${marketData.price}, waehrung = ${marketData.currency}
      `;
      
      res.status(200).json(marketData);
    } catch (error) {
      console.error('Market data error:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Marktdaten' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
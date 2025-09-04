// pages/api/portfolio/historical.ts
import type { NextApiRequest, NextApiResponse } from "next";

// WKN zu Symbol Konvertierung (gleiche Mappings wie in marktdaten.ts)
const WKN_TO_SYMBOL: Record<string, string> = {
  'A0RPWH': 'IWDA.L',        // iShares Core MSCI World
  'A1JX52': 'VWRL.L',        // Vanguard FTSE All-World
  'A0Q4DC': 'EQQQ.L',        // Invesco NASDAQ-100
  'ETF110': 'SXR8.DE',       // iShares Core DAX
  'A2PKXG': 'VFEM.L',        // Vanguard FTSE Emerging Markets
  // Füge hier weitere WKN/Symbol-Mappings hinzu
};

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

async function fetchHistoricalData(symbol: string, period: string = '1y'): Promise<any[]> {
  try {
    const range = period === 'today' ? '1d' : 
                  period === '30d' ? '1mo' : 
                  period === '6m' ? '6mo' : 
                  period === '1y' ? '1y' : 
                  period === '5y' ? '5y' : 'max';
    
    const interval = period === 'today' ? '1h' : 
                    period === '30d' ? '1d' : 
                    period === '6m' ? '1d' : '1wk';
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
      return [];
    }
    
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    
    return timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      price: closes[index] || closes[index - 1] || 0
    })).filter((item: any) => item.price > 0);
    
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { symbol, wkn, period = '1y', type = 'stock' } = req.query;
    
    try {
      // Query-Parameter zu Strings konvertieren
      const symbolStr = Array.isArray(symbol) ? symbol[0] : symbol;
      const wknStr = Array.isArray(wkn) ? wkn[0] : wkn;
      const periodStr = Array.isArray(period) ? period[0] : period;
      const typeStr = Array.isArray(type) ? type[0] : type;
      
      const identifier = (symbolStr || wknStr) as string;
      if (!identifier) {
        return res.status(400).json({ error: 'Symbol oder WKN erforderlich' });
      }
      
      let historicalData: any[] = [];
      
      if (typeStr === 'crypto') {
        // Für Krypto verwenden wir CoinGecko (begrenzte historische Daten in kostenloser Version)
        const cryptoId = identifier.toLowerCase().replace(/[^a-z]/g, '');
        const days = periodStr === 'today' ? '1' : 
                    periodStr === '30d' ? '30' : 
                    periodStr === '6m' ? '180' : 
                    periodStr === '1y' ? '365' : 
                    periodStr === '5y' ? '1825' : 'max';
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=eur&days=${days}`
        );
        
        if (response.ok) {
          const data = await response.json();
          historicalData = data.prices?.map(([timestamp, price]: [number, number]) => ({
            date: new Date(timestamp).toISOString().split('T')[0],
            price
          })) || [];
        }
      } else {
        const resolvedSymbol = resolveSymbol(identifier, typeStr);
        historicalData = await fetchHistoricalData(resolvedSymbol, periodStr);
      }
      
      res.status(200).json(historicalData);
    } catch (error) {
      console.error('Historical data error:', error);
      res.status(500).json({ error: 'Fehler beim Laden der historischen Daten' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
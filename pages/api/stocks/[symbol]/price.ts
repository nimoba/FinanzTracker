import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import yahooFinance from 'yahoo-finance2';

// Cache for 5 minutes during market hours
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const priceCache = new Map<string, { price: number; timestamp: number; }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }

  try {
    const upperSymbol = symbol.toUpperCase();
    const now = Date.now();

    // Check cache first
    const cached = priceCache.get(upperSymbol);
    if (cached && (now - cached.timestamp) < PRICE_CACHE_TTL) {
      return res.status(200).json({
        symbol: upperSymbol,
        price: cached.price,
        source: 'cache',
        timestamp: new Date(cached.timestamp).toISOString()
      });
    }

    try {
      // Try to fetch from Yahoo Finance
      console.log(`Fetching price for ${upperSymbol} from Yahoo Finance...`);
      
      // For German stocks, try different formats
      const symbolVariations = [
        upperSymbol,
        `${upperSymbol}.DE`,
        `${upperSymbol}.F`,
        `${upperSymbol}.XETRA`
      ];

      let quote = null;
      let usedSymbol = upperSymbol;

      for (const symbolVar of symbolVariations) {
        try {
          quote = await yahooFinance.quote(symbolVar);
          usedSymbol = symbolVar;
          console.log(`Successfully fetched ${symbolVar}:`, quote?.regularMarketPrice);
          break;
        } catch (err) {
          console.log(`Failed to fetch ${symbolVar}:`, err instanceof Error ? err.message : 'Unknown error');
          continue;
        }
      }

      if (!quote || !quote.regularMarketPrice) {
        throw new Error(`No price data found for symbol ${upperSymbol}`);
      }

      const price = parseFloat(quote.regularMarketPrice.toString());
      const currency = quote.currency || 'EUR';

      // Update cache
      priceCache.set(upperSymbol, { price, timestamp: now });

      // Store in price history
      try {
        await sql`
          INSERT INTO price_history (symbol, date, close_price, currency)
          VALUES (${upperSymbol}, CURRENT_DATE, ${price}, ${currency})
          ON CONFLICT (symbol, date) 
          DO UPDATE SET 
            close_price = ${price}, 
            currency = ${currency}
        `;
      } catch (dbError) {
        console.error('Failed to store price history:', dbError);
        // Continue even if DB storage fails
      }

      // Update current_price in holdings table
      try {
        await sql`
          UPDATE holdings 
          SET current_price = ${price}, last_updated = NOW()
          WHERE symbol = ${upperSymbol}
        `;
      } catch (updateError) {
        console.error('Failed to update holdings:', updateError);
      }

      res.status(200).json({
        symbol: upperSymbol,
        usedSymbol,
        price,
        currency,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        companyName: quote.shortName || quote.longName,
        marketState: quote.marketState,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent
      });

    } catch (yahooError) {
      console.error(`Yahoo Finance error for ${upperSymbol}:`, yahooError);

      // Fallback: try to get last known price from database
      const { rows: priceHistory } = await sql`
        SELECT * FROM price_history 
        WHERE symbol = ${upperSymbol} 
        ORDER BY date DESC 
        LIMIT 1
      `;

      if (priceHistory.length > 0) {
        const lastPrice = parseFloat(priceHistory[0].close_price);
        
        return res.status(200).json({
          symbol: upperSymbol,
          price: lastPrice,
          currency: priceHistory[0].currency || 'EUR',
          source: 'database_fallback',
          timestamp: priceHistory[0].date,
          warning: 'Using last known price - real-time data unavailable'
        });
      }

      // If no fallback data available
      return res.status(404).json({
        error: `Unable to fetch price for symbol ${upperSymbol}`,
        details: yahooError instanceof Error ? yahooError.message : 'Unknown error',
        suggestions: [
          'Check if the symbol is correct',
          'Try adding market suffix (.DE, .F, .XETRA)',
          'Manual price entry may be required'
        ]
      });
    }

  } catch (error) {
    console.error('Stock price API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
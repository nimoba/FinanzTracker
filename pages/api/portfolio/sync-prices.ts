import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all unique symbols from holdings
    const { rows: holdings } = await sql`
      SELECT DISTINCT symbol FROM holdings WHERE total_quantity > 0
    `;

    if (holdings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No holdings found to sync',
        updated: 0,
        failed: 0
      });
    }

    let updated = 0;
    let failed = 0;
    const results = [];

    // Update prices for each symbol
    for (const holding of holdings) {
      const symbol = holding.symbol;
      
      try {
        console.log(`Syncing price for ${symbol}...`);
        
        // Call our own price API to get current price
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${symbol}/price`);
        
        if (response.ok) {
          const priceData = await response.json();
          
          // Update holdings with new price
          await sql`
            UPDATE holdings 
            SET current_price = ${priceData.price}, last_updated = NOW()
            WHERE symbol = ${symbol}
          `;
          
          updated++;
          results.push({
            symbol,
            success: true,
            price: priceData.price,
            source: priceData.source
          });
          
          console.log(`✅ Updated ${symbol}: ${priceData.price}`);
        } else {
          const errorData = await response.json();
          failed++;
          results.push({
            symbol,
            success: false,
            error: errorData.error || 'Unknown error'
          });
          
          console.log(`❌ Failed to update ${symbol}: ${errorData.error}`);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failed++;
        results.push({
          symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.error(`❌ Error updating ${symbol}:`, error);
      }
    }

    // Get portfolio summary after updates
    const { rows: summary } = await sql`
      SELECT 
        COUNT(*) as total_holdings,
        SUM(total_quantity * current_price) as total_current_value,
        SUM(total_quantity * avg_purchase_price) as total_cost
      FROM holdings 
      WHERE total_quantity > 0
    `;

    res.status(200).json({
      success: true,
      message: `Price sync completed`,
      updated,
      failed,
      total_holdings: parseInt(summary[0]?.total_holdings || '0'),
      total_value: parseFloat(summary[0]?.total_current_value || '0'),
      total_cost: parseFloat(summary[0]?.total_cost || '0'),
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Price sync error:', error);
    res.status(500).json({
      error: 'Price sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
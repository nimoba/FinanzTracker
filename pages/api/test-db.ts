// Database Connection Test API

import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test basic connection
    console.log('Testing database connection...');
    const startTime = Date.now();
    
    const testResult = await sql`SELECT 1 as test, NOW() as timestamp`;
    
    const connectionTime = Date.now() - startTime;
    
    // Test if tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('kategorien', 'konten', 'transaktionen', 'budgets', 'sparziele')
      ORDER BY table_name
    `;
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    // Check category counts if kategorien table exists
    let categoryStats = null;
    if (existingTables.includes('kategorien')) {
      try {
        const categoryResult = await sql`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
            COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories,
            COUNT(CASE WHEN typ = 'einnahme' THEN 1 END) as income_categories,
            COUNT(CASE WHEN typ = 'ausgabe' THEN 1 END) as expense_categories
          FROM kategorien
        `;
        categoryStats = categoryResult.rows[0];
      } catch (catError) {
        console.error('Error getting category stats:', catError);
      }
    }
    
    // Check account counts if konten table exists
    let accountStats = null;
    if (existingTables.includes('konten')) {
      try {
        const accountResult = await sql`SELECT COUNT(*) as total FROM konten`;
        accountStats = accountResult.rows[0];
      } catch (accError) {
        console.error('Error getting account stats:', accError);
      }
    }
    
    // Check transaction counts if transaktionen table exists
    let transactionStats = null;
    if (existingTables.includes('transaktionen')) {
      try {
        const transactionResult = await sql`SELECT COUNT(*) as total FROM transaktionen`;
        transactionStats = transactionResult.rows[0];
      } catch (transError) {
        console.error('Error getting transaction stats:', transError);
      }
    }

    // Get database info
    const dbInfoResult = await sql`
      SELECT 
        version() as postgres_version,
        current_database() as database_name,
        current_user as current_user,
        inet_server_addr() as server_address
    `;
    
    const dbInfo = dbInfoResult.rows[0];

    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      connection_time_ms: connectionTime,
      test_result: testResult.rows[0],
      database_info: {
        postgres_version: dbInfo.postgres_version,
        database_name: dbInfo.database_name,
        current_user: dbInfo.current_user,
        server_address: dbInfo.server_address
      },
      tables: {
        expected: ['budgets', 'kategorien', 'konten', 'sparziele', 'transaktionen'],
        existing: existingTables,
        missing: ['budgets', 'kategorien', 'konten', 'sparziele', 'transaktionen']
          .filter(table => !existingTables.includes(table))
      },
      data_stats: {
        categories: categoryStats,
        accounts: accountStats,
        transactions: transactionStats
      },
      environment: {
        node_env: process.env.NODE_ENV,
        postgres_url_exists: !!process.env.POSTGRES_URL,
        vercel_env: process.env.VERCEL_ENV
      }
    });

  } catch (error) {
    console.error('Database test failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        node_env: process.env.NODE_ENV,
        postgres_url_exists: !!process.env.POSTGRES_URL,
        vercel_env: process.env.VERCEL_ENV
      }
    });
  }
}
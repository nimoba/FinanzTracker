// Simple database connection test

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if we have database URL
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    const hasPostgresPrismaUrl = !!process.env.POSTGRES_PRISMA_URL;
    
    if (!hasPostgresUrl && !hasPostgresPrismaUrl) {
      return res.status(500).json({
        success: false,
        error: 'NO_DATABASE_URL',
        message: 'No Postgres database URL found in environment variables',
        instructions: [
          '1. Go to Vercel Dashboard → Your Project',
          '2. Go to Storage tab → Create Database → Postgres', 
          '3. Copy all environment variables to Settings → Environment Variables',
          '4. Redeploy the project'
        ]
      });
    }

    // Try to import and test the database
    try {
      const { sql } = await import('@vercel/postgres');
      
      const startTime = Date.now();
      const result = await sql`SELECT 1 as test_connection, NOW() as current_time`;
      const connectionTime = Date.now() - startTime;
      
      return res.status(200).json({
        success: true,
        message: 'Database connection successful!',
        connection_time_ms: connectionTime,
        test_result: result.rows[0],
        environment: {
          has_postgres_url: hasPostgresUrl,
          has_prisma_url: hasPostgresPrismaUrl,
          vercel_env: process.env.VERCEL_ENV || 'unknown'
        }
      });
      
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        error: 'CONNECTION_FAILED',
        message: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        environment: {
          has_postgres_url: hasPostgresUrl,
          has_prisma_url: hasPostgresPrismaUrl
        },
        instructions: [
          '1. Verify database environment variables are correct',
          '2. Check if database region matches project region',
          '3. Redeploy after adding environment variables',
          '4. Check Vercel function logs for detailed errors'
        ]
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'SETUP_ERROR',
      message: 'Failed to set up database test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
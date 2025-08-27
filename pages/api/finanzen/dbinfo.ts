import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables (without exposing sensitive values)
    const envVars = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      POSTGRES_USER: !!process.env.POSTGRES_USER,
      POSTGRES_HOST: !!process.env.POSTGRES_HOST,
      POSTGRES_PASSWORD: !!process.env.POSTGRES_PASSWORD,
      POSTGRES_DATABASE: !!process.env.POSTGRES_DATABASE,
    };

    // Test database connection
    let connectionStatus = 'disconnected';
    let tableInfo: Record<string, number | string | boolean> = {};
    let error = null;

    try {
      // Simple query to test connection
      const { rows: testRows } = await sql`SELECT 1 as test`;
      connectionStatus = 'connected';

      // Get table information
      const { rows: tables } = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;

      for (const table of tables) {
        const tableName = table.table_name;
        try {
          const { rows: countRows } = await sql.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          tableInfo[tableName] = countRows[0].count;
        } catch (e) {
          tableInfo[tableName] = 'error';
        }
      }

      // Check for parent_id column in kategorien table
      const { rows: columns } = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'kategorien'
      `;
      
      tableInfo['kategorien_has_parent_id'] = columns.some(col => col.column_name === 'parent_id');

    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    res.status(200).json({
      connectionStatus,
      environmentVariables: envVars,
      tableInfo,
      error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database info error:', error);
    res.status(500).json({ error: 'Failed to get database info', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to Neon database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📊 Creating database schema...');
    await pool.query(schema);
    
    console.log('✅ Database setup complete!');
    console.log('📋 Tables created:');
    console.log('   - accounts');
    console.log('   - categories (with default data)');
    console.log('   - transactions'); 
    console.log('   - budgets');
    console.log('   - goals');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
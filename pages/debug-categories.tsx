// Improved Debug Page with Database Check - fixes data type errors

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  typ: 'einnahme' | 'ausgabe';
  icon: string;
  farbe: string;
  parent_id?: number;
  parent_name?: string;
}

interface Transaction {
  id: number;
  betrag: number;
  typ: 'einnahme' | 'ausgabe';
  datum: string;
  beschreibung: string;
  konto_name: string;
  kategorie_name: string;
  kategorie_icon: string;
  kategorie_id: number;
}

interface DatabaseCheckResult {
  success: boolean;
  message: string;
  error?: string;
  details?: string;
  connection_time_ms?: number;
  instructions?: string[];
  environment?: {
    has_postgres_url: boolean;
    has_prisma_url: boolean;
    vercel_env?: string;
  };
}

export default function CategoryDebugPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [dbCheckResult, setDbCheckResult] = useState<DatabaseCheckResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    quickDatabaseCheck();
    loadData();
  }, []);

  const quickDatabaseCheck = async () => {
    setCheckLoading(true);
    try {
      const response = await fetch('/api/db-check');
      const result = await response.json();
      setDbCheckResult(result);
      
      if (!result.success) {
        setErrors(prev => [...prev, `Database check failed: ${result.message}`]);
      }
    } catch (error) {
      console.error('Database check error:', error);
      setDbCheckResult({
        success: false,
        message: 'Failed to perform database check',
        error: 'CHECK_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      setErrors(prev => [...prev, `Database check request failed: ${error}`]);
    } finally {
      setCheckLoading(false);
    }
  };

  const loadData = async () => {
    const newErrors: string[] = [];
    
    try {
      // Load categories with better error handling
      try {
        const categoriesRes = await fetch('/api/finanzen/kategorien');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          console.log('Categories from API:', categoriesData);
        } else {
          const errorText = await categoriesRes.text();
          newErrors.push(`Categories API failed (${categoriesRes.status}): ${errorText.substring(0, 200)}`);
          setCategories([]);
        }
      } catch (error) {
        newErrors.push(`Categories API error: ${error}`);
        setCategories([]);
      }

      // Load transactions with better error handling
      try {
        const transactionsRes = await fetch('/api/finanzen/transaktionen?limit=10');
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          if (Array.isArray(transactionsData)) {
            // Fix potential data type issues
            const fixedTransactions = transactionsData.map(t => ({
              ...t,
              betrag: typeof t.betrag === 'string' ? parseFloat(t.betrag) : (t.betrag || 0)
            }));
            setTransactions(fixedTransactions);
          } else {
            setTransactions([]);
          }
          console.log('Transactions from API:', transactionsData);
        } else {
          const errorText = await transactionsRes.text();
          newErrors.push(`Transactions API failed (${transactionsRes.status}): ${errorText.substring(0, 200)}`);
          setTransactions([]);
        }
      } catch (error) {
        newErrors.push(`Transactions API error: ${error}`);
        setTransactions([]);
      }
      
    } finally {
      setErrors(prev => [...prev, ...newErrors]);
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    if (dbCheckResult && !dbCheckResult.success) {
      alert(`❌ Database not connected!\n\nPlease set up Vercel Postgres first:\n${dbCheckResult.instructions?.join('\n') || 'Check Vercel dashboard → Storage → Create Postgres database'}`);
      return;
    }

    setSetupLoading(true);
    setErrors([]);
    
    try {
      console.log('Starting database setup...');
      const response = await fetch('/api/finanzen/setup', {
        method: 'POST',
      });
      
      const result = await response.json();
      console.log('Setup result:', result);
      
      if (result.success) {
        alert(`✅ Setup successful!\n\nCreated:\n- ${result.stats?.total_categories || 0} total categories\n- ${result.stats?.main_categories || 0} main categories\n- ${result.stats?.subcategories || 0} subcategories\n- ${result.stats?.accounts || 0} accounts`);
        await loadData();
        await quickDatabaseCheck();
      } else {
        const errorMsg = `❌ Setup failed: ${result.error}\n\nDetails: ${result.details || 'No additional details'}`;
        alert(errorMsg);
        setErrors(prev => [...prev, `Setup failed: ${result.error} - ${result.details}`]);
      }
    } catch (error) {
      console.error('Setup error:', error);
      const errorMsg = `❌ Setup request failed: ${error}`;
      alert(errorMsg);
      setErrors(prev => [...prev, `Setup request failed: ${error}`]);
    } finally {
      setSetupLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #333',
    marginBottom: '12px',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#36a2eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 16px',
    cursor: 'pointer',
    marginRight: '12px',
    marginBottom: '12px',
  };

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const subcategories = categories.filter(cat => cat.parent_id);

  if (loading && checkLoading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: 100 }}>
          <h2>🔄 Loading diagnostic information...</h2>
          <p>Testing database connection and loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1>🔍 Finance Tracker Database Diagnostic</h1>
      
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={quickDatabaseCheck} 
          style={buttonStyle}
          disabled={checkLoading}
        >
          {checkLoading ? '🔄 Checking...' : '🔍 Check Database'}
        </button>
        <button 
          onClick={setupDatabase} 
          style={buttonStyle}
          disabled={setupLoading || (dbCheckResult && !dbCheckResult.success)}
        >
          {setupLoading ? '⚙️ Setting up...' : '🔧 Run Database Setup'}
        </button>
        <button 
          onClick={loadData} 
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Reload Data'}
        </button>
        <button 
          onClick={() => window.location.href = '/'} 
          style={{...buttonStyle, backgroundColor: '#666'}}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Database Setup Instructions */}
      {dbCheckResult && !dbCheckResult.success && dbCheckResult.error === 'NO_DATABASE_URL' && (
        <div style={{
          ...cardStyle,
          backgroundColor: '#4a1a1a',
          border: '2px solid #f44336',
          marginBottom: '24px'
        }}>
          <h2>🚨 Database Not Set Up</h2>
          <p style={{ color: '#f44336', fontSize: '16px', fontWeight: 'bold' }}>
            Your Vercel Postgres database is not configured!
          </p>
          <div style={{ marginTop: '16px' }}>
            <h4>📋 Setup Instructions:</h4>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              {dbCheckResult.instructions?.map((instruction, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>{instruction}</li>
              ))}
            </ol>
          </div>
          <div style={{ 
            backgroundColor: '#333', 
            padding: '12px', 
            borderRadius: '6px', 
            marginTop: '16px',
            fontSize: '14px'
          }}>
            <strong>Quick Link:</strong> <a 
              href="https://vercel.com/dashboard" 
              target="_blank" 
              style={{ color: '#36a2eb' }}
            >
              Go to Vercel Dashboard →
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div style={{
          ...cardStyle,
          backgroundColor: '#4a1a1a',
          border: '1px solid #f44336',
          color: '#f44336',
          marginBottom: '24px'
        }}>
          <h3>🚨 Errors Detected</h3>
          {errors.map((error, index) => (
            <div key={index} style={{ margin: '8px 0', fontSize: '14px' }}>
              • {error}
            </div>
          ))}
        </div>
      )}

      {/* Database Check Results */}
      {dbCheckResult && (
        <div style={{
          ...cardStyle,
          backgroundColor: dbCheckResult.success ? '#1a4a1a' : '#4a1a1a',
          border: `1px solid ${dbCheckResult.success ? '#22c55e' : '#f44336'}`,
          marginBottom: '24px'
        }}>
          <h2>🗄️ Database Connection Status</h2>
          <p><strong>Status:</strong> {dbCheckResult.success ? '✅ Connected' : '❌ Failed'}</p>
          <p><strong>Message:</strong> {dbCheckResult.message}</p>
          
          {dbCheckResult.connection_time_ms && (
            <p><strong>Connection Time:</strong> {dbCheckResult.connection_time_ms}ms</p>
          )}
          
          {dbCheckResult.environment && (
            <div style={{ marginTop: '12px' }}>
              <strong>Environment Check:</strong>
              <ul style={{ marginLeft: '20px' }}>
                <li>POSTGRES_URL: {dbCheckResult.environment.has_postgres_url ? '✅' : '❌'}</li>
                <li>POSTGRES_PRISMA_URL: {dbCheckResult.environment.has_prisma_url ? '✅' : '❌'}</li>
                <li>Environment: {dbCheckResult.environment.vercel_env || 'unknown'}</li>
              </ul>
            </div>
          )}
          
          {!dbCheckResult.success && dbCheckResult.details && (
            <div style={{ marginTop: '12px', color: '#f44336' }}>
              <strong>Error Details:</strong> {dbCheckResult.details}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <h2>📊 Current Status</h2>
          <p><strong>Database Connected:</strong> {dbCheckResult?.success ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Total Categories:</strong> {categories.length}</p>
          <p><strong>Main Categories:</strong> {mainCategories.length}</p>
          <p><strong>Subcategories:</strong> {subcategories.length}</p>
          <p><strong>Income Categories:</strong> {categories.filter(c => c.typ === 'einnahme').length}</p>
          <p><strong>Expense Categories:</strong> {categories.filter(c => c.typ === 'ausgabe').length}</p>
          <p><strong>Total Transactions:</strong> {transactions.length}</p>
        </div>

        <div style={cardStyle}>
          <h2>🎯 Next Steps</h2>
          {!dbCheckResult?.success && (
            <div>
              <p style={{color: '#f44336', fontWeight: 'bold'}}>🔥 URGENT: Set up Vercel Postgres database first!</p>
              <p style={{color: '#ff9800'}}>⚠️ All other features won't work until database is connected</p>
            </div>
          )}
          {dbCheckResult?.success && categories.length === 0 && (
            <p style={{color: '#ff9800'}}>⚠️ Database connected but empty - run setup to add categories</p>
          )}
          {categories.length > 0 && subcategories.length === 0 && (
            <p style={{color: '#ff9800'}}>⚠️ Categories exist but no subcategories - re-run setup</p>
          )}
          {categories.length > 0 && subcategories.length > 0 && (
            <p style={{color: '#4caf50'}}>✅ Everything looks good! Ready to use.</p>
          )}
        </div>
      </div>

      {/* Categories Display - only if we have data */}
      {categories.length > 0 && (
        <div>
          <h2>📁 Categories Found ({categories.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h3>💰 Income ({categories.filter(cat => cat.typ === 'einnahme').length})</h3>
              {categories.filter(cat => cat.typ === 'einnahme').slice(0, 10).map(category => (
                <div key={category.id} style={{
                  ...cardStyle,
                  backgroundColor: category.parent_id ? '#252525' : '#1e1e1e',
                  marginLeft: category.parent_id ? '20px' : '0px',
                  padding: '8px 12px'
                }}>
                  <span>
                    {category.parent_id && '↳ '}
                    {category.icon} {category.name}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <h3>💸 Expenses ({categories.filter(cat => cat.typ === 'ausgabe').length})</h3>
              {categories.filter(cat => cat.typ === 'ausgabe').slice(0, 10).map(category => (
                <div key={category.id} style={{
                  ...cardStyle,
                  backgroundColor: category.parent_id ? '#252525' : '#1e1e1e',
                  marginLeft: category.parent_id ? '20px' : '0px',
                  padding: '8px 12px'
                }}>
                  <span>
                    {category.parent_id && '↳ '}
                    {category.icon} {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Display - only if we have data */}
      {transactions.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2>📝 Recent Transactions ({transactions.length})</h2>
          <div style={cardStyle}>
            {transactions.slice(0, 5).map((transaction, index) => (
              <div key={transaction.id} style={{
                padding: '12px',
                borderBottom: index < 4 ? '1px solid #333' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {transaction.beschreibung || transaction.kategorie_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {transaction.konto_name} • {transaction.kategorie_name}
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 'bold',
                  color: transaction.typ === 'einnahme' ? '#22c55e' : '#f44336'
                }}>
                  {transaction.typ === 'einnahme' ? '+' : '-'}
                  {(transaction.betrag || 0).toFixed(2)}€
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
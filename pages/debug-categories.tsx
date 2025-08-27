// Improved Debug Page with Better Error Handling

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

interface DatabaseTestResult {
  success: boolean;
  message: string;
  connection_time_ms?: number;
  tables?: {
    existing: string[];
    missing: string[];
  };
  data_stats?: {
    categories?: { total: string; main_categories: string; subcategories: string };
    accounts?: { total: string };
    transactions?: { total: string };
  };
  environment?: {
    postgres_url_exists: boolean;
    vercel_env: string;
  };
  error?: string;
  details?: string;
}

export default function CategoryDebugPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<DatabaseTestResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    testDatabase();
  }, []);

  const testDatabase = async () => {
    setTestLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const result = await response.json();
      setDbTestResult(result);
      
      if (!result.success) {
        setErrors(prev => [...prev, `Database test failed: ${result.details || result.error}`]);
      }
    } catch (error) {
      console.error('Database test error:', error);
      setDbTestResult({
        success: false,
        message: 'Failed to test database connection',
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      setErrors(prev => [...prev, `Database test request failed: ${error}`]);
    } finally {
      setTestLoading(false);
    }
  };

  const loadData = async () => {
    const newErrors: string[] = [];
    
    try {
      // Load categories
      try {
        const categoriesRes = await fetch('/api/finanzen/kategorien');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          console.log('Categories from API:', categoriesData);
        } else {
          const errorText = await categoriesRes.text();
          newErrors.push(`Categories API failed (${categoriesRes.status}): ${errorText}`);
          setCategories([]);
        }
      } catch (error) {
        newErrors.push(`Categories API error: ${error}`);
        setCategories([]);
      }

      // Load transactions
      try {
        const transactionsRes = await fetch('/api/finanzen/transaktionen?limit=50');
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
          console.log('Transactions from API:', transactionsData);
        } else {
          const errorText = await transactionsRes.text();
          newErrors.push(`Transactions API failed (${transactionsRes.status}): ${errorText}`);
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
        await testDatabase();
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
    disabled: false,
  };

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const subcategories = categories.filter(cat => cat.parent_id);

  if (loading && testLoading) {
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
          onClick={testDatabase} 
          style={buttonStyle}
          disabled={testLoading}
        >
          {testLoading ? '🔄 Testing...' : '🔍 Test Database'}
        </button>
        <button 
          onClick={setupDatabase} 
          style={buttonStyle}
          disabled={setupLoading}
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

      {/* Database Test Results */}
      {dbTestResult && (
        <div style={{
          ...cardStyle,
          backgroundColor: dbTestResult.success ? '#1a4a1a' : '#4a1a1a',
          border: `1px solid ${dbTestResult.success ? '#22c55e' : '#f44336'}`,
          marginBottom: '24px'
        }}>
          <h2>🗄️ Database Connection Test</h2>
          <p><strong>Status:</strong> {dbTestResult.success ? '✅ Connected' : '❌ Failed'}</p>
          {dbTestResult.connection_time_ms && (
            <p><strong>Connection Time:</strong> {dbTestResult.connection_time_ms}ms</p>
          )}
          
          {dbTestResult.environment && (
            <div style={{ marginTop: '12px' }}>
              <strong>Environment:</strong>
              <ul style={{ marginLeft: '20px' }}>
                <li>Postgres URL configured: {dbTestResult.environment.postgres_url_exists ? '✅' : '❌'}</li>
                <li>Vercel Environment: {dbTestResult.environment.vercel_env || 'unknown'}</li>
              </ul>
            </div>
          )}

          {dbTestResult.tables && (
            <div style={{ marginTop: '12px' }}>
              <strong>Database Tables:</strong>
              <ul style={{ marginLeft: '20px' }}>
                <li>Existing: {dbTestResult.tables.existing.join(', ') || 'None'}</li>
                <li>Missing: {dbTestResult.tables.missing.join(', ') || 'None'}</li>
              </ul>
            </div>
          )}

          {dbTestResult.data_stats && (
            <div style={{ marginTop: '12px' }}>
              <strong>Data Statistics:</strong>
              <ul style={{ marginLeft: '20px' }}>
                {dbTestResult.data_stats.categories && (
                  <li>Categories: {dbTestResult.data_stats.categories.total} total ({dbTestResult.data_stats.categories.main_categories} main, {dbTestResult.data_stats.categories.subcategories} sub)</li>
                )}
                {dbTestResult.data_stats.accounts && (
                  <li>Accounts: {dbTestResult.data_stats.accounts.total}</li>
                )}
                {dbTestResult.data_stats.transactions && (
                  <li>Transactions: {dbTestResult.data_stats.transactions.total}</li>
                )}
              </ul>
            </div>
          )}
          
          {!dbTestResult.success && (
            <div style={{ marginTop: '12px', color: '#f44336' }}>
              <strong>Error:</strong> {dbTestResult.details || dbTestResult.error}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <h2>📊 Current Status</h2>
          <p><strong>Total Categories:</strong> {categories.length}</p>
          <p><strong>Main Categories:</strong> {mainCategories.length}</p>
          <p><strong>Subcategories:</strong> {subcategories.length}</p>
          <p><strong>Income Categories:</strong> {categories.filter(c => c.typ === 'einnahme').length}</p>
          <p><strong>Expense Categories:</strong> {categories.filter(c => c.typ === 'ausgabe').length}</p>
          <p><strong>Total Transactions:</strong> {transactions.length}</p>
        </div>

        <div style={cardStyle}>
          <h2>🎯 Recommendations</h2>
          {dbTestResult?.success === false && (
            <p style={{color: '#f44336'}}>❌ Fix database connection first</p>
          )}
          {categories.length === 0 && dbTestResult?.success !== false && (
            <p style={{color: '#f44336'}}>❌ Run database setup to create categories</p>
          )}
          {subcategories.length === 0 && categories.length > 0 && (
            <p style={{color: '#ff9800'}}>⚠️ No subcategories found - setup may have failed partially</p>
          )}
          {categories.length > 0 && subcategories.length > 0 && (
            <p style={{color: '#4caf50'}}>✅ Database looks good!</p>
          )}
          {transactions.length === 0 && categories.length > 0 && (
            <p style={{color: '#36a2eb'}}>💡 Ready to add transactions</p>
          )}
        </div>
      </div>

      {/* Categories Display */}
      {categories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h2>💰 Income Categories ({categories.filter(cat => cat.typ === 'einnahme').length})</h2>
            {categories.filter(cat => cat.typ === 'einnahme').map(category => (
              <div key={category.id}>
                <div style={{
                  ...cardStyle,
                  backgroundColor: category.parent_id ? '#252525' : '#1e1e1e',
                  marginLeft: category.parent_id ? '20px' : '0px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {category.parent_id && <span style={{ marginRight: '8px', color: '#666' }}>↳</span>}
                    <span style={{ fontSize: '20px', marginRight: '12px' }}>{category.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{category.name}</div>
                      {category.parent_name && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Parent: {category.parent_name}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        ID: {category.id} | Type: {category.typ}
                        {category.parent_id && ` | Parent ID: ${category.parent_id}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2>💸 Expense Categories ({categories.filter(cat => cat.typ === 'ausgabe').length})</h2>
            {categories.filter(cat => cat.typ === 'ausgabe').map(category => (
              <div key={category.id}>
                <div style={{
                  ...cardStyle,
                  backgroundColor: category.parent_id ? '#252525' : '#1e1e1e',
                  marginLeft: category.parent_id ? '20px' : '0px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {category.parent_id && <span style={{ marginRight: '8px', color: '#666' }}>↳</span>}
                    <span style={{ fontSize: '20px', marginRight: '12px' }}>{category.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{category.name}</div>
                      {category.parent_name && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Parent: {category.parent_name}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        ID: {category.id} | Type: {category.typ}
                        {category.parent_id && ` | Parent ID: ${category.parent_id}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Display */}
      {transactions.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2>📝 Recent Transactions ({transactions.length})</h2>
          <div style={cardStyle}>
            {transactions.slice(0, 10).map((transaction, index) => {
              const category = categories.find(cat => cat.id === transaction.kategorie_id);
              return (
                <div key={transaction.id} style={{
                  padding: '12px',
                  borderBottom: index < 9 ? '1px solid #333' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginRight: '12px' }}>
                      {transaction.kategorie_icon || '💰'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {transaction.beschreibung || transaction.kategorie_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {transaction.konto_name} • {transaction.kategorie_name}
                        {category?.parent_name && ` (${category.parent_name})`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        Category ID: {transaction.kategorie_id} • Transaction ID: {transaction.id}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: transaction.typ === 'einnahme' ? '#22c55e' : '#f44336'
                  }}>
                    {transaction.typ === 'einnahme' ? '+' : '-'}
                    {transaction.betrag.toFixed(2)}€
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#333', borderRadius: '8px' }}>
        <h3>🔧 Troubleshooting Steps:</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>If database test fails: Check Vercel Postgres configuration</li>
          <li>If no categories exist: Click "Run Database Setup"</li>
          <li>If setup fails: Check browser console (F12) for detailed errors</li>
          <li>If categories exist but subcategories are missing: Re-run setup</li>
          <li>If data doesn't display: Check API endpoints and CORS settings</li>
        </ol>
      </div>
    </div>
  );
}
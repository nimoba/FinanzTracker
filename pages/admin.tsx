import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface DbInfo {
  connectionStatus: string;
  environmentVariables: Record<string, boolean>;
  tableInfo: Record<string, number | string | boolean>;
  error?: string;
  timestamp: string;
}

export default function AdminPage() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [migrateResult, setMigrateResult] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDbInfo();
  }, []);

  const loadDbInfo = async () => {
    try {
      const response = await fetch('/api/finanzen/dbinfo');
      const data = await response.json();
      setDbInfo(data);
    } catch (error) {
      console.error('Error loading db info:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setMigrateLoading(true);
    setMigrateResult('');
    
    try {
      const response = await fetch('/api/finanzen/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setMigrateResult(`✅ ${data.message}`);
        // Reload db info to see changes
        await loadDbInfo();
      } else {
        setMigrateResult(`❌ ${data.error}`);
      }
    } catch (error) {
      setMigrateResult(`❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setMigrateLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
    fontFamily: "monospace",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #333',
    marginBottom: '20px',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#36a2eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '12px',
  };

  const statusStyle = (status: string): React.CSSProperties => ({
    color: status === 'connected' ? '#22c55e' : '#f44336',
    fontWeight: 'bold',
  });

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: 100 }}>Loading database info...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>🔧 Database Admin</h1>
        <button 
          onClick={() => router.push('/')}
          style={{ ...buttonStyle, backgroundColor: '#666' }}
        >
          ← Back to App
        </button>
      </div>

      {dbInfo && (
        <>
          <div style={cardStyle}>
            <h2>📡 Connection Status</h2>
            <p style={statusStyle(dbInfo.connectionStatus)}>
              {dbInfo.connectionStatus.toUpperCase()}
            </p>
            {dbInfo.error && (
              <p style={{ color: '#f44336' }}>Error: {dbInfo.error}</p>
            )}
            <p style={{ color: '#666', fontSize: '12px' }}>
              Last checked: {new Date(dbInfo.timestamp).toLocaleString()}
            </p>
          </div>

          <div style={cardStyle}>
            <h2>🌐 Environment Variables</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(dbInfo.environmentVariables).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{key}:</span>
                  <span style={{ color: value ? '#22c55e' : '#f44336' }}>
                    {value ? '✓ Set' : '✗ Not Set'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <h2>🗄️ Database Tables</h2>
            {Object.keys(dbInfo.tableInfo).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {Object.entries(dbInfo.tableInfo).map(([table, count]) => (
                  <div key={table} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{table}:</span>
                    <span style={{ 
                      color: table === 'kategorien_has_parent_id' 
                        ? (count ? '#22c55e' : '#f44336')
                        : '#ccc'
                    }}>
                      {table === 'kategorien_has_parent_id' 
                        ? (count ? '✓ Has parent_id column' : '✗ Missing parent_id column')
                        : `${count} rows`
                      }
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#f44336' }}>No tables found or connection failed</p>
            )}
          </div>

          <div style={cardStyle}>
            <h2>🔄 Database Migration</h2>
            <p style={{ color: '#ccc', marginBottom: '16px' }}>
              Run this to add subcategories to your existing database:
            </p>
            <button 
              onClick={runMigration}
              disabled={migrateLoading}
              style={{
                ...buttonStyle,
                opacity: migrateLoading ? 0.7 : 1,
                cursor: migrateLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {migrateLoading ? 'Running Migration...' : 'Run Migration'}
            </button>
            <button 
              onClick={loadDbInfo}
              style={{ ...buttonStyle, backgroundColor: '#666' }}
            >
              Refresh Info
            </button>
            {migrateResult && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                borderRadius: '6px',
                backgroundColor: migrateResult.startsWith('✅') ? '#1a4d3a' : '#4d1a1a'
              }}>
                {migrateResult}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2>🔗 Database Access</h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              To access your Vercel Postgres database externally:
            </p>
            <ol style={{ color: '#ccc', lineHeight: '1.8' }}>
              <li>Go to your <strong>Vercel Dashboard</strong></li>
              <li>Navigate to your project → <strong>Storage</strong> tab</li>
              <li>Click on your Postgres database</li>
              <li>Use the connection details with tools like:</li>
              <ul style={{ marginTop: '8px' }}>
                <li><strong>pgAdmin</strong> - GUI database manager</li>
                <li><strong>TablePlus</strong> - Modern database client</li>
                <li><strong>DBeaver</strong> - Universal database tool</li>
                <li><strong>psql</strong> - Command line interface</li>
              </ul>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
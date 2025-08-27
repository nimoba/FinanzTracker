// Create this as pages/debug-categories.tsx

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

export default function CategoryDebugPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, transactionsRes] = await Promise.all([
        fetch('/api/finanzen/kategorien'),
        fetch('/api/finanzen/transaktionen?limit=50')
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        console.log('Categories from API:', categoriesData);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        console.log('Transactions from API:', transactionsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    setSetupLoading(true);
    try {
      const response = await fetch('/api/finanzen/setup', {
        method: 'POST',
      });
      
      const result = await response.json();
      console.log('Setup result:', result);
      alert('Database setup completed! Check console for details.');
      await loadData();
    } catch (error) {
      console.error('Setup error:', error);
      alert('Setup failed. Check console for details.');
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

  if (loading) {
    return <div style={containerStyle}>Loading...</div>;
  }

  return (
    <div style={containerStyle}>
      <h1>🔍 Category & Transaction Debug</h1>
      
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={setupDatabase} 
          style={buttonStyle}
          disabled={setupLoading}
        >
          {setupLoading ? 'Setting up...' : '🔧 Run Database Setup'}
        </button>
        <button 
          onClick={loadData} 
          style={buttonStyle}
        >
          🔄 Reload Data
        </button>
        <button 
          onClick={() => window.location.href = '/'} 
          style={{...buttonStyle, backgroundColor: '#666'}}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <h2>📊 Database Summary</h2>
          <p><strong>Total Categories:</strong> {categories.length}</p>
          <p><strong>Main Categories:</strong> {mainCategories.length}</p>
          <p><strong>Subcategories:</strong> {subcategories.length}</p>
          <p><strong>Income Categories:</strong> {categories.filter(c => c.typ === 'einnahme').length}</p>
          <p><strong>Expense Categories:</strong> {categories.filter(c => c.typ === 'ausgabe').length}</p>
          <p><strong>Total Transactions:</strong> {transactions.length}</p>
        </div>

        <div style={cardStyle}>
          <h2>🚨 Potential Issues</h2>
          {categories.length === 0 && <p style={{color: '#f44336'}}>❌ No categories found - database might not be set up</p>}
          {subcategories.length === 0 && categories.length > 0 && <p style={{color: '#ff9800'}}>⚠️ No subcategories found</p>}
          {transactions.length === 0 && <p style={{color: '#ff9800'}}>⚠️ No transactions found</p>}
          {categories.length > 0 && subcategories.length > 0 && <p style={{color: '#4caf50'}}>✅ Categories and subcategories exist</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h2>💰 Income Categories</h2>
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
          <h2>💸 Expense Categories</h2>
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

      <div style={{ marginTop: '32px' }}>
        <h2>📝 Recent Transactions (showing category relationships)</h2>
        <div style={cardStyle}>
          {transactions.length > 0 ? transactions.slice(0, 10).map((transaction, index) => {
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
          }) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No transactions found
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#333', borderRadius: '8px' }}>
        <h3>🔧 Next Steps:</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>If you see "No categories found", click "Run Database Setup"</li>
          <li>Check if subcategories show with "↳" symbol and parent names</li>
          <li>Verify transactions show proper category relationships</li>
          <li>If issues persist, check browser console (F12) for errors</li>
        </ol>
      </div>
    </div>
  );
}
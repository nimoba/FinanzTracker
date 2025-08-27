import { useState } from 'react';
import { useRouter } from 'next/router';

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSetup = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/finanzen/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Database setup successful!');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (err) {
      setError('Connection failed. Please check your database configuration.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#2c2c2c',
    color: '#ffffff',
    padding: '24px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    padding: '40px',
    borderRadius: '12px',
    border: '1px solid #333',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
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
    marginTop: '20px',
    width: '100%',
  };

  const messageStyle: React.CSSProperties = {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: '#22c55e',
    color: '#fff',
  };

  const errorStyle: React.CSSProperties = {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: '#f44336',
    color: '#fff',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>🗄️ Database Setup</h1>
        <p style={{ marginBottom: '24px', color: '#ccc', lineHeight: '1.5' }}>
          Initialize your database tables and default data. This needs to be done once before using the application.
        </p>
        
        <button 
          onClick={handleSetup} 
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Setting up...' : 'Initialize Database'}
        </button>

        {message && <div style={messageStyle}>{message}</div>}
        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
          <p>This will create:</p>
          <ul style={{ textAlign: 'left', marginTop: '10px' }}>
            <li>Categories (Income & Expense)</li>
            <li>Accounts table</li>
            <li>Transactions table</li>
            <li>Budgets table</li>
            <li>Savings goals table</li>
            <li>Default account (Girokonto)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
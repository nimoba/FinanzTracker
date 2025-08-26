import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';

const COOKIE_NAME = "app_access_token";

function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function PasswordScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setCookie(COOKIE_NAME, "authenticated", 30);
        onSuccess();
      } else {
        setError('Falsches Passwort');
      }
    } catch (err) {
      setError('Fehler beim Anmelden');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2c',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 32,
    border: '1px solid #333',
    width: '100%',
    maxWidth: 400,
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#36a2eb',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    border: '1px solid #555',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    marginBottom: 16,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: loading ? '#666' : '#36a2eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
  };

  const errorStyle: React.CSSProperties = {
    color: '#f44336',
    fontSize: 14,
    marginTop: 8,
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
        <h1 style={titleStyle}>FinanceFlow</h1>
        <p style={subtitleStyle}>Persönlicher Finanz-Tracker</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Passwort eingeben"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            disabled={loading}
            required
          />
          
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
          
          {error && <div style={errorStyle}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAuth = getCookie(COOKIE_NAME);
    if (savedAuth === "authenticated") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    const loadingStyle: React.CSSProperties = {
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2c2c2c',
      color: '#fff',
    };

    return (
      <div style={loadingStyle}>
        <div>Laden...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <Component {...pageProps} />;
}
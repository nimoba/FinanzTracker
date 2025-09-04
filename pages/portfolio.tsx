import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingTabBar from '@/components/FloatingTabBar';

interface Portfolio {
  id: number;
  name: string;
  description: string;
  holdings_count: number;
  total_value: number;
  total_cost: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  created_at: string;
}

interface Holding {
  id: number;
  symbol: string;
  name: string;
  total_quantity: number;
  avg_purchase_price: number;
  current_price: number;
  current_value: number;
  total_cost: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  currency: string;
  last_updated: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfoliosResponse, holdingsResponse] = await Promise.all([
        fetch('/api/portfolio'),
        fetch('/api/portfolio/holdings')
      ]);

      if (portfoliosResponse.ok) {
        const portfoliosData = await portfoliosResponse.json();
        setPortfolios(portfoliosData);
      }

      if (holdingsResponse.ok) {
        const holdingsData = await holdingsResponse.json();
        setHoldings(holdingsData);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/portfolio/sync-prices', {
        method: 'POST'
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error syncing prices:', error);
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + p.total_value, 0);
  const totalUnrealizedPnL = portfolios.reduce((sum, p) => sum + p.unrealized_pnl, 0);

  const containerStyle: React.CSSProperties = {
    padding: "12px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
    paddingBottom: "100px",
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #333',
    marginBottom: 16,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#36a2eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: 100 }}>Lade Portfolio...</div>
        <FloatingTabBar />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>
          📊 Portfolio
        </h1>
        <button
          onClick={handleSyncPrices}
          disabled={syncing}
          style={{
            ...buttonStyle,
            backgroundColor: syncing ? '#666' : '#22c55e'
          }}
        >
          {syncing ? '🔄 Aktualisiere...' : '📈 Preise aktualisieren'}
        </button>
      </div>

      {/* Portfolio Summary */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Gesamtübersicht</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>Gesamtwert</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {formatCurrency(totalPortfolioValue)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>Unrealisierter Gewinn/Verlust</div>
            <div style={{ 
              fontSize: 20, 
              color: totalUnrealizedPnL >= 0 ? '#22c55e' : '#f44336',
              fontWeight: 'bold'
            }}>
              {formatCurrency(totalUnrealizedPnL)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>Anzahl Positionen</div>
            <div style={{ fontSize: 20 }}>{holdings.length}</div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      {holdings.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Positionen</h2>
          <div style={cardStyle}>
            {holdings.map((holding) => (
              <div key={holding.id} style={{ 
                borderBottom: '1px solid #333', 
                padding: '12px 0',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {holding.symbol} {holding.name && `- ${holding.name}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {holding.total_quantity} × {formatCurrency(holding.avg_purchase_price)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {formatCurrency(holding.current_value)}
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    color: holding.unrealized_pnl >= 0 ? '#22c55e' : '#f44336'
                  }}>
                    {formatPercent(holding.unrealized_pnl_percent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add buttons */}
      <button
        onClick={() => setShowAddHolding(true)}
        style={{
          ...buttonStyle,
          position: 'fixed',
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          fontSize: 24,
          padding: 0
        }}
      >
        +
      </button>

      <FloatingTabBar />
    </div>
  );
}
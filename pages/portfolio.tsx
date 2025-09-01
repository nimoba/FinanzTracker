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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Price sync result:', result);
        await loadData(); // Reload data to show updated prices
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

  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + parseFloat(p.total_value.toString()), 0);
  const totalPortfolioCost = portfolios.reduce((sum, p) => sum + parseFloat(p.total_cost.toString()), 0);
  const totalUnrealizedPnL = totalPortfolioValue - totalPortfolioCost;
  const totalUnrealizedPercent = totalPortfolioCost > 0 ? (totalUnrealizedPnL / totalPortfolioCost) * 100 : 0;

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
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>
              {formatCurrency(totalPortfolioValue)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>Investiert</div>
            <div style={{ fontSize: 16 }}>{formatCurrency(totalPortfolioCost)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>Gewinn/Verlust</div>
            <div style={{ 
              fontSize: 16, 
              color: totalUnrealizedPnL >= 0 ? '#22c55e' : '#f44336',
              fontWeight: 'bold'
            }}>
              {formatCurrency(totalUnrealizedPnL)} ({formatPercent(totalUnrealizedPercent)})
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>Positionen</div>
            <div style={{ fontSize: 16 }}>{holdings.length}</div>
          </div>
        </div>
      </div>

      {/* Portfolios List */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Portfolios</h2>
          <button
            onClick={() => setShowAddPortfolio(true)}
            style={buttonStyle}
          >
            + Portfolio hinzufügen
          </button>
        </div>

        {portfolios.map((portfolio) => (
          <div key={portfolio.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{portfolio.name}</h3>
                {portfolio.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#999' }}>
                    {portfolio.description}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#999' }}>Wert</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {formatCurrency(portfolio.total_value)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#999' }}>P&L</div>
                    <div style={{ 
                      fontSize: 14, 
                      color: portfolio.unrealized_pnl >= 0 ? '#22c55e' : '#f44336',
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(portfolio.unrealized_pnl)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#999' }}>Positionen</div>
                    <div style={{ fontSize: 14 }}>{portfolio.holdings_count}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/portfolio/${portfolio.id}`)}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#333',
                  fontSize: 12,
                  padding: '6px 12px'
                }}
              >
                Details →
              </button>
            </div>
          </div>
        ))}

        {portfolios.length === 0 && (
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              Noch keine Portfolios vorhanden
              <br />
              <button
                onClick={() => setShowAddPortfolio(true)}
                style={{ ...buttonStyle, marginTop: 12 }}
              >
                Erstes Portfolio erstellen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Holdings Overview */}
      {holdings.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Alle Positionen</h2>
            <button
              onClick={() => setShowAddHolding(true)}
              style={buttonStyle}
            >
              + Position hinzufügen
            </button>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {holdings.slice(0, 5).map((holding) => (
                <div key={holding.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #333'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>
                      {holding.symbol} {holding.name && `• ${holding.name}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {holding.total_quantity} × {formatCurrency(holding.current_price)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {formatCurrency(holding.current_value)}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: holding.unrealized_pnl >= 0 ? '#22c55e' : '#f44336'
                    }}>
                      {formatPercent(holding.unrealized_pnl_percent)}
                    </div>
                  </div>
                </div>
              ))}
              
              {holdings.length > 5 && (
                <div style={{ textAlign: 'center', padding: 8, color: '#999', fontSize: 12 }}>
                  ... und {holdings.length - 5} weitere Positionen
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FloatingTabBar />
    </div>
  );
}
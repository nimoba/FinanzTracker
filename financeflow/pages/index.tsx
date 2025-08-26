import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingTabBar from '@/components/FloatingTabBar';
import StatsCard from '@/components/StatsCard';
import TransactionForm from '@/components/TransactionForm';

interface DashboardData {
  gesamtsaldo: number;
  monatliche_einnahmen: number;
  monatliche_ausgaben: number;
  gesamt_budgets: number;
  ueberschrittene_budgets: number;
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
}

//
export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryResponse, transactionsResponse] = await Promise.all([
        fetch('/api/finanzen/analysen?type=summary'),
        fetch('/api/finanzen/transaktionen?limit=10')
      ]);

      const summaryData = await summaryResponse.json();
      const transactionsData = await transactionsResponse.json();

      setSummary(summaryData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (transactionData: any) => {
    try {
      const response = await fetch('/api/finanzen/transaktionen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        setShowTransactionForm(false);
        loadDashboardData(); // Reload data to reflect changes
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
    paddingBottom: "100px",
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 0,
  };

  const appSwitcherStyle: React.CSSProperties = {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    cursor: 'pointer',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 32,
  };

  const transactionListStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    border: '1px solid #333',
  };

  const transactionItemStyle: React.CSSProperties = {
    padding: 16,
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const floatingButtonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#36a2eb',
    color: '#fff',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 99,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: 100 }}>Laden...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>💰 FinanceFlow</h1>
        <button 
          style={appSwitcherStyle}
          onClick={() => window.open('http://localhost:3001', '_blank')}
        >
          🍽️ Zur Kalorienverfolgung
        </button>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <StatsCard
            icon="💰"
            title="Gesamtsaldo"
            value={formatCurrency(summary.gesamtsaldo || 0)}
            color="#4caf50"
          />
          <StatsCard
            icon="📈"
            title="Monatliche Einnahmen"
            value={formatCurrency(summary.monatliche_einnahmen || 0)}
            color="#22c55e"
          />
          <StatsCard
            icon="📉"
            title="Monatliche Ausgaben"
            value={formatCurrency(summary.monatliche_ausgaben || 0)}
            color="#f44336"
          />
          <StatsCard
            icon="📊"
            title="Budget-Status"
            value={`${summary.ueberschrittene_budgets || 0} / ${summary.gesamt_budgets || 0}`}
            subtitle="Überschrittene Budgets"
            color={summary.ueberschrittene_budgets > 0 ? "#f44336" : "#4caf50"}
          />
        </div>
      )}

      <h2 style={sectionTitleStyle}>Letzte Transaktionen</h2>
      
      {transactions.length > 0 ? (
        <div style={transactionListStyle}>
          {transactions.map((transaction, index) => (
            <div 
              key={transaction.id} 
              style={{
                ...transactionItemStyle,
                borderBottom: index === transactions.length - 1 ? 'none' : '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 20, marginRight: 12 }}>
                  {transaction.kategorie_icon || '💰'}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {transaction.beschreibung || transaction.kategorie_name}
                  </div>
                  <div style={{ fontSize: 14, color: '#999' }}>
                    {transaction.konto_name} • {formatDate(transaction.datum)}
                  </div>
                </div>
              </div>
              <div style={{ 
                fontWeight: 'bold',
                color: transaction.typ === 'einnahme' ? '#22c55e' : '#f44336'
              }}>
                {transaction.typ === 'einnahme' ? '+' : '-'}{formatCurrency(transaction.betrag)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#1e1e1e', 
          padding: 40, 
          textAlign: 'center', 
          borderRadius: 12,
          border: '1px solid #333',
          color: '#999'
        }}>
          Noch keine Transaktionen vorhanden
        </div>
      )}

      <button 
        style={floatingButtonStyle}
        onClick={() => setShowTransactionForm(true)}
        title="Neue Transaktion"
      >
        +
      </button>

      {showTransactionForm && (
        <TransactionForm
          onSave={handleSaveTransaction}
          onCancel={() => setShowTransactionForm(false)}
        />
      )}

      <FloatingTabBar />
    </div>
  );
}
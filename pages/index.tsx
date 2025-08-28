// Updated dashboard with proper subcategory display

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingTabBar from '@/components/FloatingTabBar';
import StatsCard from '@/components/StatsCard';
import TransactionForm from '@/components/TransactionForm';
import TransferForm from '@/components/TransferForm';

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
  typ: 'einnahme' | 'ausgabe' | 'transfer_out' | 'transfer_in';
  datum: string;
  beschreibung: string;
  konto_name: string;
  kategorie_name: string;
  kategorie_icon: string;
  kategorie_id: number;
  is_transfer?: boolean;
  display_beschreibung?: string;
  ziel_konto_name?: string;
  transfer_id?: string;
}

interface Category {
  id: number;
  name: string;
  typ: string;
  icon: string;
  parent_id?: number;
  parent_name?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryResponse, transactionsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/finanzen/analysen?type=summary'),
        fetch('/api/finanzen/transaktionen?limit=10'),
        fetch('/api/finanzen/kategorien')
      ]);

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      } else {
        console.error('Summary API Error:', summaryResponse.status);
        setSummary(null);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        if (Array.isArray(transactionsData)) {
          setTransactions(transactionsData);
        } else {
          console.error('Invalid transactions data format:', transactionsData);
          setTransactions([]);
        }
      } else {
        console.error('Transactions API Error:', transactionsResponse.status);
        setTransactions([]);
      }

      // Load categories for better display
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error('Invalid categories data format:', categoriesData);
          setCategories([]);
        }
      } else {
        console.error('Categories API Error:', categoriesResponse.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSummary(null);
      setTransactions([]);
      setCategories([]);
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

  const handleSaveTransfer = async (transferData: any) => {
    try {
      const response = await fetch('/api/finanzen/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });

      if (response.ok) {
        setShowTransferForm(false);
        loadDashboardData(); // Reload data to reflect changes
      }
    } catch (error) {
      console.error('Error saving transfer:', error);
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
    padding: "12px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
    paddingBottom: "100px",
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 0,
  };

  const appSwitcherStyle: React.CSSProperties = {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
    marginRight: '8px',
    marginBottom: '8px',
    whiteSpace: 'nowrap' as const,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 20,
  };

  const transactionListStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    border: '1px solid #333',
  };

  const transactionItemStyle: React.CSSProperties = {
    padding: 12,
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  };

  const floatingButtonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 100,
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
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <button 
            style={appSwitcherStyle}
            onClick={() => window.open('/debug-categories', '_blank')}
          >
            🔍 Debug
          </button>
          <button 
            style={appSwitcherStyle}
            onClick={() => router.push('/kategorien')}
          >
            🏷️ Kategorien
          </button>
          <button 
            style={appSwitcherStyle}
            onClick={() => window.open('http://localhost:3001', '_blank')}
          >
            🍽️ Kalorien
          </button>
        </div>
      </div>

      {/* Database Status Warning */}
      {categories.length === 0 && (
        <div style={{
          backgroundColor: '#4a1a1a',
          border: '1px solid #f44336',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          color: '#f44336'
        }}>
          ⚠️ <strong>Datenbank noch nicht eingerichtet!</strong> 
          <button 
            onClick={() => window.open('/debug-categories', '_blank')}
            style={{
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              marginLeft: 8,
              cursor: 'pointer'
            }}
          >
            Jetzt einrichten
          </button>
        </div>
      )}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          <StatsCard
            icon="💰"
            title="Gesamtsaldo"
            value={formatCurrency(summary.gesamtsaldo || 0)}
            color={summary.gesamtsaldo >= 0 ? "#4caf50" : "#f44336"}
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

      <h2 style={sectionTitleStyle}>
        Letzte Transaktionen
        {categories.filter(cat => cat.parent_id).length > 0 && (
          <span style={{ fontSize: 14, color: '#4caf50', marginLeft: 8 }}>
            ✅ Mit Unterkategorien
          </span>
        )}
      </h2>
      
      {transactions.length > 0 ? (
        <div style={transactionListStyle}>
          {transactions.map((transaction, index) => {
            const category = categories.find(cat => cat.id === transaction.kategorie_id);
            return (
              <div 
                key={transaction.id} 
                style={{
                  ...transactionItemStyle,
                  borderBottom: index === transactions.length - 1 ? 'none' : '1px solid #333'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 18, marginRight: 10, flexShrink: 0 }}>
                    {transaction.is_transfer ? (
                      transaction.typ === 'transfer_out' ? '📤' : '📥'
                    ) : (
                      transaction.kategorie_icon || '💰'
                    )}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: 14,
                      lineHeight: '1.3',
                      marginBottom: 4,
                      wordBreak: 'break-word' as const
                    }}>
                      {transaction.is_transfer ? 
                        transaction.display_beschreibung || transaction.beschreibung :
                        transaction.beschreibung || transaction.kategorie_name
                      }
                    </div>
                    <div style={{ fontSize: 12, color: '#999', lineHeight: '1.4' }}>
                      <div>{transaction.konto_name}
                        {transaction.is_transfer && transaction.ziel_konto_name && (
                          <span style={{ color: '#36a2eb' }}>
                            {transaction.typ === 'transfer_out' ? ' → ' : ' ← '}
                            {transaction.ziel_konto_name}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        {!transaction.is_transfer && (
                          <span>
                            {category?.parent_name ? (
                              <span>
                                <span style={{ color: '#666' }}>{category.parent_name}</span>
                                <span style={{ color: '#36a2eb', margin: '0 4px' }}> › </span>
                                <span>{category.name}</span>
                              </span>
                            ) : (
                              transaction.kategorie_name
                            )}
                            {' • '}
                          </span>
                        )}
                        {formatDate(transaction.datum)}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 'bold',
                  fontSize: 14,
                  textAlign: 'right',
                  flexShrink: 0,
                  color: transaction.is_transfer ? 
                    (transaction.typ === 'transfer_out' ? '#f44336' : '#22c55e') :
                    (transaction.typ === 'einnahme' ? '#22c55e' : '#f44336')
                }}>
                  {transaction.is_transfer ? (
                    transaction.typ === 'transfer_out' ? '-' : '+'
                  ) : (
                    transaction.typ === 'einnahme' ? '+' : '-'
                  )}{formatCurrency(Math.abs(transaction.betrag))}
                </div>
              </div>
            );
          })}
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
          <br />
          <button 
            onClick={() => setShowTransactionForm(true)}
            style={{
              backgroundColor: '#36a2eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              marginTop: 12,
              cursor: 'pointer'
            }}
          >
            Erste Transaktion hinzufügen
          </button>
        </div>
      )}

      {/* Floating Action Menu */}
      <div style={{ position: 'fixed', bottom: 100, right: 16, zIndex: 99 }}>
        {showActionMenu && (
          <div style={{
            position: 'absolute',
            bottom: 70,
            right: 0,
            backgroundColor: '#1e1e1e',
            borderRadius: 12,
            padding: 8,
            border: '1px solid #333',
            minWidth: 180,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <button
              onClick={() => {
                setShowTransactionForm(true);
                setShowActionMenu(false);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                marginBottom: 4,
                fontSize: 14
              }}
            >
              <span style={{ marginRight: 8 }}>💰</span>
              Neue Transaktion
            </button>
            <button
              onClick={() => {
                setShowTransferForm(true);
                setShowActionMenu(false);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                fontSize: 14
              }}
            >
              <span style={{ marginRight: 8 }}>🔄</span>
              Geld übertragen
            </button>
          </div>
        )}
        
        <button 
          style={floatingButtonStyle}
          onClick={() => setShowActionMenu(!showActionMenu)}
          title="Aktionen"
        >
          {showActionMenu ? '×' : '+'}
        </button>
      </div>

      {showTransactionForm && (
        <TransactionForm
          onSave={handleSaveTransaction}
          onCancel={() => setShowTransactionForm(false)}
        />
      )}

      {showTransferForm && (
        <TransferForm
          onSave={handleSaveTransfer}
          onCancel={() => setShowTransferForm(false)}
        />
      )}

      <FloatingTabBar />
    </div>
  );
}
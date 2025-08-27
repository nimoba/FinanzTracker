import { useState, useEffect } from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';
import TransactionForm from '@/components/TransactionForm';

interface Transaction {
  id: number;
  betrag: number;
  typ: 'einnahme' | 'ausgabe';
  datum: string;
  beschreibung: string;
  konto_name: string;
  konto_id: number;
  kategorie_name: string;
  kategorie_id: number;
  kategorie_icon: string;
}

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  typ: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    konto_id: '',
    kategorie_id: '',
    typ: '',
    from: '',
    to: '',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadData = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        fetch('/api/finanzen/konten'),
        fetch('/api/finanzen/kategorien')
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (Array.isArray(accountsData)) {
          setAccounts(accountsData);
        } else {
          console.error('Invalid accounts data format:', accountsData);
          setAccounts([]);
        }
      } else {
        console.error('Accounts API Error:', accountsRes.status);
        setAccounts([]);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error('Invalid categories data format:', categoriesData);
          setCategories([]);
        }
      } else {
        console.error('Categories API Error:', categoriesRes.status);
        setCategories([]);
      }
      
      await loadTransactions();
    } catch (error) {
      console.error('Error loading data:', error);
      setAccounts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/finanzen/transaktionen?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          console.error('Invalid transactions data format:', data);
          setTransactions([]);
        }
      } else {
        console.error('Transactions API Error:', response.status);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
  };

  const handleSaveTransaction = async (transactionData: any) => {
    try {
      const url = editingTransaction 
        ? `/api/finanzen/transaktionen`
        : '/api/finanzen/transaktionen';
      
      const method = editingTransaction ? 'PUT' : 'POST';
      const body = editingTransaction 
        ? { ...transactionData, id: editingTransaction.id }
        : transactionData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowTransactionForm(false);
        setEditingTransaction(null);
        loadTransactions();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Transaktion wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/finanzen/transaktionen?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
    paddingBottom: "100px",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: 24,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  };

  const filtersStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
    marginBottom: 24,
  };

  const inputStyle: React.CSSProperties = {
    padding: 12,
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #555',
    backgroundColor: '#2a2a2a',
    color: '#fff',
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

  const actionButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#36a2eb',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 8,
    fontSize: 14,
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

  const filteredTransactions = transactions.filter(transaction => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      transaction.beschreibung?.toLowerCase().includes(search) ||
      transaction.kategorie_name?.toLowerCase().includes(search) ||
      transaction.konto_name?.toLowerCase().includes(search)
    );
  });

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
        <h1 style={titleStyle}>💳 Transaktionen</h1>
        
        <div style={filtersStyle}>
          <input
            type="text"
            placeholder="Suchen..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={inputStyle}
          />
          
          <select
            value={filters.konto_id}
            onChange={(e) => setFilters({ ...filters, konto_id: e.target.value })}
            style={inputStyle}
          >
            <option value="">Alle Konten</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>

          <select
            value={filters.kategorie_id}
            onChange={(e) => setFilters({ ...filters, kategorie_id: e.target.value })}
            style={inputStyle}
          >
            <option value="">Alle Kategorien</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.parent_id ? '  ↳ ' : ''}{category.icon} {category.name}
              </option>
            ))}
          </select>

          <select
            value={filters.typ}
            onChange={(e) => setFilters({ ...filters, typ: e.target.value })}
            style={inputStyle}
          >
            <option value="">Alle Typen</option>
            <option value="einnahme">Einnahmen</option>
            <option value="ausgabe">Ausgaben</option>
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            style={inputStyle}
            placeholder="Von"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            style={inputStyle}
            placeholder="Bis"
          />
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div style={transactionListStyle}>
          {filteredTransactions.map((transaction, index) => (
            <div 
              key={transaction.id} 
              style={{
                ...transactionItemStyle,
                borderBottom: index === filteredTransactions.length - 1 ? 'none' : '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: 20, marginRight: 12 }}>
                  {transaction.kategorie_icon || '💰'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {transaction.beschreibung || transaction.kategorie_name}
                  </div>
                  <div style={{ fontSize: 14, color: '#999' }}>
                    {transaction.konto_name} • {transaction.kategorie_name} • {formatDate(transaction.datum)}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  fontWeight: 'bold',
                  color: transaction.typ === 'einnahme' ? '#22c55e' : '#f44336',
                  marginRight: 16
                }}>
                  {transaction.typ === 'einnahme' ? '+' : '-'}{formatCurrency(transaction.betrag)}
                </div>
                
                <button
                  onClick={() => {
                    setEditingTransaction(transaction);
                    setShowTransactionForm(true);
                  }}
                  style={actionButtonStyle}
                >
                  Bearbeiten
                </button>
                
                <button
                  onClick={() => handleDeleteTransaction(transaction.id)}
                  style={{ ...actionButtonStyle, color: '#f44336' }}
                >
                  Löschen
                </button>
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
          Keine Transaktionen gefunden
        </div>
      )}

      <button 
        style={floatingButtonStyle}
        onClick={() => {
          setEditingTransaction(null);
          setShowTransactionForm(true);
        }}
        title="Neue Transaktion"
      >
        +
      </button>

      {showTransactionForm && (
        <TransactionForm
          transaction={editingTransaction || undefined}
          onSave={handleSaveTransaction}
          onCancel={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      <FloatingTabBar />
    </div>
  );
}
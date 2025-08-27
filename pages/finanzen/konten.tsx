import { useState, useEffect } from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';
import AccountForm from '@/components/AccountForm';

interface Account {
  id: number;
  name: string;
  typ: string;
  saldo: number;
  farbe: string;
  created_at: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/finanzen/konten');
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAccounts(data);
        } else {
          console.error('Invalid accounts data format:', data);
          setAccounts([]);
        }
      } else {
        console.error('Accounts API Error:', response.status);
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (accountData: any) => {
    try {
      const url = editingAccount 
        ? `/api/finanzen/konten`
        : '/api/finanzen/konten';
      
      const method = editingAccount ? 'PUT' : 'POST';
      const body = editingAccount 
        ? { ...accountData, id: editingAccount.id }
        : accountData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowAccountForm(false);
        setEditingAccount(null);
        loadAccounts();
      }
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Konto wirklich löschen? Dies ist nur möglich, wenn keine Transaktionen vorhanden sind.')) return;

    try {
      const response = await fetch(`/api/finanzen/konten?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadAccounts();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen des Kontos');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Fehler beim Löschen des Kontos');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getAccountIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'Girokonto': '🏦',
      'Sparkonto': '🔒',
      'Kreditkarte': '💳',
      'Bargeld': '💵',
      'Depot': '📈',
      'Sonstiges': '💰'
    };
    return icons[type] || '💰';
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
    paddingBottom: "100px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  };

  const accountGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  };

  const accountCardStyle = (color: string): React.CSSProperties => ({
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    border: `2px solid ${color}`,
    position: 'relative',
  });

  const accountHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  };

  const accountIconStyle: React.CSSProperties = {
    fontSize: 32,
    marginRight: 12,
  };

  const accountBalanceStyle = (balance: number): React.CSSProperties => ({
    fontSize: 32,
    fontWeight: 'bold',
    color: balance >= 0 ? '#22c55e' : '#f44336',
    marginBottom: 8,
  });

  const accountTypeStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  };

  const actionButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#36a2eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const deleteButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f44336',
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

  const totalBalance = accounts && accounts.length > 0 ? accounts.reduce((sum, account) => sum + account.saldo, 0) : 0;

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: 100 }}>Laden...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🏦 Konten</h1>
      
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 24,
        border: '1px solid #333',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, marginBottom: 8, color: '#ccc' }}>Gesamtsaldo</h2>
        <div style={{ 
          fontSize: 36, 
          fontWeight: 'bold',
          color: totalBalance >= 0 ? '#22c55e' : '#f44336'
        }}>
          {formatCurrency(totalBalance)}
        </div>
      </div>

      {accounts.length > 0 ? (
        <div style={accountGridStyle}>
          {accounts.map(account => (
            <div key={account.id} style={accountCardStyle(account.farbe)}>
              <div style={accountHeaderStyle}>
                <span style={accountIconStyle}>
                  {getAccountIcon(account.typ)}
                </span>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 'bold' }}>
                  {account.name}
                </h3>
              </div>
              
              <div style={accountBalanceStyle(account.saldo)}>
                {formatCurrency(account.saldo)}
              </div>
              
              <div style={accountTypeStyle}>
                {account.typ}
              </div>
              
              <div style={actionButtonsStyle}>
                <button
                  onClick={() => {
                    setEditingAccount(account);
                    setShowAccountForm(true);
                  }}
                  style={buttonStyle}
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  style={deleteButtonStyle}
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
          Noch keine Konten vorhanden
        </div>
      )}

      <button 
        style={floatingButtonStyle}
        onClick={() => {
          setEditingAccount(null);
          setShowAccountForm(true);
        }}
        title="Neues Konto"
      >
        +
      </button>

      {showAccountForm && (
        <AccountForm
          account={editingAccount || undefined}
          onSave={handleSaveAccount}
          onCancel={() => {
            setShowAccountForm(false);
            setEditingAccount(null);
          }}
        />
      )}

      <FloatingTabBar />
    </div>
  );
}
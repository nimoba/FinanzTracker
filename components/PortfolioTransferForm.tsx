import { useState, useEffect } from 'react';

interface Account {
  id: number;
  name: string;
  ist_portfolio?: boolean;
}

interface PortfolioTransferFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function PortfolioTransferForm({ onSuccess, onClose }: PortfolioTransferFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/finanzen/konten');
      const data = await response.json();
      // Nur normale Konten anzeigen (nicht das Portfolio-Konto)
      setAccounts(data.filter((acc: Account) => !acc.ist_portfolio));
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || amount <= 0) return;

    setLoading(true);
    try {
      // Hole Portfolio-Konto ID
      const portfolioResponse = await fetch('/api/finanzen/konten?portfolio=true');
      const portfolioAccounts = await portfolioResponse.json();
      const portfolioAccount = portfolioAccounts.find((acc: Account) => acc.ist_portfolio);

      if (!portfolioAccount) {
        alert('Portfolio-Konto nicht gefunden');
        return;
      }

      const response = await fetch('/api/finanzen/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          von_konto_id: selectedAccount,
          zu_konto_id: portfolioAccount.id,
          betrag: amount,
          beschreibung: description || 'Transfer ins Portfolio',
          datum: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Transfer');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Fehler beim Transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw',
      }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Geld ins Portfolio transferieren</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
              Von Konto:
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4B5563',
                borderRadius: '8px',
                color: 'white',
              }}
              required
            >
              <option value={0}>Konto auswählen</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
              Betrag (€):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4B5563',
                borderRadius: '8px',
                color: 'white',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
              Beschreibung (optional):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Monatliche Sparrate"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4B5563',
                borderRadius: '8px',
                color: 'white',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAccount || amount <= 0}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading || !selectedAccount || amount <= 0 ? '#6B7280' : '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !selectedAccount || amount <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Transferiere...' : 'Transferieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
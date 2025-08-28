import { useState, useEffect } from 'react';

interface Account {
  id: number;
  name: string;
  typ: string;
  saldo: number;
  farbe: string;
}

interface TransferFormProps {
  onSave: (transferData: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TransferForm({ onSave, onCancel, isLoading }: TransferFormProps) {
  const [formData, setFormData] = useState({
    von_konto_id: 0,
    zu_konto_id: 0,
    betrag: 0,
    datum: new Date().toISOString().split('T')[0],
    beschreibung: '',
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formLoading, setFormLoading] = useState(true);

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
          setAccounts([]);
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.von_konto_id || !formData.zu_konto_id || formData.betrag <= 0) return;
    
    await onSave(formData);
  };

  const getAccountBalance = (accountId: number): number => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? parseFloat(account.saldo as any || '0') : 0;
  };

  const getAccountName = (accountId: number): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : '';
  };

  const sourceBalance = getAccountBalance(formData.von_konto_id);
  const insufficientFunds = formData.betrag > sourceBalance && formData.von_konto_id > 0;

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const formStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    height: 'auto',
    minHeight: '48px',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#36a2eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: 8,
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#666',
  };

  if (formLoading) {
    return (
      <div style={modalStyle}>
        <div style={formStyle}>
          <div style={{ textAlign: 'center', padding: 40, color: '#ccc' }}>
            Laden...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: 24, color: '#fff' }}>
          🔄 Geld zwischen Konten übertragen
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>
            Von Konto:
          </label>
          <select
            value={formData.von_konto_id}
            onChange={(e) => setFormData({ ...formData, von_konto_id: parseInt(e.target.value) })}
            style={selectStyle}
            required
          >
            <option value="">Quellkonto auswählen</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.typ}) - {parseFloat(account.saldo as any || '0').toFixed(2)}€
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>
            Zu Konto:
          </label>
          <select
            value={formData.zu_konto_id}
            onChange={(e) => setFormData({ ...formData, zu_konto_id: parseInt(e.target.value) })}
            style={selectStyle}
            required
          >
            <option value="">Zielkonto auswählen</option>
            {accounts
              .filter(account => account.id !== formData.von_konto_id)
              .map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.typ}) - {parseFloat(account.saldo as any || '0').toFixed(2)}€
                </option>
              ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>
            Betrag:
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={formData.betrag || ''}
            onChange={(e) => setFormData({ ...formData, betrag: parseFloat(e.target.value) || 0 })}
            style={{
              ...inputStyle,
              borderColor: insufficientFunds ? '#f44336' : '#555'
            }}
            required
          />
          {formData.von_konto_id > 0 && (
            <div style={{ fontSize: 14, marginTop: -12, marginBottom: 12 }}>
              <span style={{ color: '#999' }}>
                Verfügbar: {sourceBalance.toFixed(2)}€
              </span>
              {insufficientFunds && (
                <span style={{ color: '#f44336', marginLeft: 8 }}>
                  ⚠️ Unzureichender Kontostand
                </span>
              )}
            </div>
          )}
        </div>

        <input
          type="date"
          value={formData.datum}
          onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
          style={inputStyle}
          required
        />

        <textarea
          placeholder="Beschreibung (optional)"
          value={formData.beschreibung}
          onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
        />

        {/* Transfer Preview */}
        {formData.von_konto_id && formData.zu_konto_id && formData.betrag > 0 && (
          <div style={{
            backgroundColor: '#252525',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            border: '1px solid #36a2eb'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#36a2eb', fontSize: 16 }}>
              Übertragsvorschau
            </h3>
            <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6 }}>
              <div>📤 <strong>{getAccountName(formData.von_konto_id)}</strong>: -{formData.betrag.toFixed(2)}€</div>
              <div>📥 <strong>{getAccountName(formData.zu_konto_id)}</strong>: +{formData.betrag.toFixed(2)}€</div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                💡 Der Gesamtsaldo bleibt unverändert
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle} disabled={isLoading}>
            Abbrechen
          </button>
          <button 
            type="submit" 
            style={{
              ...buttonStyle,
              opacity: (insufficientFunds || isLoading) ? 0.5 : 1,
              cursor: (insufficientFunds || isLoading) ? 'not-allowed' : 'pointer'
            }} 
            disabled={insufficientFunds || isLoading}
          >
            {isLoading ? 'Übertrage...' : 'Übertrag durchführen'}
          </button>
        </div>
      </form>
    </div>
  );
}
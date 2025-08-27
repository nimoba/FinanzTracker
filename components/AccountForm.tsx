import { useState } from 'react';

interface Account {
  id?: number;
  name: string;
  typ: string;
  saldo: number;
  farbe: string;
}

interface AccountFormProps {
  account?: Account;
  onSave: (account: Omit<Account, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const accountTypes = [
  'Girokonto',
  'Sparkonto', 
  'Kreditkarte',
  'Bargeld',
  'Depot',
  'Sonstiges'
];

const colors = [
  '#36a2eb',
  '#4caf50', 
  '#ff9800',
  '#f44336',
  '#9c27b0',
  '#00bcd4',
  '#8bc34a',
  '#ffeb3b'
];

export default function AccountForm({ account, onSave, onCancel, isLoading }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    typ: account?.typ || 'Girokonto',
    saldo: account?.saldo || 0,
    farbe: account?.farbe || '#36a2eb',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    await onSave(formData);
  };

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
    maxWidth: 400,
    width: '90%',
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

  const colorButtonStyle = (color: string, selected: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: color,
    border: selected ? '3px solid #fff' : '1px solid #555',
    cursor: 'pointer',
    margin: '0 4px 8px 0',
  });

  return (
    <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: 24, color: '#fff' }}>
          {account ? 'Konto bearbeiten' : 'Neues Konto'}
        </h2>

        <input
          type="text"
          placeholder="Kontoname"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={inputStyle}
          required
        />

        <select
          value={formData.typ}
          onChange={(e) => setFormData({ ...formData, typ: e.target.value })}
          style={inputStyle}
          required
        >
          {accountTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <input
          type="number"
          step="0.01"
          placeholder="Anfangssaldo"
          value={formData.saldo || ''}
          onChange={(e) => setFormData({ ...formData, saldo: parseFloat(e.target.value) || 0 })}
          style={inputStyle}
        />

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>Farbe:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {colors.map(color => (
              <button
                key={color}
                type="button"
                style={colorButtonStyle(color, formData.farbe === color)}
                onClick={() => setFormData({ ...formData, farbe: color })}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle} disabled={isLoading}>
            Abbrechen
          </button>
          <button type="submit" style={buttonStyle} disabled={isLoading}>
            {isLoading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
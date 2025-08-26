import { useState, useEffect } from 'react';

interface Account {
  id: number;
  name: string;
  typ: string;
  saldo: number;
}

interface Category {
  id: number;
  name: string;
  typ: 'einnahme' | 'ausgabe';
  icon: string;
  farbe: string;
}

interface Transaction {
  id?: number;
  konto_id: number;
  betrag: number;
  typ: 'einnahme' | 'ausgabe';
  kategorie_id: number;
  datum: string;
  beschreibung: string;
}

interface TransactionFormProps {
  transaction?: Transaction;
  onSave: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TransactionForm({ transaction, onSave, onCancel, isLoading }: TransactionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    konto_id: transaction?.konto_id || 0,
    betrag: transaction?.betrag || 0,
    typ: transaction?.typ || 'ausgabe' as 'einnahme' | 'ausgabe',
    kategorie_id: transaction?.kategorie_id || 0,
    datum: transaction?.datum || new Date().toISOString().split('T')[0],
    beschreibung: transaction?.beschreibung || '',
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadCategories();
  }, []);

  useEffect(() => {
    loadCategories();
  }, [formData.typ]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/finanzen/konten');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/finanzen/kategorien?typ=${formData.typ}`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.konto_id || !formData.kategorie_id || formData.betrag <= 0) return;
    
    await onSave(formData);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/finanzen/kategorien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          typ: formData.typ,
          farbe: '#36a2eb',
          icon: '💰',
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        setFormData({ ...formData, kategorie_id: newCategory.id });
        setNewCategoryName('');
        setShowNewCategory(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
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

  const typeToggleStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    cursor: 'pointer',
    backgroundColor: active ? '#36a2eb' : '#2a2a2a',
    color: '#fff',
    marginRight: 8,
  });

  return (
    <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: 24, color: '#fff' }}>
          {transaction ? 'Transaktion bearbeiten' : 'Neue Transaktion'}
        </h2>

        <div style={{ display: 'flex', marginBottom: 16 }}>
          <button
            type="button"
            style={typeToggleStyle(formData.typ === 'einnahme')}
            onClick={() => setFormData({ ...formData, typ: 'einnahme' })}
          >
            💰 Einnahme
          </button>
          <button
            type="button"
            style={typeToggleStyle(formData.typ === 'ausgabe')}
            onClick={() => setFormData({ ...formData, typ: 'ausgabe' })}
          >
            💸 Ausgabe
          </button>
        </div>

        <input
          type="number"
          step="0.01"
          placeholder="Betrag"
          value={formData.betrag || ''}
          onChange={(e) => setFormData({ ...formData, betrag: parseFloat(e.target.value) || 0 })}
          style={inputStyle}
          required
        />

        <select
          value={formData.konto_id}
          onChange={(e) => setFormData({ ...formData, konto_id: parseInt(e.target.value) })}
          style={inputStyle}
          required
        >
          <option value="">Konto auswählen</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.typ})
            </option>
          ))}
        </select>

        <select
          value={formData.kategorie_id}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'new') {
              setShowNewCategory(true);
            } else {
              setFormData({ ...formData, kategorie_id: parseInt(value) });
            }
          }}
          style={inputStyle}
          required
        >
          <option value="">Kategorie auswählen</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
          <option value="new">+ Neue Kategorie erstellen</option>
        </select>

        {showNewCategory && (
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Name der neuen Kategorie"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={inputStyle}
            />
            <button type="button" onClick={handleCreateCategory} style={buttonStyle}>
              Erstellen
            </button>
            <button type="button" onClick={() => setShowNewCategory(false)} style={secondaryButtonStyle}>
              Abbrechen
            </button>
          </div>
        )}

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
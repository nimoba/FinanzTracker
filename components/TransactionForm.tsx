// Fixed Transaction Form with proper subcategory display

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
  parent_id?: number;
  parent_name?: string;
}

interface Transaction {
  id?: number;
  konto_id: number;
  betrag: number;
  typ: 'einnahme' | 'ausgabe';
  kategorie_id: number;
  datum: string;
  beschreibung: string;
  status?: 'confirmed' | 'pending';
  auto_confirm_date?: string;
  original_amount?: number;
  pending_amount?: number;
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
    status: transaction?.status || 'confirmed' as 'confirmed' | 'pending',
    auto_confirm_days: 28,
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
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
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/finanzen/kategorien?typ=${formData.typ}`);
      const data = await response.json();
      console.log(`Categories for ${formData.typ}:`, data); // Debug log
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.konto_id || !formData.kategorie_id || formData.betrag <= 0) return;
    
    // Calculate auto_confirm_date for pending transactions
      const submitData: any = { ...formData };
      if (formData.status === 'pending') {
        const autoConfirmDate = new Date();
        autoConfirmDate.setDate(autoConfirmDate.getDate() + formData.auto_confirm_days);
        submitData.auto_confirm_date = autoConfirmDate.toISOString().split('T')[0];
        submitData.original_amount = formData.betrag;
        submitData.pending_amount = formData.betrag;
      }
      
      await onSave(submitData);
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
          parent_id: newCategoryParent || null,
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        setFormData({ ...formData, kategorie_id: newCategory.id });
        setNewCategoryName('');
        setNewCategoryParent('');
        setShowNewCategory(false);
        // Reload categories to get proper hierarchy
        await loadCategories();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  // Group categories for better display
  const mainCategories = categories.filter(cat => !cat.parent_id);
  const subcategories = categories.filter(cat => cat.parent_id);

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
    padding: 16,
    maxWidth: 500,
    width: '95%',
    maxHeight: '85vh',
    overflowY: 'auto',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 10,
    fontSize: 16,
    borderRadius: 8,
    border: '1px solid #555',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    marginBottom: 12,
    boxSizing: 'border-box' as const,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    height: 'auto',
    minHeight: '44px',
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
    padding: '10px 12px',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    backgroundColor: active ? '#36a2eb' : '#2a2a2a',
    color: '#fff',
  });

  return (
    <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: 16, color: '#fff', fontSize: 18 }}>
          {transaction ? 'Transaktion bearbeiten' : 'Neue Transaktion'}
        </h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            style={typeToggleStyle(formData.typ === 'einnahme')}
            onClick={() => setFormData({ ...formData, typ: 'einnahme', kategorie_id: 0 })}
          >
            💰 Einnahme
          </button>
          <button
            type="button"
            style={typeToggleStyle(formData.typ === 'ausgabe')}
            onClick={() => setFormData({ ...formData, typ: 'ausgabe', kategorie_id: 0 })}
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

        {/* Transaction Status */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
            Status:
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'confirmed' })}
              style={{
                ...buttonStyle,
                backgroundColor: formData.status === 'confirmed' ? '#22c55e' : 'transparent',
                border: `2px solid ${formData.status === 'confirmed' ? '#22c55e' : '#555'}`,
                flex: 1
              }}
            >
              ✅ Bestätigt
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'pending' })}
              style={{
                ...buttonStyle,
                backgroundColor: formData.status === 'pending' ? '#f59e0b' : 'transparent',
                border: `2px solid ${formData.status === 'pending' ? '#f59e0b' : '#555'}`,
                flex: 1
              }}
            >
              ⏳ Ausstehend
            </button>
          </div>
        </div>

        {/* Auto-confirm days (only show for pending transactions) */}
        {formData.status === 'pending' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Automatisch bestätigen nach (Tagen):
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.auto_confirm_days || 14}
              onChange={(e) => setFormData({ ...formData, auto_confirm_days: parseInt(e.target.value) || 14 })}
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Transaktion wird am {new Date(Date.now() + (formData.auto_confirm_days || 14) * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')} automatisch bestätigt
            </div>
          </div>
        )}

        <select
          value={formData.konto_id}
          onChange={(e) => setFormData({ ...formData, konto_id: parseInt(e.target.value) })}
          style={selectStyle}
          required
        >
          <option value="">Konto auswählen</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.typ}) - {parseFloat(account.saldo as any || '0').toFixed(2)}€
            </option>
          ))}
        </select>

        {/* Enhanced Category Selection with Visual Hierarchy */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
            Kategorie auswählen:
          </label>
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
            style={selectStyle}
            required
          >
            <option value="">Kategorie auswählen</option>
            
            {/* Group by main categories */}
            {mainCategories.map(mainCategory => {
              const subs = subcategories.filter(sub => sub.parent_id === mainCategory.id);
              return (
                <optgroup key={mainCategory.id} label={`${mainCategory.icon} ${mainCategory.name}`}>
                  <option value={mainCategory.id}>
                    {mainCategory.icon} {mainCategory.name} (Hauptkategorie)
                  </option>
                  {subs.map(subCategory => (
                    <option key={subCategory.id} value={subCategory.id}>
                      ↳ {subCategory.icon} {subCategory.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
            
            {/* Categories without parents that have no children */}
            {mainCategories
              .filter(main => subcategories.filter(sub => sub.parent_id === main.id).length === 0)
              .map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
            
            <option value="new" style={{ borderTop: '1px solid #555', marginTop: 8 }}>
              + Neue Kategorie erstellen
            </option>
          </select>
          
          {/* Category Debug Info */}
          {categories.length > 0 && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              📊 {categories.length} Kategorien ({mainCategories.length} Haupt, {subcategories.length} Unter)
            </div>
          )}
        </div>

        {showNewCategory && (
          <div style={{ 
            backgroundColor: '#252525', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 16, 
            border: '1px solid #36a2eb' 
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#36a2eb', fontSize: 16 }}>
              Neue Kategorie erstellen
            </h3>
            <input
              type="text"
              placeholder="Name der neuen Kategorie"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={inputStyle}
            />
            <select
              value={newCategoryParent}
              onChange={(e) => setNewCategoryParent(e.target.value)}
              style={selectStyle}
            >
              <option value="">Hauptkategorie (keine Übergeordnete)</option>
              {mainCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleCreateCategory} style={buttonStyle}>
                Erstellen
              </button>
              <button type="button" onClick={() => {
                setShowNewCategory(false);
                setNewCategoryName('');
                setNewCategoryParent('');
              }} style={secondaryButtonStyle}>
                Abbrechen
              </button>
            </div>
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

        {/* Selected Category Display */}
        {formData.kategorie_id && categories.length > 0 && (
          <div style={{
            backgroundColor: '#252525',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            border: '1px solid #444'
          }}>
            {(() => {
              const selectedCategory = categories.find(cat => cat.id === formData.kategorie_id);
              if (selectedCategory) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, marginRight: 8 }}>{selectedCategory.icon}</span>
                    <span>
                      {selectedCategory.parent_name && (
                        <>
                          <span style={{ color: '#999' }}>{selectedCategory.parent_name}</span>
                          <span style={{ color: '#36a2eb', margin: '0 6px' }}> › </span>
                        </>
                      )}
                      <span style={{ fontWeight: 'bold' }}>{selectedCategory.name}</span>
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

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
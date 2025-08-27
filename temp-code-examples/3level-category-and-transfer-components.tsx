// Example: 3-Level Category Selector Component
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  typ: string;
  icon: string;
  farbe: string;
  parent_id: number | null;
  level: number;
  children?: Category[];
}

interface CategorySelectorProps {
  onSelect: (categoryId: number) => void;
  selectedId?: number;
  type: 'einnahme' | 'ausgabe';
  allowMainCategories?: boolean; // Whether to allow selecting main categories
}

export function CategorySelector({ 
  onSelect, 
  selectedId, 
  type, 
  allowMainCategories = false 
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/finanzen/kategorien?tree=true&typ=${type}`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryOptions = (categories: Category[], level: number = 0): JSX.Element[] => {
    const elements: JSX.Element[] = [];

    categories.forEach(category => {
      const indent = '  '.repeat(level);
      const isMainCategory = level === 0;
      const isSelectable = allowMainCategories || !isMainCategory;

      // Add main category option
      elements.push(
        <option 
          key={category.id} 
          value={category.id}
          disabled={!isSelectable}
          style={{ 
            fontWeight: isMainCategory ? 'bold' : 'normal',
            color: isMainCategory ? category.farbe : 'inherit'
          }}
        >
          {indent}{category.icon} {category.name}
          {isMainCategory && !allowMainCategories ? ' (Hauptkategorie)' : ''}
        </option>
      );

      // Add subcategories recursively
      if (category.children && category.children.length > 0) {
        elements.push(...renderCategoryOptions(category.children, level + 1));
      }
    });

    return elements;
  };

  if (loading) {
    return (
      <select disabled className="border rounded px-3 py-2">
        <option>Kategorien werden geladen...</option>
      </select>
    );
  }

  return (
    <select 
      value={selectedId || ''}
      onChange={(e) => onSelect(parseInt(e.target.value))}
      className="border rounded px-3 py-2"
    >
      <option value="">Kategorie wählen...</option>
      {renderCategoryOptions(categories)}
    </select>
  );
}

// Example: Transfer Form Component
interface TransferFormProps {
  accounts: Array<{ id: number; name: string; saldo: number }>;
  onTransferComplete?: () => void;
}

export function TransferForm({ accounts, onTransferComplete }: TransferFormProps) {
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAccountId || !toAccountId || !amount) {
      alert('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    if (fromAccountId === toAccountId) {
      alert('Quell- und Zielkonto müssen unterschiedlich sein');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) {
      alert('Betrag muss positiv sein');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/finanzen/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_account_id: parseInt(fromAccountId),
          to_account_id: parseInt(toAccountId),
          amount: numericAmount,
          date,
          description
        })
      });

      if (response.ok) {
        // Reset form
        setFromAccountId('');
        setToAccountId('');
        setAmount('');
        setDescription('');
        alert('Transfer erfolgreich erstellt!');
        onTransferComplete?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Transfer fehlgeschlagen');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert(`Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">💸 Geld zwischen Konten übertragen</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Von Konto:</label>
          <select 
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Quellkonto wählen...</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} (€{account.saldo.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Zu Konto:</label>
          <select 
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Zielkonto wählen...</option>
            {accounts.map(account => (
              <option 
                key={account.id} 
                value={account.id}
                disabled={account.id.toString() === fromAccountId}
              >
                {account.name} (€{account.saldo.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Betrag (€):</label>
          <input 
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Datum:</label>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Beschreibung (optional):</label>
        <input 
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="z.B. Übertrag für Sparziel"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Übertrage...' : '💸 Transfer ausführen'}
      </button>
    </form>
  );
}

// Example usage in a page:
/*
import { CategorySelector, TransferForm } from '../components/CategorySelector';

export default function TransactionPage() {
  const [selectedCategory, setSelectedCategory] = useState<number>();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    // Fetch accounts
    fetch('/api/finanzen/konten')
      .then(res => res.json())
      .then(setAccounts);
  }, []);

  return (
    <div>
      <h1>Neue Transaktion</h1>
      
      <CategorySelector 
        type="ausgabe"
        onSelect={setSelectedCategory}
        selectedId={selectedCategory}
      />
      
      <TransferForm 
        accounts={accounts}
        onTransferComplete={() => console.log('Transfer completed!')}
      />
    </div>
  );
}
*/
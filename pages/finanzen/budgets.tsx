import { useState, useEffect } from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';

interface Budget {
  id: number;
  kategorie_id: number;
  betrag: number;
  monat: string;
  kategorie_name: string;
  kategorie_icon: string;
  ausgegeben: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  typ: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/finanzen/kategorien?typ=ausgabe');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      const response = await fetch(`/api/finanzen/budgets?monat=${currentMonth}-01`);
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || budgetAmount <= 0) return;

    try {
      const response = await fetch('/api/finanzen/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategorie_id: selectedCategory,
          betrag: budgetAmount,
          monat: `${currentMonth}-01`
        }),
      });

      if (response.ok) {
        setShowBudgetForm(false);
        setSelectedCategory(0);
        setBudgetAmount(0);
        loadBudgets();
      }
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleDeleteBudget = async (kategorie_id: number) => {
    if (!confirm('Budget wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/finanzen/budgets?kategorie_id=${kategorie_id}&monat=${currentMonth}-01`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadBudgets();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const getProgressPercentage = (spent: number, budget: number): number => {
    return budget > 0 ? (spent / budget) * 100 : 0;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage <= 80) return '#22c55e';
    if (percentage <= 100) return '#ff9800';
    return '#f44336';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    return new Date(monthString + '-01').toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
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

  const monthSelectorStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 16,
    borderRadius: 8,
    border: '1px solid #555',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  };

  const budgetGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  };

  const budgetCardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #333',
  };

  const budgetHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  };

  const categoryInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 24,
    marginRight: 12,
  };

  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  };

  const progressFillStyle = (percentage: number, color: string): React.CSSProperties => ({
    width: `${Math.min(percentage, 100)}%`,
    height: '100%',
    backgroundColor: color,
    transition: 'width 0.3s ease',
  });

  const budgetStatsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  };

  const deleteButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#f44336',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
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
        <h1 style={titleStyle}>📊 Budgets</h1>
        <select
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          style={monthSelectorStyle}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - 6 + i);
            const monthValue = date.toISOString().slice(0, 7);
            return (
              <option key={monthValue} value={monthValue}>
                {formatMonth(monthValue)}
              </option>
            );
          })}
        </select>
      </div>

      {budgets.length > 0 ? (
        <div style={budgetGridStyle}>
          {budgets.map(budget => {
            const percentage = getProgressPercentage(budget.ausgegeben, budget.betrag);
            const color = getProgressColor(percentage);
            
            return (
              <div key={budget.id} style={budgetCardStyle}>
                <div style={budgetHeaderStyle}>
                  <div style={categoryInfoStyle}>
                    <span style={iconStyle}>{budget.kategorie_icon}</span>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{budget.kategorie_name}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(budget.kategorie_id)}
                    style={deleteButtonStyle}
                  >
                    Löschen
                  </button>
                </div>

                <div style={progressBarStyle}>
                  <div style={progressFillStyle(percentage, color)} />
                </div>

                <div style={budgetStatsStyle}>
                  <span>Ausgegeben:</span>
                  <span>{formatCurrency(budget.ausgegeben)}</span>
                </div>

                <div style={budgetStatsStyle}>
                  <span>Budget:</span>
                  <span>{formatCurrency(budget.betrag)}</span>
                </div>

                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 'bold',
                  color,
                  textAlign: 'center',
                  marginTop: 8
                }}>
                  {percentage.toFixed(1)}% verbraucht
                  {percentage > 100 && ` (${formatCurrency(budget.ausgegeben - budget.betrag)} über Budget)`}
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
          Noch keine Budgets für {formatMonth(currentMonth)} definiert
        </div>
      )}

      <button 
        style={floatingButtonStyle}
        onClick={() => setShowBudgetForm(true)}
        title="Neues Budget"
      >
        +
      </button>

      {showBudgetForm && (
        <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && setShowBudgetForm(false)}>
          <form style={formStyle} onSubmit={handleSaveBudget}>
            <h2 style={{ marginBottom: 24, color: '#fff' }}>Neues Budget</h2>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
              style={inputStyle}
              required
            >
              <option value="">Kategorie auswählen</option>
              {categories
                .filter(cat => !budgets.some(b => b.kategorie_id === cat.id))
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))
              }
            </select>

            <input
              type="number"
              step="0.01"
              placeholder="Budget-Betrag"
              value={budgetAmount || ''}
              onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowBudgetForm(false)} style={{ ...buttonStyle, backgroundColor: '#666' }}>
                Abbrechen
              </button>
              <button type="submit" style={buttonStyle}>
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      <FloatingTabBar />
    </div>
  );
}
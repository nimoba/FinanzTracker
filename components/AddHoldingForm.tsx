import { useState, useEffect } from 'react';

interface Portfolio {
  id: number;
  name: string;
}

interface AddHoldingFormProps {
  portfolioId?: number;
  onSave: (holdingData: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AddHoldingForm({ portfolioId, onSave, onCancel, isLoading }: AddHoldingFormProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [formData, setFormData] = useState({
    portfolio_id: portfolioId || 0,
    symbol: '',
    name: '',
    quantity: 0,
    price: 0,
    fees: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
    type: 'buy' as 'buy' | 'sell'
  });
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      setPortfolios(data);
      
      if (!portfolioId && data.length > 0) {
        setFormData(prev => ({ ...prev, portfolio_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  };

  const fetchCurrentPrice = async () => {
    if (!formData.symbol) return;

    setFetchingPrice(true);
    try {
      const response = await fetch(`/api/stocks/${formData.symbol.toUpperCase()}/price`);
      if (response.ok) {
        const priceData = await response.json();
        setFormData(prev => ({ 
          ...prev, 
          price: priceData.price,
          name: prev.name || priceData.companyName || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSymbolChange = (symbol: string) => {
    setFormData(prev => ({ ...prev, symbol: symbol.toUpperCase() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.portfolio_id || !formData.symbol || !formData.quantity || !formData.price || !formData.date) {
      alert('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    await onSave(formData);
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid #333',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 12,
    backgroundColor: '#333',
    border: '1px solid #555',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginRight: 12,
  };

  return (
    <div style={modalStyle} onClick={onCancel}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: '#fff', margin: '0 0 20px 0', fontSize: 18 }}>
          Position hinzufügen
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Portfolio Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Portfolio:
            </label>
            <select
              value={formData.portfolio_id}
              onChange={(e) => setFormData({ ...formData, portfolio_id: parseInt(e.target.value) })}
              style={inputStyle}
              required
              disabled={!!portfolioId}
            >
              <option value="">Portfolio auswählen</option>
              {portfolios.map(portfolio => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Transaktion:
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'buy' })}
                style={{
                  ...buttonStyle,
                  backgroundColor: formData.type === 'buy' ? '#22c55e' : 'transparent',
                  border: `2px solid ${formData.type === 'buy' ? '#22c55e' : '#555'}`,
                  color: '#fff',
                  flex: 1
                }}
              >
                📈 Kaufen
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'sell' })}
                style={{
                  ...buttonStyle,
                  backgroundColor: formData.type === 'sell' ? '#f44336' : 'transparent',
                  border: `2px solid ${formData.type === 'sell' ? '#f44336' : '#555'}`,
                  color: '#fff',
                  flex: 1
                }}
              >
                📉 Verkaufen
              </button>
            </div>
          </div>

          {/* Symbol */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Symbol: *
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="z.B. AAPL, SAP.DE, BTC-EUR"
                value={formData.symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                required
              />
              <button
                type="button"
                onClick={fetchCurrentPrice}
                disabled={fetchingPrice || !formData.symbol}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#36a2eb',
                  color: '#fff',
                  marginRight: 0,
                  marginBottom: 0
                }}
              >
                {fetchingPrice ? '🔄' : '💲'}
              </button>
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Name (optional):
            </label>
            <input
              type="text"
              placeholder="Unternehmensname"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Anzahl: *
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="Anzahl Aktien/Anteile"
              value={formData.quantity || ''}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
              required
            />
          </div>

          {/* Price */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Preis pro Anteil: * {fetchingPrice && <span style={{ color: '#36a2eb' }}>🔄 Aktualisiere...</span>}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Preis in EUR"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
              required
            />
          </div>

          {/* Fees */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Gebühren (optional):
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Transaktionsgebühren"
              value={formData.fees || ''}
              onChange={(e) => setFormData({ ...formData, fees: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Datum: *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>
              Notiz (optional):
            </label>
            <textarea
              placeholder="Zusätzliche Informationen..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }}
            />
          </div>

          {/* Summary */}
          {formData.quantity > 0 && formData.price > 0 && (
            <div style={{
              backgroundColor: '#333',
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
              color: '#ccc'
            }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>
                <strong>Gesamtbetrag:</strong> {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                }).format((formData.quantity * formData.price) + formData.fees)}
              </div>
              <div style={{ fontSize: 12 }}>
                {formData.quantity} × {formData.price}€
                {formData.fees > 0 && ` + ${formData.fees}€ Gebühren`}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                ...buttonStyle,
                backgroundColor: '#555',
                color: '#fff',
              }}
              disabled={isLoading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: formData.type === 'buy' ? '#22c55e' : '#f44336',
                color: '#fff',
                marginRight: 0,
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Speichere...' : `${formData.type === 'buy' ? 'Kaufen' : 'Verkaufen'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';

interface AddPositionFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddPositionForm({ onSuccess, onClose }: AddPositionFormProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    wkn: '',
    isin: '',
    name: '',
    typ: 'etf' as 'stock' | 'etf' | 'crypto',
    waehrung: 'EUR',
    // Erste Transaktion
    anzahl: 0,
    preis: 0,
    gebuehren: 0,
    datum: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchAsset = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Hier würdest du eine echte Suche implementieren
      // Für jetzt simulieren wir Suchergebnisse
      const mockResults = [
        {
          symbol: 'IWDA.L',
          wkn: 'A0RPWH',
          isin: 'IE00B4L5Y983',
          name: 'iShares Core MSCI World UCITS ETF USD (Acc)',
          typ: 'etf'
        },
        {
          symbol: 'VWRL.L',
          wkn: 'A1JX52',
          isin: 'IE00B3RBWM25',
          name: 'Vanguard FTSE All-World UCITS ETF (USD) Accumulating',
          typ: 'etf'
        }
      ].filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.symbol.toLowerCase().includes(query.toLowerCase()) ||
        item.wkn.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectAsset = (asset: any) => {
    setFormData(prev => ({
      ...prev,
      symbol: asset.symbol,
      wkn: asset.wkn,
      isin: asset.isin,
      name: asset.name,
      typ: asset.typ
    }));
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.name || formData.anzahl <= 0 || formData.preis <= 0) {
      alert('Bitte alle erforderlichen Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      // 1. Position erstellen
      const positionResponse = await fetch('/api/portfolio/positionen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: formData.symbol,
          wkn: formData.wkn,
          isin: formData.isin,
          name: formData.name,
          typ: formData.typ,
          waehrung: formData.waehrung
        }),
      });

      if (!positionResponse.ok) throw new Error('Fehler beim Erstellen der Position');
      
      const position = await positionResponse.json();

      // 2. Erste Transaktion hinzufügen
      const transactionResponse = await fetch('/api/portfolio/transaktionen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_id: position.id,
          typ: 'kauf',
          anzahl: formData.anzahl,
          preis: formData.preis,
          gebuehren: formData.gebuehren,
          datum: formData.datum
        }),
      });

      if (!transactionResponse.ok) throw new Error('Fehler beim Erstellen der Transaktion');

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating position:', error);
      alert('Fehler beim Hinzufügen der Position');
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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        padding: '24px',
        width: '500px',
        maxWidth: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Position hinzufügen</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Asset Search */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
              Asset suchen:
            </label>
            <input
              type="text"
              placeholder="Name, Symbol oder WKN eingeben..."
              onChange={(e) => searchAsset(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4B5563',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#374151',
                border: '1px solid #4B5563',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10
              }}>
                {searchResults.map((asset, index) => (
                  <div
                    key={index}
                    onClick={() => selectAsset(asset)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: index < searchResults.length - 1 ? '1px solid #4B5563' : 'none',
                      color: 'white',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontWeight: 'bold' }}>{asset.name}</div>
                    <div style={{ color: '#9CA3AF', fontSize: '12px' }}>
                      {asset.symbol} • WKN: {asset.wkn} • {asset.typ.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual input fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                Symbol *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
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
            <div>
              <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                WKN
              </label>
              <input
                type="text"
                value={formData.wkn}
                onChange={(e) => setFormData(prev => ({ ...prev, wkn: e.target.value }))}
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
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                Typ *
              </label>
              <select
                value={formData.typ}
                onChange={(e) => setFormData(prev => ({ ...prev, typ: e.target.value as any }))}
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
                <option value="etf">ETF</option>
                <option value="stock">Aktie</option>
                <option value="crypto">Krypto</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                Währung
              </label>
              <select
                value={formData.waehrung}
                onChange={(e) => setFormData(prev => ({ ...prev, waehrung: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#374151',
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: 'white',
                }}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Erste Transaktion */}
          <div style={{
            backgroundColor: '#374151',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '16px' }}>
              Erste Transaktion (Kauf)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                  Anzahl *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.anzahl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, anzahl: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1F2937',
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                  Preis pro Stück (€) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.preis || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, preis: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1F2937',
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                  Gebühren (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gebuehren || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, gebuehren: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1F2937',
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#D1D5DB', marginBottom: '8px' }}>
                  Kaufdatum *
                </label>
                <input
                  type="date"
                  value={formData.datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1F2937',
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  required
                />
              </div>
            </div>

            {formData.anzahl > 0 && formData.preis > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#1F2937',
                borderRadius: '8px',
                color: '#D1D5DB'
              }}>
                <div>Gesamtsumme: <strong>{((formData.anzahl * formData.preis) + formData.gebuehren).toFixed(2)}€</strong></div>
              </div>
            )}
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
              disabled={loading || !formData.symbol || !formData.name || formData.anzahl <= 0 || formData.preis <= 0}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#6B7280' : '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Erstelle...' : 'Position hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
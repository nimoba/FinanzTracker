import React, { useState } from 'react';

interface Transaction {
  id: number;
  beschreibung: string;
  betrag: number;
  status?: 'confirmed' | 'pending' | 'cancelled';
  pending_amount?: number;
  original_amount?: number;
  cancelled_amount?: number;
}

interface PartialConfirmModalProps {
  transaction: Transaction;
  onCancel: () => void;
  onConfirm: (confirmAmount: number, note: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PartialConfirmModal({ 
  transaction, 
  onCancel, 
  onConfirm, 
  isLoading 
}: PartialConfirmModalProps) {
  const [confirmAmount, setConfirmAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const remainingAmount = (transaction.pending_amount || transaction.betrag) - (transaction.cancelled_amount || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirmAmount <= 0) {
      setError('Betrag muss größer als 0 sein');
      return;
    }

    if (confirmAmount > remainingAmount) {
      setError(`Betrag kann nicht größer als ${formatCurrency(remainingAmount)} sein`);
      return;
    }

    try {
      await onConfirm(confirmAmount, note);
    } catch (err) {
      setError('Fehler beim Bestätigen der Transaktion');
    }
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
    maxWidth: 400,
    width: '100%',
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
        <h2 style={{ 
          color: '#fff', 
          margin: '0 0 16px 0', 
          fontSize: 18 
        }}>
          💰 Transaktion teilweise bezahlen
        </h2>

        <div style={{ 
          backgroundColor: '#333', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <div style={{ color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>
            {transaction.beschreibung}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            Ursprungsbetrag: {formatCurrency(transaction.original_amount || transaction.betrag)}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            Ausstehend: {formatCurrency(remainingAmount)}
          </div>
          {(transaction.cancelled_amount || 0) > 0 && (
            <div style={{ fontSize: 12, color: '#f44336' }}>
              Bereits storniert: {formatCurrency(transaction.cancelled_amount || 0)}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 'bold', marginTop: 8 }}>
            Maximal zahlbar: {formatCurrency(remainingAmount)}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              color: '#ccc', 
              fontSize: 14 
            }}>
              Zu zahlender Betrag:
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={confirmAmount || ''}
              onChange={(e) => setConfirmAmount(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              placeholder={`Max. ${formatCurrency(remainingAmount)}`}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              color: '#ccc', 
              fontSize: 14 
            }}>
              Notiz (optional):
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ 
                ...inputStyle, 
                minHeight: 80, 
                resize: 'vertical' as const 
              }}
              placeholder="Zahlungsdetails oder Grund..."
            />
          </div>

          {error && (
            <div style={{ 
              color: '#f44336', 
              backgroundColor: '#4a1a1a',
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 16,
              border: '1px solid #f44336'
            }}>
              {error}
            </div>
          )}

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
                backgroundColor: '#22c55e',
                color: '#fff',
                marginRight: 0,
              }}
              disabled={isLoading || confirmAmount <= 0}
            >
              {isLoading ? 'Zahle...' : `${formatCurrency(confirmAmount)} zahlen`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
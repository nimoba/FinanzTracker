import React from 'react';

interface Account {
  id: number;
  name: string;
  typ: string;
  saldo: number;
  farbe: string;
}

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onToggle: (accountId: number) => void;
}

export default function AccountCard({ account, isSelected, onToggle }: AccountCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: isSelected ? '#1e1e1e' : '#1e1e1e80',
    border: `2px solid ${isSelected ? account.farbe : '#333'}`,
    borderRadius: 12,
    padding: 16,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    opacity: isSelected ? 1 : 0.6,
    transform: isSelected ? 'scale(1)' : 'scale(0.95)',
    minWidth: 140,
    flex: '0 0 140px',
    position: 'relative' as const,
  };

  const saldo = typeof account.saldo === 'number' ? account.saldo : parseFloat(account.saldo) || 0;
  const balanceColor = saldo >= 0 ? '#4caf50' : '#f44336';
  
  const getAccountIcon = (typ: string) => {
    switch (typ.toLowerCase()) {
      case 'girokonto':
      case 'checking':
        return '🏦';
      case 'sparkonto':
      case 'savings':
        return '💰';
      case 'kreditkarte':
      case 'credit':
        return '💳';
      case 'bargeld':
      case 'cash':
        return '💵';
      default:
        return '🏛️';
    }
  };

  return (
    <div
      style={cardStyle}
      onClick={() => onToggle(account.id)}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 24,
          marginBottom: 4
        }}>
          {getAccountIcon(account.typ)}
        </div>
        
        <div style={{
          fontSize: 12,
          fontWeight: 'bold',
          color: '#fff',
          lineHeight: '1.2',
          wordBreak: 'break-word',
          width: '100%'
        }}>
          {account.name}
        </div>
        
        <div style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: balanceColor,
          lineHeight: '1.1'
        }}>
          {formatCurrency(saldo)}
        </div>
        
        <div style={{
          fontSize: 10,
          color: '#999',
          textTransform: 'capitalize'
        }}>
          {account.typ}
        </div>
      </div>
      
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: account.farbe,
          border: '2px solid #fff'
        }} />
      )}
    </div>
  );
}
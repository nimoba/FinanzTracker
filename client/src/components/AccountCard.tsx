import React from 'react';
import { 
  Wallet, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  DollarSign,
  Edit2,
  Trash2
} from 'lucide-react';
interface AccountCardProps {
  account: any;
  onEdit: (account: any) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  deleting = false
}) => {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Banknote className="w-8 h-8" />;
      case 'savings':
        return <DollarSign className="w-8 h-8" />;
      case 'credit':
        return <CreditCard className="w-8 h-8" />;
      case 'investment':
        return <TrendingUp className="w-8 h-8" />;
      case 'cash':
        return <Wallet className="w-8 h-8" />;
      default:
        return <Wallet className="w-8 h-8" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking':
        return 'Checking Account';
      case 'savings':
        return 'Savings Account';
      case 'credit':
        return 'Credit Card';
      case 'investment':
        return 'Investment Account';
      case 'cash':
        return 'Cash';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getBalanceColor = (balance: number, type: string) => {
    if (type === 'credit') {
      return balance > 0 ? 'text-red-600' : 'text-green-600';
    }
    return balance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatBalance = (balance: number, type: string) => {
    const formattedBalance = Math.abs(balance).toFixed(2);
    if (type === 'credit') {
      return balance > 0 ? `$${formattedBalance} owed` : `$${formattedBalance} available`;
    }
    return `$${formattedBalance}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: account.color }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className="p-3 rounded-full text-white"
            style={{ backgroundColor: account.color }}
          >
            {getAccountIcon(account.type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-500">{getAccountTypeLabel(account.type)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(account)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit account"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete account"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${getBalanceColor(account.balance, account.type)}`}>
            {formatBalance(account.balance, account.type)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Last updated</span>
          <span>{new Date(account.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
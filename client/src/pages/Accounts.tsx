import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { AccountCard } from '../components/AccountCard';
import { AccountForm } from '../components/AccountForm';
// import type { Account, CreateAccountRequest } from '../../../shared/types';

export const Accounts: React.FC = () => {
  const {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount
  } = useAccountStore();

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingAccount) {
      updateAccount({ ...data, id: editingAccount.id });
    } else {
      createAccount(data);
    }
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account? This will also delete all associated transactions.')) {
      setDeletingId(id);
      deleteAccount(id);
      setDeletingId(null);
    }
  };

  // Calculate summary statistics
  const totalBalance = accounts.reduce((sum, account) => {
    if (account.type === 'credit') {
      return sum - account.balance; // Credit card debt is negative
    }
    return sum + account.balance;
  }, 0);

  const totalAssets = accounts
    .filter(account => account.type !== 'credit')
    .reduce((sum, account) => sum + account.balance, 0);

  const totalDebt = accounts
    .filter(account => account.type === 'credit')
    .reduce((sum, account) => sum + account.balance, 0);

  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<string, any[]>);

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'checking':
        return 'Checking Accounts';
      case 'savings':
        return 'Savings Accounts';
      case 'credit':
        return 'Credit Cards';
      case 'investment':
        return 'Investment Accounts';
      case 'cash':
        return 'Cash';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1) + ' Accounts';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-dark-primary">Accounts</h1>
            <p className="text-dark-muted mt-1">Manage your financial accounts and track balances</p>
          </div>
          <button
            onClick={handleAddAccount}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-muted">Net Worth</p>
                <p className={`text-2xl font-semibold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(totalBalance).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-muted">Total Assets</p>
                <p className="text-2xl font-semibold text-green-600">
                  ${totalAssets.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-muted">Total Debt</p>
                <p className="text-2xl font-semibold text-red-600">
                  ${totalDebt.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 bg-dark-secondary rounded-lg shadow-lg">
            <p className="text-dark-muted text-lg">No accounts found</p>
            <p className="text-dark-muted/70 mt-2">Add your first account to get started!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(accountsByType).map(([type, accountsOfType]) => (
              <div key={type}>
                <h2 className="text-xl font-semibold text-dark-primary mb-4">
                  {getTypeTitle(type)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accountsOfType.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onEdit={handleEditAccount}
                      onDelete={handleDeleteAccount}
                      deleting={deletingId === account.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <AccountForm
            account={editingAccount || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingAccount(null);
            }}
            loading={loading}
          />
        )}
    </div>
  );
};
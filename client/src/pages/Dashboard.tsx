import React, { useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Plus,
  Loader2 
} from 'lucide-react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useAccountStore } from '../stores/accountStore';

export const Dashboard: React.FC = () => {
  const { 
    overview, 
    loading: analyticsLoading, 
    error: analyticsError, 
    fetchOverview 
  } = useAnalyticsStore();
  const { 
    transactions, 
    fetchTransactions, 
    loading: transactionsLoading 
  } = useTransactionStore();
  const { fetchAccounts } = useAccountStore();

  useEffect(() => {
    fetchOverview();
    fetchTransactions({ limit: 5 }); // Fetch recent transactions
    fetchAccounts();
  }, [fetchOverview, fetchTransactions, fetchAccounts]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isLoading = analyticsLoading || transactionsLoading;

  return (
    <div className="max-w-7xl mx-auto">
        {/* Quick Stats */}
        {analyticsError && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{analyticsError}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-muted">Total Income</p>
                <p className="text-2xl font-semibold text-dark-primary">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    formatCurrency(overview?.total_income || 0)
                  )}
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
                <p className="text-sm font-medium text-dark-muted">Total Expenses</p>
                <p className="text-2xl font-semibold text-dark-primary">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    formatCurrency(overview?.total_expenses || 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-muted">Net Income</p>
                <p className="text-2xl font-semibold text-dark-primary">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    formatCurrency(overview?.net_income || 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-muted">Total Balance</p>
                <p className="text-2xl font-semibold text-dark-primary">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    formatCurrency(
                      overview?.account_balances?.reduce((total, account) => total + account.balance, 0) || 0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-dark-primary mb-4">Quick Actions</h2>
            <div className="flex space-x-4">
              <button 
                onClick={() => {
                  // TODO: Implement transaction modal or navigate to transactions page
                  alert('Transaction form coming soon!');
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </button>
              <button 
                onClick={() => {
                  // TODO: Implement account modal or navigate to accounts page
                  alert('Account form coming soon!');
                }}
                className="flex items-center px-4 py-2 bg-dark-accent text-dark-primary rounded-lg hover:bg-dark-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-dark-secondary rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-dark-600">
            <h2 className="text-lg font-semibold text-dark-primary">Recent Transactions</h2>
          </div>
          <div className="p-6">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-dark-muted" />
                <span className="ml-2 text-dark-muted">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-dark-muted py-8">
                <p>No transactions yet. Add your first transaction to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-dark-accent rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        transaction.type === 'income' ? 'bg-green-500' : 
                        transaction.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-dark-primary font-medium">{transaction.description}</p>
                        <p className="text-sm text-dark-muted">
                          {transaction.category?.name || 'No category'} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-400' : 
                      transaction.type === 'expense' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};
import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Plus,
  Settings,
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Dashboard: React.FC = () => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-dark-800">
      {/* Header */}
      <header className="bg-dark-secondary shadow-sm border-b border-dark-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-dark-primary">FinanceFlow</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-dark-muted hover:text-dark-secondary transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-dark-muted hover:text-dark-secondary transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Quick Stats */}
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
                <p className="text-2xl font-semibold text-dark-primary">$5,240</p>
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
                <p className="text-2xl font-semibold text-dark-primary">$3,180</p>
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
                <p className="text-2xl font-semibold text-dark-primary">$2,060</p>
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
                <p className="text-2xl font-semibold text-dark-primary">$12,420</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-dark-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-dark-primary mb-4">Quick Actions</h2>
            <div className="flex space-x-4">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </button>
              <button className="flex items-center px-4 py-2 bg-dark-accent text-dark-primary rounded-lg hover:bg-dark-600 transition-colors">
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
            <div className="text-center text-dark-muted py-8">
              <p>No transactions yet. Add your first transaction to get started!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
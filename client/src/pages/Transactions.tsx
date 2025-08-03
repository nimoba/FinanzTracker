import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from 'lucide-react';
import { useTransactionStore } from '../stores/transactionStore';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionFilters } from '../components/TransactionFilters';
import { Transaction, CreateTransactionRequest } from '../../../shared/types';
import { format } from 'date-fns';

export const Transactions: React.FC = () => {
  const {
    transactions,
    total,
    page,
    totalPages,
    loading,
    error,
    filters,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters
  } = useTransactionStore();

  const { fetchAccounts } = useAccountStore();
  const { fetchCategories } = useCategoryStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();
  }, [fetchTransactions, fetchAccounts, fetchCategories]);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateTransactionRequest) => {
    if (editingTransaction) {
      await updateTransaction({ ...data, id: editingTransaction.id });
    } else {
      await createTransaction(data);
    }
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setDeletingId(id);
      await deleteTransaction(id);
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      default:
        return <TrendingDown className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = Math.abs(amount).toFixed(2);
    switch (type) {
      case 'income':
        return `+$${formattedAmount}`;
      case 'expense':
        return `-$${formattedAmount}`;
      case 'transfer':
        return `$${formattedAmount}`;
      default:
        return `$${formattedAmount}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1">Track your income, expenses, and transfers</p>
          </div>
          <button
            onClick={handleAddTransaction}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </button>
        </div>

        <TransactionFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({})}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No transactions found</p>
              <p className="text-gray-400 mt-2">Add your first transaction to get started!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            {getTransactionIcon(transaction.type)}
                            <span className="ml-2">{transaction.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.category?.name || 'Uncategorized'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.account?.name}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAmountColor(transaction.type)}`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              disabled={deletingId === transaction.id}
                              className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                            >
                              {deletingId === transaction.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{((page - 1) * (filters.limit || 20)) + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(page * (filters.limit || 20), total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{total}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {showForm && (
          <TransactionForm
            transaction={editingTransaction || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTransaction(null);
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};
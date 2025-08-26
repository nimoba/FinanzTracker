import { create } from 'zustand';
import { storage } from '../storage';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
  account?: string;
}

interface TransactionFilters {
  page?: number;
  limit?: number;
  category?: string;
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface TransactionState {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  fetchTransactions: (filters?: TransactionFilters) => void;
  createTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
}

const defaultFilters: TransactionFilters = {
  page: 1,
  limit: 20,
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  loading: false,
  error: null,
  filters: defaultFilters,

  fetchTransactions: (filters?: TransactionFilters) => {
    const currentFilters = filters || get().filters;
    set({ loading: true, error: null, filters: currentFilters });
    
    setTimeout(() => {
      try {
        let transactions: Transaction[] = storage.getItem('transactions') || [];
        
        if (currentFilters.category) {
          transactions = transactions.filter(t => t.category === currentFilters.category);
        }
        
        if (currentFilters.type) {
          transactions = transactions.filter(t => t.type === currentFilters.type);
        }
        
        if (currentFilters.search) {
          const search = currentFilters.search.toLowerCase();
          transactions = transactions.filter(t => 
            t.description.toLowerCase().includes(search) ||
            t.category.toLowerCase().includes(search)
          );
        }
        
        if (currentFilters.startDate) {
          transactions = transactions.filter(t => t.date >= currentFilters.startDate!);
        }
        
        if (currentFilters.endDate) {
          transactions = transactions.filter(t => t.date <= currentFilters.endDate!);
        }
        
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const total = transactions.length;
        const page = currentFilters.page || 1;
        const limit = currentFilters.limit || 20;
        const startIndex = (page - 1) * limit;
        const paginatedTransactions = transactions.slice(startIndex, startIndex + limit);
        
        set({ 
          transactions: paginatedTransactions,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          loading: false 
        });
      } catch (error) {
        set({ error: 'Failed to fetch transactions', loading: false });
      }
    }, 100);
  },

  createTransaction: (transactionData: Omit<Transaction, 'id'>) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const transactions: Transaction[] = storage.getItem('transactions') || [];
        const newTransaction: Transaction = {
          ...transactionData,
          id: storage.generateId()
        };
        
        transactions.push(newTransaction);
        storage.setItem('transactions', transactions);
        
        get().fetchTransactions();
      } catch (error) {
        set({ error: 'Failed to create transaction', loading: false });
      }
    }, 100);
  },

  updateTransaction: (transactionData: Transaction) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const transactions: Transaction[] = storage.getItem('transactions') || [];
        const index = transactions.findIndex(t => t.id === transactionData.id);
        
        if (index !== -1) {
          transactions[index] = transactionData;
          storage.setItem('transactions', transactions);
        }
        
        get().fetchTransactions();
      } catch (error) {
        set({ error: 'Failed to update transaction', loading: false });
      }
    }, 100);
  },

  deleteTransaction: (id: string) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const transactions: Transaction[] = storage.getItem('transactions') || [];
        const filteredTransactions = transactions.filter(t => t.id !== id);
        storage.setItem('transactions', filteredTransactions);
        
        get().fetchTransactions();
      } catch (error) {
        set({ error: 'Failed to delete transaction', loading: false });
      }
    }, 100);
  },

  setFilters: (newFilters: Partial<TransactionFilters>) => {
    const updatedFilters = { ...get().filters, ...newFilters };
    set({ filters: updatedFilters });
    get().fetchTransactions(updatedFilters);
  },

  clearFilters: () => {
    set({ filters: defaultFilters });
    get().fetchTransactions(defaultFilters);
  },
}));
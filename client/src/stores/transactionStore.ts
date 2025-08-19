import { create } from 'zustand';
import type { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest, 
  TransactionFilters,
  PaginatedResponse 
} from '../../../shared/types';
import { API_URL } from '../config/api';
import { authenticatedFetch } from '../utils/api';

interface TransactionState {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (transaction: CreateTransactionRequest) => Promise<void>;
  updateTransaction: (transaction: UpdateTransactionRequest) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
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

  fetchTransactions: async (filters?: TransactionFilters) => {
    const currentFilters = filters || get().filters;
    set({ loading: true, error: null, filters: currentFilters });
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await authenticatedFetch(`${API_URL}/transactions?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data: PaginatedResponse<Transaction> = await response.json();
      set({ 
        transactions: data.data,
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        loading: false 
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch transactions', loading: false });
    }
  },

  createTransaction: async (transactionData: CreateTransactionRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/transactions`, {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) throw new Error('Failed to create transaction');
      
      // Refresh transactions after creating
      await get().fetchTransactions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create transaction', loading: false });
    }
  },

  updateTransaction: async (transactionData: UpdateTransactionRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/transactions/${transactionData.id}`, {
        method: 'PUT',
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) throw new Error('Failed to update transaction');
      
      // Refresh transactions after updating
      await get().fetchTransactions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update transaction', loading: false });
    }
  },

  deleteTransaction: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
      
      // Refresh transactions after deleting
      await get().fetchTransactions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete transaction', loading: false });
    }
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
import { create } from 'zustand';
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '../../../shared/types';
import { API_URL } from '../config/api';
import { authenticatedFetch } from '../utils/api';

interface AccountState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (account: CreateAccountRequest) => Promise<void>;
  updateAccount: (account: UpdateAccountRequest) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/accounts`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const accounts = await response.json();
      set({ accounts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch accounts', loading: false });
    }
  },

  createAccount: async (accountData: CreateAccountRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/accounts`, {
        method: 'POST',
        body: JSON.stringify(accountData),
      });
      if (!response.ok) throw new Error('Failed to create account');
      const newAccount = await response.json();
      set(state => ({ 
        accounts: [...state.accounts, newAccount], 
        loading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create account', loading: false });
    }
  },

  updateAccount: async (accountData: UpdateAccountRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/accounts/${accountData.id}`, {
        method: 'PUT',
        body: JSON.stringify(accountData),
      });
      if (!response.ok) throw new Error('Failed to update account');
      const updatedAccount = await response.json();
      set(state => ({
        accounts: state.accounts.map(acc => acc.id === accountData.id ? updatedAccount : acc),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update account', loading: false });
    }
  },

  deleteAccount: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/accounts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete account');
      set(state => ({
        accounts: state.accounts.filter(acc => acc.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete account', loading: false });
    }
  },
}));
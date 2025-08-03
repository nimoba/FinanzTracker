import { create } from 'zustand';
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '../../../shared/types';

interface AccountState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (account: CreateAccountRequest) => Promise<void>;
  updateAccount: (account: UpdateAccountRequest) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts`);
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
      const response = await fetch(`${API_BASE_URL}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${API_BASE_URL}/api/accounts/${accountData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
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
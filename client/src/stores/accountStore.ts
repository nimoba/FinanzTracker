import { create } from 'zustand';
import { storage } from '../storage';

interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
}

interface AccountState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => void;
  createAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: () => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const accounts: Account[] = storage.getItem('accounts') || [];
        set({ accounts, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch accounts', loading: false });
      }
    }, 100);
  },

  createAccount: (accountData: Omit<Account, 'id'>) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const accounts: Account[] = storage.getItem('accounts') || [];
        const newAccount: Account = {
          ...accountData,
          id: storage.generateId()
        };
        
        accounts.push(newAccount);
        storage.setItem('accounts', accounts);
        
        set(state => ({ 
          accounts: [...state.accounts, newAccount], 
          loading: false 
        }));
      } catch (error) {
        set({ error: 'Failed to create account', loading: false });
      }
    }, 100);
  },

  updateAccount: (accountData: Account) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const accounts: Account[] = storage.getItem('accounts') || [];
        const index = accounts.findIndex(acc => acc.id === accountData.id);
        
        if (index !== -1) {
          accounts[index] = accountData;
          storage.setItem('accounts', accounts);
        }
        
        set(state => ({
          accounts: state.accounts.map(acc => acc.id === accountData.id ? accountData : acc),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update account', loading: false });
      }
    }, 100);
  },

  deleteAccount: (id: string) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const accounts: Account[] = storage.getItem('accounts') || [];
        const filteredAccounts = accounts.filter(acc => acc.id !== id);
        storage.setItem('accounts', filteredAccounts);
        
        set(state => ({
          accounts: state.accounts.filter(acc => acc.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete account', loading: false });
      }
    }, 100);
  },
}));
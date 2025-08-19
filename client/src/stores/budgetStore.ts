import { create } from 'zustand';
import type { Budget, CreateBudgetRequest, UpdateBudgetRequest } from '../../../shared/types';
import { API_URL } from '../config/api';
import { authenticatedFetch } from '../utils/api';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  createBudget: (budget: CreateBudgetRequest) => Promise<void>;
  updateBudget: (budget: UpdateBudgetRequest) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
  getBudgetProgress: (budgetId: number) => Promise<{ spent: number; remaining: number; percentage: number }>;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  loading: false,
  error: null,

  fetchBudgets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/budgets`);
      if (!response.ok) throw new Error('Failed to fetch budgets');
      const budgets = await response.json();
      set({ budgets, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch budgets', loading: false });
    }
  },

  createBudget: async (budgetData: CreateBudgetRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/budgets`, {
        method: 'POST',
        body: JSON.stringify(budgetData),
      });
      if (!response.ok) throw new Error('Failed to create budget');
      const newBudget = await response.json();
      set(state => ({ 
        budgets: [...state.budgets, newBudget], 
        loading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create budget', loading: false });
    }
  },

  updateBudget: async (budgetData: UpdateBudgetRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/budgets/${budgetData.id}`, {
        method: 'PUT',
        body: JSON.stringify(budgetData),
      });
      if (!response.ok) throw new Error('Failed to update budget');
      const updatedBudget = await response.json();
      set(state => ({
        budgets: state.budgets.map(budget => budget.id === budgetData.id ? updatedBudget : budget),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update budget', loading: false });
    }
  },

  deleteBudget: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/budgets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete budget');
      set(state => ({
        budgets: state.budgets.filter(budget => budget.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete budget', loading: false });
    }
  },

  getBudgetProgress: async (budgetId: number) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/budgets/${budgetId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch budget progress');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch budget progress:', error);
      return { spent: 0, remaining: 0, percentage: 0 };
    }
  },
}));
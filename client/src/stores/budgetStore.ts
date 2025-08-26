import { create } from 'zustand';
import { storage } from '../storage';

interface Budget {
  id: string;
  name: string;
  amount: number;
  category: string;
  period: 'monthly' | 'yearly';
  spent: number;
}

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  fetchBudgets: () => void;
  createBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  getBudgetProgress: (budgetId: string) => { spent: number; remaining: number; percentage: number };
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  loading: false,
  error: null,

  fetchBudgets: () => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const budgets: Budget[] = storage.getItem('budgets') || [];
        set({ budgets, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch budgets', loading: false });
      }
    }, 100);
  },

  createBudget: (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const budgets: Budget[] = storage.getItem('budgets') || [];
        const newBudget: Budget = {
          ...budgetData,
          id: storage.generateId(),
          spent: 0
        };
        
        budgets.push(newBudget);
        storage.setItem('budgets', budgets);
        
        set(state => ({ 
          budgets: [...state.budgets, newBudget], 
          loading: false 
        }));
      } catch (error) {
        set({ error: 'Failed to create budget', loading: false });
      }
    }, 100);
  },

  updateBudget: (budgetData: Budget) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const budgets: Budget[] = storage.getItem('budgets') || [];
        const index = budgets.findIndex(budget => budget.id === budgetData.id);
        
        if (index !== -1) {
          budgets[index] = budgetData;
          storage.setItem('budgets', budgets);
        }
        
        set(state => ({
          budgets: state.budgets.map(budget => budget.id === budgetData.id ? budgetData : budget),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update budget', loading: false });
      }
    }, 100);
  },

  deleteBudget: (id: string) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const budgets: Budget[] = storage.getItem('budgets') || [];
        const filteredBudgets = budgets.filter(budget => budget.id !== id);
        storage.setItem('budgets', filteredBudgets);
        
        set(state => ({
          budgets: state.budgets.filter(budget => budget.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete budget', loading: false });
      }
    }, 100);
  },

  getBudgetProgress: (budgetId: string) => {
    const budgets: Budget[] = storage.getItem('budgets') || [];
    const budget = budgets.find(b => b.id === budgetId);
    
    if (!budget) {
      return { spent: 0, remaining: 0, percentage: 0 };
    }
    
    const remaining = Math.max(0, budget.amount - budget.spent);
    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    
    return {
      spent: budget.spent,
      remaining,
      percentage: Math.round(percentage)
    };
  },
}));
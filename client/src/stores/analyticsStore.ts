import { create } from 'zustand';
import { storage } from '../storage';

interface AnalyticsOverview {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
}

interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  spendingByCategory: SpendingByCategory[];
  cashFlowData: CashFlowData[];
  loading: boolean;
  error: string | null;
  fetchOverview: () => void;
  fetchSpendingByCategory: (period?: string) => void;
  fetchCashFlow: (period?: string) => void;
  fetchAllAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  overview: null,
  spendingByCategory: [],
  cashFlowData: [],
  loading: false,
  error: null,

  fetchOverview: () => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const transactions = storage.getItem('transactions') || [];
        
        const totalIncome = transactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + t.amount, 0);
          
        const totalExpenses = transactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + t.amount, 0);
        
        const overview: AnalyticsOverview = {
          totalIncome,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          transactionCount: transactions.length
        };
        
        set({ overview, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch analytics overview', loading: false });
      }
    }, 100);
  },

  fetchSpendingByCategory: () => {
    try {
      const transactions = storage.getItem('transactions') || [];
      const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
      
      const categoryTotals = expenseTransactions.reduce((acc: any, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
      
      const totalExpenses = Object.values(categoryTotals).reduce((sum: number, amount: any) => sum + amount, 0);
      
      const spendingByCategory: SpendingByCategory[] = Object.entries(categoryTotals).map(([category, amount]: [string, any]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
      }));
      
      set({ spendingByCategory });
    } catch (error) {
      set({ error: 'Failed to fetch spending by category' });
    }
  },

  fetchCashFlow: () => {
    try {
      const transactions = storage.getItem('transactions') || [];
      
      const groupedByDate = transactions.reduce((acc: any, t: any) => {
        const date = t.date.split('T')[0];
        if (!acc[date]) {
          acc[date] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
          acc[date].income += t.amount;
        } else {
          acc[date].expenses += t.amount;
        }
        return acc;
      }, {});
      
      const cashFlowData: CashFlowData[] = Object.entries(groupedByDate)
        .map(([date, data]: [string, any]) => ({
          date,
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      set({ cashFlowData });
    } catch (error) {
      set({ error: 'Failed to fetch cash flow data' });
    }
  },

  fetchAllAnalytics: () => {
    set({ loading: true, error: null });
    try {
      get().fetchOverview();
      get().fetchSpendingByCategory();
      get().fetchCashFlow();
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch analytics data', loading: false });
    }
  },
}));
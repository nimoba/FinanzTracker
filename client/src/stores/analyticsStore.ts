import { create } from 'zustand';
import type { 
  AnalyticsOverview, 
  SpendingByCategory, 
  CashFlowData 
} from '../../../shared/types';
import { API_URL } from '../config/api';
import { authenticatedFetch } from '../utils/api';

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  spendingByCategory: SpendingByCategory[];
  cashFlowData: CashFlowData[];
  loading: boolean;
  error: string | null;
  fetchOverview: () => Promise<void>;
  fetchSpendingByCategory: (period?: string) => Promise<void>;
  fetchCashFlow: (period?: string) => Promise<void>;
  fetchAllAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  overview: null,
  spendingByCategory: [],
  cashFlowData: [],
  loading: false,
  error: null,

  fetchOverview: async () => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedFetch(`${API_URL}/analytics/overview`);
      if (!response.ok) throw new Error('Failed to fetch analytics overview');
      const overview = await response.json();
      set({ overview, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch analytics overview', loading: false });
    }
  },

  fetchSpendingByCategory: async (period = '30') => {
    try {
      const response = await authenticatedFetch(`${API_URL}/analytics/spending-by-category?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch spending by category');
      const spendingByCategory = await response.json();
      set({ spendingByCategory });
    } catch (error) {
      console.error('Failed to fetch spending by category:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch spending by category' });
    }
  },

  fetchCashFlow: async (period = '30') => {
    try {
      const response = await authenticatedFetch(`${API_URL}/analytics/cash-flow?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch cash flow data');
      const cashFlowData = await response.json();
      set({ cashFlowData });
    } catch (error) {
      console.error('Failed to fetch cash flow data:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch cash flow data' });
    }
  },

  fetchAllAnalytics: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchOverview(),
        get().fetchSpendingByCategory(),
        get().fetchCashFlow()
      ]);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch analytics data', loading: false });
    }
  },
}));
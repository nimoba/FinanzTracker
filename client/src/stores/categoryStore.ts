import { create } from 'zustand';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../shared/types';

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (category: CreateCategoryRequest) => Promise<void>;
  updateCategory: (category: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  getIncomeCategories: () => Category[];
  getExpenseCategories: () => Category[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const categories = await response.json();
      set({ categories, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch categories', loading: false });
    }
  },

  createCategory: async (categoryData: CreateCategoryRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error('Failed to create category');
      const newCategory = await response.json();
      set(state => ({ 
        categories: [...state.categories, newCategory], 
        loading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create category', loading: false });
    }
  },

  updateCategory: async (categoryData: UpdateCategoryRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error('Failed to update category');
      const updatedCategory = await response.json();
      set(state => ({
        categories: state.categories.map(cat => cat.id === categoryData.id ? updatedCategory : cat),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update category', loading: false });
    }
  },

  deleteCategory: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete category', loading: false });
    }
  },

  getIncomeCategories: () => {
    return get().categories.filter(cat => cat.type === 'income');
  },

  getExpenseCategories: () => {
    return get().categories.filter(cat => cat.type === 'expense');
  },
}));
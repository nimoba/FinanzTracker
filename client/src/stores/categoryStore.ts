import { create } from 'zustand';
import { storage } from '../storage';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => void;
  createCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  getIncomeCategories: () => Category[];
  getExpenseCategories: () => Category[];
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: () => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const categories: Category[] = storage.getItem('categories') || [];
        set({ categories, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch categories', loading: false });
      }
    }, 100);
  },

  createCategory: (categoryData: Omit<Category, 'id'>) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const categories: Category[] = storage.getItem('categories') || [];
        const newCategory: Category = {
          ...categoryData,
          id: storage.generateId()
        };
        
        categories.push(newCategory);
        storage.setItem('categories', categories);
        
        set(state => ({ 
          categories: [...state.categories, newCategory], 
          loading: false 
        }));
      } catch (error) {
        set({ error: 'Failed to create category', loading: false });
      }
    }, 100);
  },

  updateCategory: (categoryData: Category) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const categories: Category[] = storage.getItem('categories') || [];
        const index = categories.findIndex(cat => cat.id === categoryData.id);
        
        if (index !== -1) {
          categories[index] = categoryData;
          storage.setItem('categories', categories);
        }
        
        set(state => ({
          categories: state.categories.map(cat => cat.id === categoryData.id ? categoryData : cat),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update category', loading: false });
      }
    }, 100);
  },

  deleteCategory: (id: string) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const categories: Category[] = storage.getItem('categories') || [];
        const filteredCategories = categories.filter(cat => cat.id !== id);
        storage.setItem('categories', filteredCategories);
        
        set(state => ({
          categories: state.categories.filter(cat => cat.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete category', loading: false });
      }
    }, 100);
  },

  getIncomeCategories: () => {
    return get().categories.filter(cat => cat.type === 'income');
  },

  getExpenseCategories: () => {
    return get().categories.filter(cat => cat.type === 'expense');
  },
}));
// Storage utility for localStorage persistence
export const storage = {
  // User management
  setUser: (user: any) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem('user'),

  // Generic data storage
  setItem: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  getItem: (key: string) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  removeItem: (key: string) => localStorage.removeItem(key),

  // Generate unique IDs
  generateId: () => Date.now().toString() + Math.random().toString(36).substr(2, 9),

  // Initialize default data structure
  initializeDefaults: () => {
    if (!storage.getItem('transactions')) {
      storage.setItem('transactions', []);
    }
    if (!storage.getItem('accounts')) {
      storage.setItem('accounts', []);
    }
    if (!storage.getItem('categories')) {
      storage.setItem('categories', [
        { id: '1', name: 'Food', type: 'expense' },
        { id: '2', name: 'Transportation', type: 'expense' },
        { id: '3', name: 'Salary', type: 'income' },
        { id: '4', name: 'Entertainment', type: 'expense' }
      ]);
    }
    if (!storage.getItem('budgets')) {
      storage.setItem('budgets', []);
    }
    if (!storage.getItem('goals')) {
      storage.setItem('goals', []);
    }
  }
};
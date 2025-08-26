import { create } from 'zustand';
import { storage } from '../storage';

const DEMO_PASSWORD = 'demo';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  user: { id: string; name: string } | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  loading: false,
  error: null,
  user: storage.getUser(),

  login: async (password: string) => {
    set({ loading: true, error: null });
    
    setTimeout(() => {
      if (password === DEMO_PASSWORD) {
        const user = { id: '1', name: 'Demo User' };
        storage.setUser(user);
        storage.initializeDefaults();
        set({ 
          isAuthenticated: true, 
          loading: false, 
          error: null, 
          user 
        });
      } else {
        set({ 
          isAuthenticated: false, 
          loading: false, 
          error: 'Invalid password. Use "demo"' 
        });
      }
    }, 500);
  },

  logout: () => {
    storage.removeUser();
    set({ isAuthenticated: false, error: null, user: null });
  },

  checkAuth: () => {
    const user = storage.getUser();
    if (user) {
      storage.initializeDefaults();
      set({ isAuthenticated: true, user });
    } else {
      set({ isAuthenticated: false, user: null });
    }
  },
}));
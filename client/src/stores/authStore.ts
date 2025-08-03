import { create } from 'zustand';
import type { AuthRequest, AuthResponse } from '../../../shared/types';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (password: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password } as AuthRequest),
      });

      const data: AuthResponse = await response.json();

      if (data.success) {
        document.cookie = 'app_access_token=authenticated; max-age=2592000; path=/';
        set({ isAuthenticated: true, loading: false, error: null });
      } else {
        set({ 
          isAuthenticated: false, 
          loading: false, 
          error: data.error || 'Authentication failed' 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        isAuthenticated: false, 
        loading: false, 
        error: 'Network error. Please try again.' 
      });
    }
  },

  logout: () => {
    document.cookie = 'app_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    set({ isAuthenticated: false, error: null });
  },

  checkAuth: () => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith('app_access_token=authenticated')
    );
    
    set({ isAuthenticated: !!authCookie });
  },
}));
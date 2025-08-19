import { create } from 'zustand';
import type { AuthRequest, AuthResponse } from '../../../shared/types';
import { API_URL } from '../config/api';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  loading: false,
  error: null,
  token: localStorage.getItem('auth_token'),

  login: async (password: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password } as AuthRequest),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        set({ isAuthenticated: true, loading: false, error: null, token: data.token });
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

  logout: async () => {
    const token = get().token;
    
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('auth_token');
    set({ isAuthenticated: false, error: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      set({ isAuthenticated: false, token: null });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        set({ isAuthenticated: true, token });
      } else {
        localStorage.removeItem('auth_token');
        set({ isAuthenticated: false, token: null });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('auth_token');
      set({ isAuthenticated: false, token: null });
    }
  },
}));
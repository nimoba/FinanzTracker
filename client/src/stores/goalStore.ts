import { create } from 'zustand';
import type { Goal, CreateGoalRequest, UpdateGoalRequest } from '../../../shared/types';

interface GoalState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (goal: CreateGoalRequest) => Promise<void>;
  updateGoal: (goal: UpdateGoalRequest) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  updateProgress: (id: number, amount: number) => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals`);
      if (!response.ok) throw new Error('Failed to fetch goals');
      const goals = await response.json();
      set({ goals, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch goals', loading: false });
    }
  },

  createGoal: async (goalData: CreateGoalRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!response.ok) throw new Error('Failed to create goal');
      const newGoal = await response.json();
      set(state => ({ 
        goals: [...state.goals, newGoal], 
        loading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create goal', loading: false });
    }
  },

  updateGoal: async (goalData: UpdateGoalRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${goalData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!response.ok) throw new Error('Failed to update goal');
      const updatedGoal = await response.json();
      set(state => ({
        goals: state.goals.map(goal => goal.id === goalData.id ? updatedGoal : goal),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update goal', loading: false });
    }
  },

  deleteGoal: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete goal');
      set(state => ({
        goals: state.goals.filter(goal => goal.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete goal', loading: false });
    }
  },

  updateProgress: async (id: number, amount: number) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Failed to update goal progress');
      const updatedGoal = await response.json();
      set(state => ({
        goals: state.goals.map(goal => goal.id === id ? updatedGoal : goal),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update goal progress', loading: false });
    }
  },
}));
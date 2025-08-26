import { create } from 'zustand';
import { storage } from '../storage';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description?: string;
}

interface GoalState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => void;
  createGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateProgress: (id: string, amount: number) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: () => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const goals: Goal[] = storage.getItem('goals') || [];
        set({ goals, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch goals', loading: false });
      }
    }, 100);
  },

  createGoal: (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const goals: Goal[] = storage.getItem('goals') || [];
        const newGoal: Goal = {
          ...goalData,
          id: storage.generateId(),
          currentAmount: 0
        };
        
        goals.push(newGoal);
        storage.setItem('goals', goals);
        
        set(state => ({ 
          goals: [...state.goals, newGoal], 
          loading: false 
        }));
      } catch (error) {
        set({ error: 'Failed to create goal', loading: false });
      }
    }, 100);
  },

  updateGoal: (goalData: Goal) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const goals: Goal[] = storage.getItem('goals') || [];
        const index = goals.findIndex(goal => goal.id === goalData.id);
        
        if (index !== -1) {
          goals[index] = goalData;
          storage.setItem('goals', goals);
        }
        
        set(state => ({
          goals: state.goals.map(goal => goal.id === goalData.id ? goalData : goal),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update goal', loading: false });
      }
    }, 100);
  },

  deleteGoal: (id: string) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const goals: Goal[] = storage.getItem('goals') || [];
        const filteredGoals = goals.filter(goal => goal.id !== id);
        storage.setItem('goals', filteredGoals);
        
        set(state => ({
          goals: state.goals.filter(goal => goal.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete goal', loading: false });
      }
    }, 100);
  },

  updateProgress: (id: string, amount: number) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      try {
        const goals: Goal[] = storage.getItem('goals') || [];
        const index = goals.findIndex(goal => goal.id === id);
        
        if (index !== -1) {
          goals[index].currentAmount = amount;
          storage.setItem('goals', goals);
          
          set(state => ({
            goals: state.goals.map(goal => goal.id === id ? {...goal, currentAmount: amount} : goal),
            loading: false
          }));
        } else {
          set({ loading: false, error: 'Goal not found' });
        }
      } catch (error) {
        set({ error: 'Failed to update goal progress', loading: false });
      }
    }, 100);
  },
}));
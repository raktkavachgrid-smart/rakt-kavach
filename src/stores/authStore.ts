import { create } from 'zustand';
import type { User, UserRole, AuthSession } from '@/types';

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setSession: (session: AuthSession | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  login: (user: User, session: AuthSession) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  logout: () => set({
    user: null,
    session: null,
    isAuthenticated: false,
    error: null,
  }),
  
  login: (user, session) => set({
    user,
    session,
    isAuthenticated: true,
    error: null,
  }),
}));

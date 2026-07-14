import { create } from 'zustand';
import { SOSRequest } from '@/types';

interface SOSState {
  activeRequests: SOSRequest[];
  totalRequests: number;
  isLoading: boolean;
  error: string | null;
  
  fetchSOSRequests: () => Promise<void>;
  createSOSRequest: (request: Omit<SOSRequest, 'id' | 'createdAt'>) => Promise<void>;
  updateSOSStatus: (requestId: string, status: string) => Promise<void>;
  getActiveAlerts: () => SOSRequest[];
}

export const useSOSStore = create<SOSState>((set, get) => ({
  activeRequests: [],
  totalRequests: 0,
  isLoading: false,
  error: null,
  
  fetchSOSRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/sos');
      if (!response.ok) throw new Error('Failed to fetch SOS requests');
      
      const data = await response.json();
      set({
        activeRequests: data,
        totalRequests: data.length,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch SOS requests',
        isLoading: false,
      });
    }
  },
  
  createSOSRequest: async (request: Omit<SOSRequest, 'id' | 'createdAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) throw new Error('Failed to create SOS request');
      
      const newRequest = await response.json();
      const state = get();
      
      set({
        activeRequests: [...state.activeRequests, newRequest],
        totalRequests: state.totalRequests + 1,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create SOS request',
        isLoading: false,
      });
    }
  },
  
  updateSOSStatus: async (requestId: string, status: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/sos/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Failed to update SOS status');
      
      const state = get();
      const updated = state.activeRequests.map(r =>
        r.id === requestId ? { ...r, status: status as any } : r
      );
      
      set({
        activeRequests: updated,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update SOS status',
        isLoading: false,
      });
    }
  },
  
  getActiveAlerts: () => {
    const state = get();
    return state.activeRequests.filter(r => r.status === 'active');
  },
}));

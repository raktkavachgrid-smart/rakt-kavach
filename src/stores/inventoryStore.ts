import { create } from 'zustand';
import { BloodUnit, BloodGroup, BloodStatus } from '@/types';

interface InventoryState {
  units: BloodUnit[];
  totalUnits: number;
  inventoryByBloodGroup: Record<BloodGroup, number>;
  isLoading: boolean;
  error: string | null;
  
  fetchInventory: () => Promise<void>;
  addUnit: (unit: BloodUnit) => void;
  removeUnit: (unitId: string) => void;
  updateUnitStatus: (unitId: string, status: BloodStatus) => Promise<void>;
  getUnitsExpiringSoon: () => BloodUnit[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  units: [],
  totalUnits: 0,
  inventoryByBloodGroup: {
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
    'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0,
  },
  isLoading: false,
  error: null,
  
  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      
      const data = await response.json();
      const bloodGroupCount: Record<BloodGroup, number> = {
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
        'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0,
      };
      
      data.forEach((unit: BloodUnit) => {
        bloodGroupCount[unit.bloodGroup]++;
      });
      
      set({
        units: data,
        totalUnits: data.length,
        inventoryByBloodGroup: bloodGroupCount,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch inventory',
        isLoading: false,
      });
    }
  },
  
  addUnit: (unit: BloodUnit) => {
    const state = get();
    const newInventory = { ...state.inventoryByBloodGroup };
    newInventory[unit.bloodGroup]++;
    
    set({
      units: [...state.units, unit],
      totalUnits: state.totalUnits + 1,
      inventoryByBloodGroup: newInventory,
    });
  },
  
  removeUnit: (unitId: string) => {
    const state = get();
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return;
    
    const newInventory = { ...state.inventoryByBloodGroup };
    newInventory[unit.bloodGroup]--;
    
    set({
      units: state.units.filter(u => u.id !== unitId),
      totalUnits: state.totalUnits - 1,
      inventoryByBloodGroup: newInventory,
    });
  },
  
  updateUnitStatus: async (unitId: string, status: BloodStatus) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/inventory/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Failed to update unit status');
      
      const state = get();
      const updatedUnits = state.units.map(u =>
        u.id === unitId ? { ...u, status } : u
      );
      
      set({
        units: updatedUnits,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update unit',
        isLoading: false,
      });
    }
  },
  
  getUnitsExpiringSoon: () => {
    const state = get();
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return state.units.filter(
      unit => unit.status === 'validated' && 
      unit.expiryDate <= sevenDaysLater &&
      unit.expiryDate >= now
    );
  },
}));

import { create } from 'zustand';

interface AppState {
  currentTab: 'dashboard' | 'new-prescription' | 'patients' | 'medicines' | 'history' | 'settings';
  setCurrentTab: (tab: AppState['currentTab']) => void;
  
  // For duplicating or viewing prescriptions
  activePrescriptionId: number | null;
  setActivePrescriptionId: (id: number | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentTab: 'dashboard',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  activePrescriptionId: null,
  setActivePrescriptionId: (id) => set({ activePrescriptionId: id }),
}));

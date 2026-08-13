import { create } from 'zustand';

export interface RoleDraft {
  id: string; // for UI tracking
  role_name: string;
  quantity: number;
  gender: 'Male' | 'Female' | 'Any';
  age_min: number;
  age_max: number;
  budget: number;
}

export interface ProjectDraftState {
  currentStep: number;
  
  // Step 1: Universal Blueprint
  title: string;
  description: string;
  visibility: 'public' | 'private';
  
  // Step 2: Dynamic Logistics
  category_specific_data: Record<string, string>;
  
  // Step 3 & 4: Talent Roles (The Bundle)
  roles: RoleDraft[];
  
  // Actions
  setStep: (step: number) => void;
  updateDraft: (data: Partial<ProjectDraftState>) => void;
  updateCategoryData: (data: Record<string, string>) => void;
  addRole: (role: RoleDraft) => void;
  updateRole: (id: string, updates: Partial<RoleDraft>) => void;
  removeRole: (id: string) => void;
  resetDraft: () => void;
}

const initialState = {
  currentStep: 1,
  title: '',
  description: '',
  visibility: 'public' as 'public' | 'private',
  category_specific_data: {},
  roles: []
};

export const useProjectDraftStore = create<ProjectDraftState>((set) => ({
  ...initialState,
  
  setStep: (step) => set({ currentStep: step }),
  
  updateDraft: (data) => set((state) => ({ ...state, ...data })),
  
  updateCategoryData: (data) => set((state) => ({
    category_specific_data: { ...state.category_specific_data, ...data }
  })),

  addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
  
  updateRole: (id, updates) => set((state) => ({
    roles: state.roles.map((r) => r.id === id ? { ...r, ...updates } : r)
  })),
  
  removeRole: (id) => set((state) => ({
    roles: state.roles.filter((r) => r.id !== id)
  })),

  resetDraft: () => set(initialState)
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- 1. AUTH STORE ---
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null;
  login: (token: string, userData?: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: null,
      login: (token, userData = null) => set({ token, isAuthenticated: true, user: userData }),
      logout: () => set({ token: null, isAuthenticated: false, user: null }),
    }),
    { name: 'orland-auth-storage' }
  )
);

// --- 2. THEME STORE ---
// Menggunakan 'isDark' sesuai error: TS2339 Property 'isDark' does not exist
interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    { name: 'orland-theme-storage' }
  )
);

// --- 3. PROFILE DRAFT STORE ---
// Menggunakan draftData, updateDraft, dan clearDraft sesuai error TS2339
interface ProfileDraftState {
  draftData: any;
  updateDraft: (data: any) => void;
  clearDraft: () => void;
}

export const useProfileDraftStore = create<ProfileDraftState>()(
  persist(
    (set) => ({
      draftData: null,
      updateDraft: (data) => set((state) => ({ draftData: { ...state.draftData, ...data } })),
      clearDraft: () => set({ draftData: null }),
    }),
    { name: 'orland-profile-draft' }
  )
);

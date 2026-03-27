import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- 1. AUTH STORE ---
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null; // Ditambahkan kembali agar DashboardLayout tidak error
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

// --- 2. THEME STORE (Restorasi) ---
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'orland-theme-storage' }
  )
);

// --- 3. PROFILE DRAFT STORE (Restorasi) ---
interface ProfileDraftState {
  draft: any;
  setDraft: (draft: any) => void;
}
export const useProfileDraftStore = create<ProfileDraftState>()((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
}));

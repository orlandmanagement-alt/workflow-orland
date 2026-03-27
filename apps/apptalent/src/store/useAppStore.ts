import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null; // Tempat menyimpan data dari API (email, nama, dll)
  login: (token: string, userData?: any) => void;
  setUser: (userData: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: null,
      login: (token, userData = null) => set({ token, isAuthenticated: true, user: userData }),
      setUser: (userData) => set({ user: userData }),
      logout: () => set({ token: null, isAuthenticated: false, user: null }),
    }),
    { name: 'orland-auth-storage' }
  )
);

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => {
        // Otomatis inject class 'dark' ke elemen HTML
        if (!state.isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDark: !state.isDark };
      }),
    }),
    { name: 'orland-theme-storage' }
  )
);

interface ProfileDraftState { draftData: any; updateDraft: (data: any) => void; clearDraft: () => void; }
export const useProfileDraftStore = create<ProfileDraftState>()(persist((set) => ({ draftData: null, updateDraft: (data) => set((state) => ({ draftData: { ...state.draftData, ...data } })), clearDraft: () => set({ draftData: null }) }), { name: 'orland-profile-draft' }));

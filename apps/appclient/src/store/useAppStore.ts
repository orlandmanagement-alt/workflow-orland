import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CompanyCategory = 'PH' | 'EO' | 'KOL' | 'BRAND' | null;

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null; 
  companyCategory: CompanyCategory;
  login: (token: string, userData?: any) => void;
  setUser: (userData: any) => void;
  setCategory: (category: CompanyCategory) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: null,
      companyCategory: null,
      login: (token, userData = null) => set({ token, isAuthenticated: true, user: userData }),
      setUser: (userData) => set({ user: userData }),
      setCategory: (category) => set({ companyCategory: category }),
      // Saat logout dipanggil, HANCURKAN semua state ke null
      logout: () => set({ token: null, isAuthenticated: false, user: null, companyCategory: null }),
    }),
    { 
      name: 'orland-auth-storage',
      // Cegah persist dari sinkronisasi otomatis jika state sudah null
      onRehydrateStorage: () => (state) => {
        if (!state?.token) {
          state?.logout();
        }
      }
    }
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

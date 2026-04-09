import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null; // Tempat menyimpan data dari API (email, nama, dll)
  // UPGRADE: Enterprise SaaS User Model
  accountTier?: 'free' | 'premium';
  role?: string; // 'talent', 'agency', 'client', 'admin'
  agencyId?: string | null; // Null jika talent bebas, filled jika talent di agency
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
      accountTier: 'free',
      role: 'talent',
      agencyId: null,
      login: (token, userData = null) => set({ 
        token, 
        isAuthenticated: true, 
        user: userData,
        // Extract enterprise fields from userData if available
        accountTier: userData?.account_tier || 'free',
        role: userData?.role || 'talent',
        agencyId: userData?.agency_id || null
      }),
      setUser: (userData) => set((state) => ({ 
        user: userData,
        accountTier: userData?.account_tier || state.accountTier,
        role: userData?.role || state.role,
        agencyId: userData?.agency_id !== undefined ? userData.agency_id : state.agencyId
      })),
      logout: () => set({ 
        token: null, 
        isAuthenticated: false, 
        user: null,
        accountTier: 'free',
        role: 'talent',
        agencyId: null
      }),
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

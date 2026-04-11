import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * AUTH STATE INTERFACE
 * Menyimpan kredensial dan data profil dasar untuk Gatekeeper
 */
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null; 
  accountTier: 'free' | 'premium';
  role: 'talent' | 'agency' | 'client' | 'admin';
  agencyId: string | null;
  
  // Actions
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

      /**
       * FUNGSI LOGIN: Menyimpan JWT dan Data User awal dari Callback SSO
       */
      login: (token, userData = null) => {
        // Mapping data dari Database (027) ke UI agar sinkron
        const firstName = userData?.first_name || '';
        const lastName = userData?.last_name || '';
        const fullName = userData?.full_name || `${firstName} ${lastName}`.trim() || 'Talent User';

        return set({ 
          token, 
          isAuthenticated: true, 
          user: {
            ...userData,
            full_name: fullName // Memastikan Dashboard tidak menampilkan "Pengguna"
          },
          // Map 'user_type' dari DB ke 'role' di UI
          accountTier: userData?.account_tier || 'free',
          role: userData?.role || userData?.user_type || 'talent',
          agencyId: userData?.agency_id || null
        });
      },

      /**
       * FUNGSI SET USER: Update data profil setelah pemanggilan api/v1/talents/me
       */
      setUser: (userData) => set((state) => {
        const firstName = userData?.first_name || state.user?.first_name || '';
        const lastName = userData?.last_name || state.user?.last_name || '';
        const fullName = userData?.full_name || `${firstName} ${lastName}`.trim() || state.user?.full_name;

        return { 
          user: {
            ...state.user,
            ...userData,
            full_name: fullName
          },
          accountTier: userData?.account_tier || state.accountTier,
          role: userData?.role || userData?.user_type || state.role,
          agencyId: userData?.agency_id !== undefined ? userData.agency_id : state.agencyId
        };
      }),

      /**
       * FUNGSI LOGOUT: Membersihkan seluruh state auth
       */
      logout: () => set({ 
        token: null, 
        isAuthenticated: false, 
        user: null,
        accountTier: 'free',
        role: 'talent',
        agencyId: null 
      }),
    }),
    { 
      name: 'orland-auth-storage',
      // Hanya simpan field yang benar-benar dibutuhkan untuk persistensi
      partialize: (state) => ({ 
        token: state.token, 
        isAuthenticated: state.isAuthenticated, 
        user: state.user,
        role: state.role 
      }),
    }
  )
);

/**
 * THEME STATE INTERFACE
 * Mengatur mode gelap/terang secara global
 */
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

/**
 * PROFILE DRAFT STATE
 * Menyimpan sementara data input saat mengisi wizard/editor profil
 */
interface ProfileDraftState { 
  draftData: any; 
  updateDraft: (data: any) => void; 
  clearDraft: () => void; 
}

export const useProfileDraftStore = create<ProfileDraftState>()(
  persist(
    (set) => ({ 
      draftData: null, 
      updateDraft: (data) => set((state) => ({ 
        draftData: { ...state.draftData, ...data } 
      })), 
      clearDraft: () => set({ draftData: null }) 
    }), 
    { name: 'orland-profile-draft' }
  )
);
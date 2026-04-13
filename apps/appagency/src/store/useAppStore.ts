import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CompanyCategory = 'startup' | 'sme' | 'enterprise' | 'agency';

interface AuthUser {
  id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  user_type?: string;
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: string;
  login: (token: string, userData?: AuthUser | null) => void;
  setUser: (userData: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(persist((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  role: 'agency',
  login: (token, userData = null) => {
    const fullName = userData?.full_name || (userData?.first_name && userData?.last_name ? userData.first_name + ' ' + userData.last_name : '').trim() || 'Enterprise User';
    return set({ 
      token, 
      isAuthenticated: true, 
      user: { ...userData, full_name: fullName } as AuthUser,
      role: userData?.role || userData?.user_type || 'agency'
    });
  },
  setUser: (userData) => set((state) => ({
    user: { 
      ...state.user, 
      ...userData, 
      full_name: userData.full_name || (userData.first_name && userData.last_name ? userData.first_name + ' ' + userData.last_name : '').trim() 
    } as AuthUser,
    role: userData.role || userData.user_type || state.role
  })),
  logout: () => set({ token: null, isAuthenticated: false, user: null, role: 'agency' }),
}), { name: 'orland-auth-storage' }));

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(persist((set) => ({
  isDark: true,
  toggleTheme: () => set((state) => {
    if (!state.isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { isDark: !state.isDark };
  }),
}), { name: 'orland-theme-storage' }));
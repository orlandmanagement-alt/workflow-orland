import { create } from 'zustand';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: UserData, userToken: string) => void;
  logout: () => void;
}

// Simulasi Store, di produksi mungkin menggunakan persist middleware
export const useAuthStore = create<AuthState>((set) => ({
  user: { id: 'admin-01', email: 'admin@orland.id', name: 'Master Admin', role: 'admin' }, // MOCK DEFAULT
  token: 'mock-token',
  isAuthenticated: true, 
  login: (userData, userToken) => {
    localStorage.setItem('orland-auth-admin', userToken);
    set({ user: userData, token: userToken, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('orland-auth-admin');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = 'https://sso.orlandmanagement.com?redirect_url=' + window.location.origin;
  }
}));

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark }))
}));

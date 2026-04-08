import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, userToken) => {
        set({ user: userData, token: userToken, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Redirect ke SSO setelah logout
        window.location.href = `https://www.orlandmanagement.com?redirect_url=${encodeURIComponent(window.location.origin)}`;
      },
    }),
    {
      name: 'orland-admin-auth', // key di localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
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
      isDark: true, // Admin default dark mode
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    { name: 'orland-admin-theme' }
  )
);

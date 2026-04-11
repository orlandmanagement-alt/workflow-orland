import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create()(persist((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  role: 'agency',
  login: (token, userData = null) => {
    const fullName = userData?.full_name || (userData?.first_name + ' ' + (userData?.last_name || '')).trim() || 'Enterprise User';
    return set({ 
      token, 
      isAuthenticated: true, 
      user: { ...userData, full_name: fullName },
      role: userData?.role || userData?.user_type || 'agency'
    });
  },
  setUser: (userData) => set((state) => ({
    user: { ...state.user, ...userData, full_name: userData.full_name || (userData.first_name + ' ' + userData.last_name).trim() },
    role: userData.role || userData.user_type || state.role
  })),
  logout: () => set({ token: null, isAuthenticated: false, user: null, role: 'agency' }),
}), { name: 'orland-auth-storage' }));

export const useThemeStore = create()(persist((set) => ({
  isDark: true,
  toggleTheme: () => set((state) => {
    if (!state.isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { isDark: !state.isDark };
  }),
}), { name: 'orland-theme-storage' }));
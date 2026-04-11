import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create()(persist((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  role: 'talent',
  login: (token, userData = null) => {
    const firstName = userData?.first_name || '';
    const lastName = userData?.last_name || '';
    const fullName = userData?.full_name || (firstName + ' ' + lastName).trim() || 'User';
    return set({ 
      token, 
      isAuthenticated: true, 
      user: { ...userData, full_name: fullName },
      role: userData?.role || userData?.user_type || 'talent'
    });
  },
  setUser: (userData) => set((state) => ({
    user: { 
      ...state.user, 
      ...userData, 
      full_name: userData.full_name || (userData.first_name + ' ' + userData.last_name).trim() 
    },
    role: userData.role || userData.user_type || state.role
  })),
  logout: () => set({ token: null, isAuthenticated: false, user: null, role: 'talent' }),
}), { name: 'orland-auth-storage' }));
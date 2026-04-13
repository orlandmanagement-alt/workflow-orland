import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

/** ============ TYPES ============ */
export interface UserPayload {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  user_type?: string;
  [key: string]: unknown;
}

export interface UserState {
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  user_type: string;
}

/** ============ AUTH STORE ============ */
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserState | null;
  role: string;
}

interface AuthActions {
  login: (token: string, userData?: UserPayload | null) => void;
  setUser: (userData: Partial<UserPayload>) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

const authStoreCreator: StateCreator<AuthStore> = (set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  role: 'talent',
  login: (token: string, userData: UserPayload | null = null) => {
    const firstName = userData?.first_name as string || '';
    const lastName = userData?.last_name as string || '';
    const fullName = userData?.full_name as string || (firstName + ' ' + lastName).trim() || 'User';
    return set({
      token,
      isAuthenticated: true,
      user: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        email: userData?.email as string || '',
        role: userData?.role as string || userData?.user_type as string || 'talent',
        user_type: userData?.user_type as string || 'talent',
      },
      role: userData?.role as string || userData?.user_type as string || 'talent',
    });
  },
  setUser: (userData: Partial<UserPayload>) =>
    set((state) => {
      if (!state.user) return {};
      const firstName = userData?.first_name as string || state.user.first_name;
      const lastName = userData?.last_name as string || state.user.last_name;
      const fullName = userData?.full_name as string || (firstName + ' ' + lastName).trim();
      return {
        user: {
          ...state.user,
          ...userData,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          email: userData?.email as string || state.user.email,
          role: userData?.role as string || state.user.role,
          user_type: userData?.user_type as string || state.user.user_type,
        } as UserState,
        role: userData?.role as string || userData?.user_type as string || state.role,
      };
    }),
  logout: () => set({ token: null, isAuthenticated: false, user: null, role: 'talent' }),
});

export const useAuthStore = create<AuthStore>()(
  persist(authStoreCreator, { name: 'orland-auth-storage' })
);
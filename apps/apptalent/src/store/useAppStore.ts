import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'orland-auth' }
  )
)

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => {
        const newTheme = !state.isDark;
        if (newTheme) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDark: newTheme };
      }),
    }),
    { name: 'orland-theme' }
  )
)

interface ProfileDraftState {
  draftData: Record<string, any>;
  updateDraft: (data: Record<string, any>) => void;
  clearDraft: () => void;
}

export const useProfileDraftStore = create<ProfileDraftState>()(
  persist(
    (set) => ({
      draftData: {},
      updateDraft: (data) => set((state) => ({ draftData: { ...state.draftData, ...data } })),
      clearDraft: () => set({ draftData: {} }),
    }),
    { name: 'orland-profile-draft' }
  )
)

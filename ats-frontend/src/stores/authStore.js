import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isAuthenticated: Boolean(accessToken || refreshToken),
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set({ user: { ...(get().user || {}), ...userData } });
      },

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.refreshToken) {
          state?.clearAuth();
        } else {
          state?.setAuth(state.user, null, state.refreshToken);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;

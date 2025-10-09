import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // console.log('=== setAuth DEBUG START ===');
        // console.log('Param user:', user);
        // console.log('Param accessToken:', accessToken);
        // console.log('Param refreshToken:', refreshToken);
        // console.log('Type of accessToken:', typeof accessToken);
        // console.log('AccessToken length:', accessToken?.length);
        
        set({
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isAuthenticated: true,
        });
        
        console.log('State set called');
        
        // Force immediate log to see what was set
        setTimeout(() => {
          const currentState = get();
          // console.log('=== AFTER SET DEBUG ===');
          // console.log('Full state:', currentState);
          // console.log('State.user:', currentState.user);
          // console.log('State.accessToken:', currentState.accessToken);
          // console.log('State.refreshToken:', currentState.refreshToken);
          // console.log('Type of state.accessToken:', typeof currentState.accessToken);
          // console.log('localStorage auth-storage:', localStorage.getItem('auth-storage'));
          // console.log('=== setAuth DEBUG END ===');
        }, 100);
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
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
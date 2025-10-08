import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const safeLocalStorage = {
  getItem: (name) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(name);
    }
    return null;
  },
  setItem: (name, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name);
    }
  },
};

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
          root.setAttribute('data-theme', theme);
        }
      },
      initTheme: () => {
        if (typeof window !== 'undefined') {
          const storedState = useThemeStore.getState();
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(storedState.theme);
          root.setAttribute('data-theme', storedState.theme);
        }
      }
    }),
    {
      name: 'ui-theme',
      storage: createJSONStorage(() => safeLocalStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initTheme();
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
    useThemeStore.getState().initTheme();
}
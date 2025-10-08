import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      openForm: null, // { type: 'purchase' | 'vehicle_invoice', mode: 'new' | 'edit', id?: string }
      setOpenForm: (form) => set({ openForm: form }),
      closeForm: () => set({ openForm: null }),
    }),
    {
      name: 'form-ui-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUIStore;
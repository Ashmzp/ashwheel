import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
  password: '',
  confirmPassword: '',
  newEmail: '',
  productKey: '',
};

const useUserProfileStore = create(
  persist(
    (set) => ({
      ...initialState,
      setField: (field, value) => set({ [field]: value }),
      resetForm: () => set(initialState),
      resetPasswords: () => set({ password: '', confirmPassword: '' }),
    }),
    {
      name: 'user-profile-form-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUserProfileStore;
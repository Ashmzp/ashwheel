import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
  customer_name: '',
  guardian_name: '',
  mobile1: '',
  mobile2: '',
  dob: '',
  address: '',
  state: '',
  district: '',
  pincode: '',
  gst: ''
};

const useCustomerStore = create(
  persist(
    (set) => ({
      ...initialState,
      setFormData: (data) => set((state) => ({ ...state, ...data })),
      resetForm: () => set(initialState),
    }),
    {
      name: 'customer-form-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCustomerStore;
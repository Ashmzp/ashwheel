import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentDate } from '@/utils/dateUtils';

const initialState = {
  foundInvoices: [],
  selectedInvoice: null,
  selectedItems: [],
  returnDate: getCurrentDate(),
  reason: '',
  returnInvoiceNo: '',
  searchQuery: '',
};

const useSalesReturnStore = create(
  persist(
    (set) => ({
      ...initialState,
      setFormData: (data) => set((state) => ({ ...state, ...data })),
      resetForm: () => set(initialState),
    }),
    {
      name: 'sales-return-form-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useSalesReturnStore;
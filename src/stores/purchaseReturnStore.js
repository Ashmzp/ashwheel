import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentDate } from '@/utils/dateUtils';

const initialState = {
  foundPurchases: [],
  selectedPurchase: null,
  selectedItems: [],
  returnDate: getCurrentDate(),
  reason: '',
  returnInvoiceNo: '',
  searchQuery: '',
};

const usePurchaseReturnStore = create(
  persist(
    (set) => ({
      ...initialState,
      setFormData: (data) => set((state) => ({ ...state, ...data })),
      resetForm: () => set(initialState),
    }),
    {
      name: 'purchase-return-form-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default usePurchaseReturnStore;
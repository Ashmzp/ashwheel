import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';

const useReceiptStore = create(
  persist(
    (set) => ({
      // State
      activeTab: 'list',
      page: 1,
      searchTerm: '',
      selectedReceiptId: null,
      isEditing: false,
      formData: {
        receipt_date: format(new Date(), 'yyyy-MM-dd'),
        payment_mode: 'Cash',
      },

      // Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setPage: (page) => set({ page }),
      setSearchTerm: (term) => set({ searchTerm: term, page: 1 }),
      setSelectedReceiptId: (id) => set({ selectedReceiptId: id }),
      setIsEditing: (editing) => set({ isEditing: editing }),
      
      setFormData: (data) => set(state => ({ formData: { ...state.formData, ...data } })),
      
      resetForm: () => set({ 
        formData: {
          receipt_date: format(new Date(), 'yyyy-MM-dd'),
          payment_mode: 'Cash',
        },
        isEditing: false,
        selectedReceiptId: null,
      }),
    }),
    {
      name: 'receipt-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive, UI-related state if needed
      }),
    }
  )
);

export default useReceiptStore;
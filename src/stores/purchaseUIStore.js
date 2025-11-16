import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentMonthDateRange } from '@/utils/dateUtils';

const usePurchaseUIStore = create(
  persist(
    (set) => ({
      searchTerm: '',
      dateRange: getCurrentMonthDateRange(),
      currentPage: 1,
      
      setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
      setDateRange: (range) => set({ dateRange: range, currentPage: 1 }),
      setCurrentPage: (page) => set({ currentPage: page }),
      
      resetFilters: () => set({ 
        searchTerm: '', 
        dateRange: getCurrentMonthDateRange(),
        currentPage: 1 
      }),
    }),
    {
      name: 'purchase-list-ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default usePurchaseUIStore;

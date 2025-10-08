import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentDate } from '@/utils/dateUtils';
import { startOfMonth, endOfMonth } from 'date-fns';

const useVehicleInvoiceStore = create(
  persist(
    (set) => ({
      searchTerm: '',
      dateRange: {
        start: startOfMonth(new Date()).toISOString().split('T')[0],
        end: endOfMonth(new Date()).toISOString().split('T')[0],
      },
      pagination: {
        currentPage: 1,
      },
      setSearchTerm: (term) => set({ searchTerm: term }),
      setDateRange: (range) => set({ dateRange: range }),
      setPagination: (pagination) => set(state => ({ pagination: { ...state.pagination, ...pagination } })),
    }),
    {
      name: 'vehicle-invoice-list-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useVehicleInvoiceStore;
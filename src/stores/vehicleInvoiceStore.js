import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentDate } from '@/utils/dateUtils';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const useVehicleInvoiceStore = create(
  persist(
    (set) => ({
      searchTerm: '',
      dateRange: {
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      },
      pagination: {
        currentPage: 1,
      },
      setSearchTerm: (term) => set({ searchTerm: term }),
      setDateRange: (range) => set({ dateRange: range }),
      setPagination: (pagination) => set(state => ({ pagination: { ...state.pagination, ...pagination } })),
    }),
    {
      name: 'vehicle-invoice-list-storage-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useVehicleInvoiceStore;
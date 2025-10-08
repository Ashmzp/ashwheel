import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { startOfMonth, endOfMonth } from 'date-fns';

const initialDateRange = {
  startDate: startOfMonth(new Date()).toISOString(),
  endDate: endOfMonth(new Date()).toISOString(),
};

const useReportStore = create(
  persist(
    (set, get) => ({
      activeMainTab: 'stock',
      misReport: {
        dateRange: initialDateRange,
        partyNames: [],
      },
      partyWiseSaleReport: {
        searchTerm: '',
        reportType: 'summary',
        dateRange: initialDateRange,
        customerType: 'All',
      },
      trackVehicle: {
        searchTerm: '',
      },
      trackJobCard: {
        searchTerm: '',
      },
      setActiveMainTab: (tab) => set({ activeMainTab: tab }),
      setMisReportState: (newState) => set((state) => ({ misReport: { ...state.misReport, ...newState } })),
      setPartyWiseSaleReportState: (newState) => set((state) => ({ partyWiseSaleReport: { ...state.partyWiseSaleReport, ...newState } })),
      setTrackVehicleState: (newState) => set((state) => ({ trackVehicle: { ...state.trackVehicle, ...newState } })),
      setTrackJobCardState: (newState) => set((state) => ({ trackJobCard: { ...state.trackJobCard, ...newState } })),
      resetMisReport: () => set({ misReport: { dateRange: initialDateRange, partyNames: [] } }),
      resetPartyWiseSaleReport: () => set({ partyWiseSaleReport: { searchTerm: '', reportType: 'summary', dateRange: initialDateRange, customerType: 'All' } }),
      resetTrackVehicle: () => set({ trackVehicle: { searchTerm: '' } }),
      resetTrackJobCard: () => set({ trackJobCard: { searchTerm: '' } }),
    }),
    {
      name: 'report-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useReportStore;
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentMonthDateRange } from '@/utils/dateUtils';

const initialColumns = [
  { id: 'booking_date', label: 'Booking Date' },
  { id: 'receipt_no', label: 'Receipt No.' },
  { id: 'customer_name', label: 'Customer Name' },
  { id: 'mobile_no', label: 'Mobile No.' },
  { id: 'model_name', label: 'Model Name' },
  { id: 'colour', label: 'Colour' },
  { id: 'booking_amount', label: 'Booking Amount' },
  { id: 'payment_mode', label: 'Payment Mode' },
  { id: 'delivery_date', label: 'Expected Delivery Date' },
  { id: 'status', label: 'Status' },
  { id: 'remark', label: 'Remark' },
];

const useBookingStore = create(
  persist(
    (set, get) => ({
      // State
      activeTab: 'list',
      page: 1,
      searchTerm: '',
      dateRange: getCurrentMonthDateRange(),
      selectedBookingId: null,
      isEditing: false,
      formData: {},
      customFields: [],
      allColumns: initialColumns,
      visibleColumns: initialColumns.map(c => c.id),

      // Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setPage: (page) => set({ page }),
      setSearchTerm: (term) => set({ searchTerm: term, page: 1 }),
      setDateRange: (range) => set({ dateRange: range, page: 1 }),
      setSelectedBookingId: (id) => set({ selectedBookingId: id }),
      setIsEditing: (editing) => set({ isEditing: editing }),
      
      setFormData: (data) => set(state => ({ formData: { ...state.formData, ...data } })),
      resetForm: () => set({ formData: {} }),
      
      setCustomFields: (fields) => {
        const newColumns = [...initialColumns];
        
        fields.forEach(field => {
          const colId = `custom_${field.name}`;
          if (!newColumns.some(c => c.id === colId)) {
            newColumns.push({ id: colId, label: field.label });
          }
        });
        set({ customFields: fields, allColumns: newColumns });
      },

      toggleColumn: (columnId) => set(state => {
        const visibleColumns = state.visibleColumns.includes(columnId)
          ? state.visibleColumns.filter(id => id !== columnId)
          : [...state.visibleColumns, columnId];
        return { visibleColumns };
      }),

      resetBookingState: () => set({
        selectedBookingId: null,
        isEditing: false,
        formData: {},
      }),
    }),
    {
      name: 'booking-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        visibleColumns: state.visibleColumns,
        // Do not persist allColumns to allow dynamic updates from settings
      }),
    }
  )
);

export default useBookingStore;
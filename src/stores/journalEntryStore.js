import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';

const useJournalEntryStore = create(
  persist(
    (set, get) => ({
      // State
      activeTab: 'list',
      page: 1,
      searchTerm: '',
      selectedEntryId: null,
      isEditing: false,
      formData: {
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        entry_type: 'Debit',
      },

      // Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setPage: (page) => set({ page }),
      setSearchTerm: (term) => set({ searchTerm: term, page: 1 }),
      setSelectedEntryId: (id) => set({ selectedEntryId: id }),
      setIsEditing: (editing) => set({ isEditing: editing }),
      
      setFormData: (data) => set(state => ({ formData: { ...state.formData, ...data } })),
      
      resetForm: () => set({ 
        formData: {
          entry_date: format(new Date(), 'yyyy-MM-dd'),
          entry_type: 'Debit',
        },
        isEditing: false,
        selectedEntryId: null,
      }),
    }),
    {
      name: 'journal-entry-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive, UI-related state if needed
      }),
    }
  )
);

export default useJournalEntryStore;
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentDate } from '@/utils/dateUtils';

const createInitialState = (data = {}) => ({
  id: null,
  created_at: null,
  invoiceDate: getCurrentDate(),
  invoiceNo: '',
  partyName: '',
  items: [],
  serial_no: 0,
  initializedFor: null, // 'new' | <id> | null
  ...data,
});

const usePurchaseStore = create(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // basic setters
      setFormData: (data) => set((state) => ({ ...state, ...data })),
      setItems: (items) => set({ items }),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      updateItem: (id, updatedFields) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updatedFields } : item
          ),
        })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      // initialize the form for either 'new' or editing an existing purchase
      initialize: (mode, data = null) => {
        const state = get();
        const target = mode === 'edit' && data?.id ? data.id : (mode === 'new' ? 'new' : null);
        if (state.initializedFor === target) {
          // already initialized for same mode/id -> no-op
          return;
        }

        if (mode === 'edit' && data) {
          set({
            ...createInitialState({
              id: data.id,
              created_at: data.created_at ?? null,
              invoiceDate: data.invoice_date ?? getCurrentDate(),
              invoiceNo: data.invoice_no ?? '',
              partyName: data.party_name ?? '',
              items: data.items ?? [],
              serial_no: data.serial_no ?? 0,
            }),
            initializedFor: data.id,
          });
        } else {
          // new
          set({
            ...createInitialState(),
            initializedFor: 'new',
          });
        }
      },

      // fully reset form and clear initializedFor
      clear: () => set({ ...createInitialState(), initializedFor: null }),
    }),
    {
      name: 'purchase-form', // single stable storage key
      storage: createJSONStorage(() => localStorage),
      // persist only data fields
      partialize: (state) =>
        ({
          id: state.id,
          created_at: state.created_at,
          invoiceDate: state.invoiceDate,
          invoiceNo: state.invoiceNo,
          partyName: state.partyName,
          items: state.items,
          serial_no: state.serial_no,
          initializedFor: state.initializedFor,
        }),
    }
  )
);

const initializePurchaseStore = (isEditing, data) => {
  const mode = isEditing ? 'edit' : 'new';
  usePurchaseStore.getState().initialize(mode, data);
};

const clearPurchaseStore = () => {
  // clear persisted storage and reset store
  try {
    localStorage.removeItem('purchase-form');
  } catch (e) {
    console.warn('Unable to remove purchase-form from localStorage', e);
  }
  usePurchaseStore.getState().clear();
};

export default usePurchaseStore;
export { initializePurchaseStore, clearPurchaseStore };
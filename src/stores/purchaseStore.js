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
  ...data,
});

const usePurchaseStore = create(
  persist(
    (set, get) => ({
      ...createInitialState(),
      setFormData: (data) => set((state) => ({ ...state, ...data })),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      updateItem: (id, field, value) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
          ),
        })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setItems: (items) => set({ items }),
      resetForm: (initialState) => set(createInitialState(initialState)),
    }),
    {
      name: 'form-purchase-placeholder', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => typeof state[key] !== 'function')
        ),
    }
  )
);

export const initializePurchaseStore = (isEditing, data) => {
  if (isEditing && !data) {
    console.warn("initializePurchaseStore called in edit mode without data.");
    return;
  }
  const uniqueKey = isEditing ? `form-edit-purchase-${data.id}` : 'form-new-purchase';
  usePurchaseStore.persist.setOptions({ name: uniqueKey });

  // Use a timeout to allow the store to rehydrate from localStorage first
  setTimeout(() => {
    const storedState = usePurchaseStore.getState();
    
    // Determine if the form needs a fresh start
    const needsReset = 
      (isEditing && storedState.id !== data.id) || // Editing a different item
      (!isEditing && storedState.id) || // Was editing, now creating new
      (data && !storedState.id); // Was new, now editing

    if (needsReset) {
      const initialState = isEditing ? {
          ...data,
          invoiceDate: data.invoice_date,
          invoiceNo: data.invoice_no,
          partyName: data.party_name,
      } : {};
      usePurchaseStore.getState().resetForm(initialState);
    }
  }, 0);
};

export const clearPurchaseStore = (isEditing, id) => {
    const uniqueKey = isEditing ? `form-edit-purchase-${id}` : 'form-new-purchase';
    localStorage.removeItem(uniqueKey);
    usePurchaseStore.getState().resetForm();
    usePurchaseStore.persist.setOptions({ name: 'form-purchase-placeholder' });
};

export default usePurchaseStore;
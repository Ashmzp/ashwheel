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
      resetForm: (initialData = {}) => {
        set(createInitialState(initialData));
      },
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

const initializePurchaseStore = (isEditing, data) => {
  const uniqueKey = isEditing ? `form-edit-purchase-${data.id}` : 'form-new-purchase';
  const currentKey = usePurchaseStore.persist.getOptions().name;

  if (currentKey !== uniqueKey) {
    usePurchaseStore.persist.rehydrate();
    usePurchaseStore.persist.setOptions({ name: uniqueKey });
    
    usePurchaseStore.persist.rehydrate().then(() => {
        const storedState = usePurchaseStore.getState();
        if (isEditing) {
            if (storedState.id !== data.id) {
                const initialState = {
                    ...data,
                    invoiceDate: data.invoice_date,
                    invoiceNo: data.invoice_no,
                    partyName: data.party_name,
                };
                usePurchaseStore.getState().resetForm(initialState);
            }
        } else {
            if (storedState.id) {
                usePurchaseStore.getState().resetForm();
            }
        }
    });
  }
};


const clearPurchaseStore = (isEditing, id) => {
    const uniqueKey = isEditing ? `form-edit-purchase-${id}` : 'form-new-purchase';
    localStorage.removeItem(uniqueKey);
    usePurchaseStore.getState().resetForm();
    usePurchaseStore.persist.setOptions({ name: 'form-purchase-placeholder' });
};

export { usePurchaseStore as default, initializePurchaseStore, clearPurchaseStore };
import { create } from 'zustand';
import { getCurrentDate } from '@/utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';

const getInitialState = () => ({
    id: null,
    serialNo: 1,
    invoiceDate: getCurrentDate(),
    invoiceNo: '',
    partyName: '',
    items: [],
});

const useWorkshopPurchaseStore = create(
    (set, get) => ({
      ...getInitialState(),
      setFormData: (data) => set((state) => ({ ...state, ...data })),
      addItem: (item) => set((state) => ({
        items: [...state.items, { id: uuidv4(), partNo: '', partName: '', hsn: '', purchaseRate: 0, qty: 1, uom: '', saleRate: 0, gst: 0, category: '', ...item }],
      })),
      updateItem: (id, field, value) => set((state) => ({
        items: state.items.map(item => item.id === id ? { ...item, [field]: value } : item)
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      setItems: (items) => set({ items: items.map(item => ({...item, id: item.id || uuidv4()})) }),
      resetForm: (initialData = null) => {
        const newState = initialData ? { ...getInitialState(), ...initialData } : getInitialState();
        if (newState.items) {
          newState.items = newState.items.map(item => ({ ...item, id: item.id || uuidv4() }));
        }
        set(newState);
      },
    })
);

export default useWorkshopPurchaseStore;
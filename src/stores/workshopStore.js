import { create } from 'zustand';
import { getCurrentDate, addDaysToDate } from '@/utils/dateUtils';

const getInitialState = () => ({
  activeTab: 'list',
  selectedJobCardId: null,
  invoice_no: '',
  invoice_date: getCurrentDate(),
  customer_id: null,
  customer_name: '',
  customer_mobile: '',
  customer_address: '',
  customer_state: '',
  manual_jc_no: '',
  jc_no: '',
  kms: '',
  reg_no: '',
  frame_no: '',
  model: '',
  job_type: 'Paid Service',
  mechanic: '',
  next_due_date: addDaysToDate(new Date(), 90),
  parts_items: [],
  labour_items: [],
  denied_items: [],
  total_amount: 0,
});

const useWorkshopStore = create((set) => ({
  ...getInitialState(),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedJobCardId: (id) => set({ selectedJobCardId: id }),
  setFormData: (data) => set((state) => ({ ...state, ...data })),
  resetForm: (initialData = {}) => set((state) => ({ ...getInitialState(), ...initialData, activeTab: state.activeTab, selectedJobCardId: state.selectedJobCardId })),
  setItems: (type, items) => set({ [`${type}_items`]: items }),
  addItem: (type, item) => set((state) => ({ [`${type}_items`]: [...state[`${type}_items`], { uom: '', ...item }] })),
  removeItem: (type, id) => set((state) => ({ [`${type}_items`]: state[`${type}_items`].filter(i => i.id !== id) })),
  updateItem: (type, id, field, value) => set((state) => ({
      [`${type}_items`]: state[`${type}_items`].map(item =>
          item.id === id ? { ...item, [field]: value } : item
      ),
  })),
}));

export default useWorkshopStore;
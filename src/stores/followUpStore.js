import { create } from 'zustand';

const initialState = {
  remark: '',
  lastServiceDate: '',
  nextFollowUpDate: '',
  appointmentDateTime: '',
  followedBy: '',
};

const useFollowUpStore = create((set) => ({
  formData: initialState,
  setFormField: (field, value) => set(state => ({
    formData: { ...state.formData, [field]: value }
  })),
  resetForm: () => set({ formData: initialState }),
}));

export default useFollowUpStore;
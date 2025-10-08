import { useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import debounce from 'debounce';

const useFormPersistence = (
  store,
  isEditing,
  id,
  entityName,
  initialData,
  isFormVisible
) => {
  const { toast } = useToast();

  const getStorageKey = useCallback(() => {
    const key = isEditing ? `edit_${entityName}_${id}` : `new_${entityName}`;
    return key;
  }, [isEditing, id, entityName]);

  const saveState = useCallback((state) => {
    const storageKey = getStorageKey();
    try {
      const hasMeaningfulData = 
        (state.items && state.items.length > 0) || 
        (state.parts_items && state.parts_items.length > 0) || 
        (state.labour_items && state.labour_items.length > 0) ||
        Object.values(state).some(v => typeof v === 'string' && v.trim() !== '');

      if (hasMeaningfulData) {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    } catch (e) {
      console.error(`Could not save state for ${storageKey}`, e);
    }
  }, [getStorageKey]);

  const debouncedSaveState = useCallback(debounce(saveState, 500), [saveState]);

  const loadState = useCallback(() => {
    const storageKey = getStorageKey();
    try {
      const savedStateJSON = localStorage.getItem(storageKey);
      
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        store.getState().resetForm(savedState);
        
        const hasRestoredData = 
            (savedState.items && savedState.items.length > 0) || 
            (savedState.parts_items && savedState.parts_items.length > 0) || 
            (savedState.labour_items && savedState.labour_items.length > 0) || 
            savedState.partyName || 
            savedState.customer_name;
            
        if (hasRestoredData) {
          toast({
            title: "Draft Restored",
            description: "Your previously unsaved changes have been restored.",
          });
        }
      } else if (isEditing && initialData) {
        store.getState().resetForm(initialData);
      } else {
        store.getState().resetForm();
      }
    } catch (e) {
      console.error(`Could not load state for ${storageKey}`, e);
      if (isEditing && initialData) {
        store.getState().resetForm(initialData);
      } else {
        store.getState().resetForm();
      }
    }
  }, [store, getStorageKey, isEditing, initialData, toast]);

  const clearState = useCallback(() => {
    const storageKey = getStorageKey();
    try {
      localStorage.removeItem(storageKey);
      store.getState().resetForm();
    } catch (e) {
      console.error(`Could not clear state for ${storageKey}`, e);
    }
  }, [store, getStorageKey]);

  useEffect(() => {
    if (isFormVisible) {
      loadState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormVisible, isEditing, id]);

  useEffect(() => {
    if(isFormVisible && isEditing && initialData) {
      const storageKey = getStorageKey();
      const savedStateJSON = localStorage.getItem(storageKey);
      if (!savedStateJSON) {
        store.getState().resetForm(initialData);
      }
    }
  }, [isFormVisible, isEditing, initialData, store, getStorageKey]);

  useEffect(() => {
    if (!isFormVisible) return;

    const unsubscribe = store.subscribe(debouncedSaveState);

    return () => {
      unsubscribe();
      debouncedSaveState.flush();
    };
  }, [isFormVisible, store, debouncedSaveState]);

  return { clearState };
};

export default useFormPersistence;
import { useEffect, useCallback } from 'react';
import debounce from 'debounce';

export const useAutosave = (store, formId) => {
  const saveState = useCallback(() => {
    const state = store.getState();
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(formId, serializedState);
    } catch (e) {
      console.error("Could not save state for " + formId, e);
    }
  }, [store, formId]);

  const debouncedSave = useCallback(debounce(saveState, 500), [saveState]);

  useEffect(() => {
    const unsubscribe = store.subscribe(
      (currentState, previousState) => {
        if (JSON.stringify(currentState) !== JSON.stringify(previousState)) {
          debouncedSave();
        }
      }
    );
    
    // Load state from localStorage on mount
    try {
      const savedState = localStorage.getItem(formId);
      if (savedState) {
        const stateToLoad = JSON.parse(savedState);
        // We need to be careful here not to overwrite functions, only data.
        // Zustand's persist middleware handles this better, but this is a manual approach.
        // A simple data merge:
        const currentFns = Object.entries(store.getState()).reduce((acc, [key, value]) => {
          if (typeof value === 'function') {
            acc[key] = value;
          }
          return acc;
        }, {});
        store.setState({ ...stateToLoad, ...currentFns });
      }
    } catch (e) {
      console.error("Could not load state for " + formId, e);
    }


    return () => {
      unsubscribe();
      debouncedSave.clear();
    };
  }, [store, formId, debouncedSave]);

  return null;
};
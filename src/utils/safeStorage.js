/**
 * Safe Storage Utilities (localStorage/sessionStorage)
 * Fixes HIGH severity issues related to storage operations
 */

// Safe localStorage operations
export const safeLocalStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  has: (key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking localStorage (${key}):`, error);
      return false;
    }
  },
};

// Safe sessionStorage operations
export const safeSessionStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from sessionStorage (${key}):`, error);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to sessionStorage (${key}):`, error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from sessionStorage (${key}):`, error);
      return false;
    }
  },

  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  },

  has: (key) => {
    try {
      return sessionStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking sessionStorage (${key}):`, error);
      return false;
    }
  },
};

// Check if storage is available
export const isStorageAvailable = (type = 'localStorage') => {
  try {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Get storage size (approximate)
export const getStorageSize = (type = 'localStorage') => {
  try {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    let total = 0;
    for (const key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    return total;
  } catch {
    return 0;
  }
};

// Clear expired items (requires items to have expiry timestamp)
export const clearExpiredItems = (type = 'localStorage') => {
  try {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    const now = Date.now();
    const keysToRemove = [];

    for (const key in storage) {
      if (storage.hasOwnProperty(key)) {
        try {
          const item = JSON.parse(storage[key]);
          if (item.expiry && item.expiry < now) {
            keysToRemove.push(key);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));
    return keysToRemove.length;
  } catch (error) {
    console.error('Error clearing expired items:', error);
    return 0;
  }
};

export default {
  local: safeLocalStorage,
  session: safeSessionStorage,
  isStorageAvailable,
  getStorageSize,
  clearExpiredItems,
};

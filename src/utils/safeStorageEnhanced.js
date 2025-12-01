/**
 * Enhanced Safe Storage with Quota Management
 * Prevents app crashes from localStorage quota exceeded errors
 */

/**
 * Safely set item in localStorage with quota management
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {boolean} - Success status
 */
export const setItemSafe = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old data...');
      
      // Get all keys sorted by timestamp (if available)
      const keys = Object.keys(localStorage);
      
      if (keys.length > 0) {
        // Remove oldest item (first key)
        const oldestKey = keys[0];
        console.log(`Removing oldest item: ${oldestKey}`);
        localStorage.removeItem(oldestKey);
        
        // Retry setting the item
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('Failed to set item after clearing space:', retryError);
          return false;
        }
      }
    }
    
    console.error('localStorage error:', e);
    return false;
  }
};

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} - Stored value or default
 */
export const getItemSafe = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (e) {
    console.error('localStorage get error:', e);
    return defaultValue;
  }
};

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} - Success status
 */
export const removeItemSafe = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('localStorage remove error:', e);
    return false;
  }
};

/**
 * Get localStorage usage info
 * @returns {object} - Usage statistics
 */
export const getStorageInfo = () => {
  try {
    let totalSize = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      totalSize += key.length + (value?.length || 0);
    });
    
    // Most browsers allow ~5-10MB
    const maxSize = 5 * 1024 * 1024; // 5MB estimate
    const usagePercent = (totalSize / maxSize) * 100;
    
    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      itemCount: keys.length,
      usagePercent: usagePercent.toFixed(2),
      isNearLimit: usagePercent > 80
    };
  } catch (e) {
    console.error('Error getting storage info:', e);
    return null;
  }
};

/**
 * Clear old items based on timestamp
 * @param {number} daysOld - Remove items older than this many days
 */
export const clearOldItems = (daysOld = 7) => {
  try {
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        const data = JSON.parse(value);
        
        if (data.timestamp && (now - data.timestamp) > maxAge) {
          console.log(`Removing old item: ${key}`);
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Skip items that aren't JSON or don't have timestamp
      }
    });
  } catch (e) {
    console.error('Error clearing old items:', e);
  }
};

export default {
  setItemSafe,
  getItemSafe,
  removeItemSafe,
  getStorageInfo,
  clearOldItems
};

/**
 * Comprehensive Error Handling Utilities
 * Fixes HIGH severity issues related to error handling
 */

// Wrap async functions with error handling
export const withErrorHandling = (fn, context = 'Operation') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      throw error;
    }
  };
};

// Safe async operation with fallback
export const safeAsync = async (fn, fallback = null, context = 'Operation') => {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    return fallback;
  }
};

// Validate required fields
export const validateRequired = (fields, data) => {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || data[field] === '') {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  return true;
};

// Safe number parsing
export const safeParseInt = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeParseFloat = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Safe array access
export const safeArrayAccess = (array, index, defaultValue = null) => {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index];
};

// Safe object access
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    return result === undefined ? defaultValue : result;
  } catch {
    return defaultValue;
  }
};

// Retry logic for failed operations
export const retryOperation = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Safe JSON parse
export const safeJSONParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// Safe JSON stringify
export const safeJSONStringify = (obj, defaultValue = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
};

// Check if value is empty
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Clamp number between min and max
export const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

// Format error message for user display
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

// Check if error is network related
export const isNetworkError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('network') || 
         message.includes('fetch') || 
         message.includes('timeout') ||
         message.includes('connection');
};

// Check if error is authentication related
export const isAuthError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || error?.status;
  return code === 401 || 
         code === 403 || 
         message.includes('auth') || 
         message.includes('unauthorized') ||
         message.includes('forbidden');
};

export default {
  withErrorHandling,
  safeAsync,
  validateRequired,
  safeParseInt,
  safeParseFloat,
  safeArrayAccess,
  safeGet,
  retryOperation,
  debounce,
  throttle,
  safeJSONParse,
  safeJSONStringify,
  isEmpty,
  clamp,
  formatErrorMessage,
  isNetworkError,
  isAuthError,
};

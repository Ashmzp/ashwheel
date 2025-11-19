/**
 * Critical Security: Safe Error Handling
 * Prevents sensitive data exposure in errors
 */

export const safeErrorMessage = (error) => {
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred. Please try again.';
  }
  return error?.message || 'Unknown error';
};

export const logError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: error?.message,
      context,
      timestamp: new Date().toISOString()
    });
  }
};

export const handleAsyncError = async (asyncFn, fallbackValue = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    logError(error, { function: asyncFn.name });
    return fallbackValue;
  }
};

export const withErrorBoundary = (fn, onError) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name, args });
      if (onError) onError(error);
      throw new Error(safeErrorMessage(error));
    }
  };
};
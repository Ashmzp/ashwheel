import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Safe async operation hook with loading, error, and cancellation support
 * Fixes HIGH severity issues related to async operations and memory leaks
 */
export const useSafeAsync = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (asyncFunction, onSuccess, onError) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      
      if (isMountedRef.current) {
        setLoading(false);
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
        if (onError) {
          onError(err);
        }
      }
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(false);
      setError(null);
    }
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
    isMounted: isMountedRef.current,
  };
};

export default useSafeAsync;

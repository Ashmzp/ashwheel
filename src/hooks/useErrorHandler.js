import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook for consistent error handling across components
 * Fixes HIGH severity issues related to error handling
 */
export const useErrorHandler = () => {
  const { toast } = useToast();
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleError = useCallback((error, context = 'Operation', showToast = true) => {
    console.error(`Error in ${context}:`, error);
    
    const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
    
    setError(errorMessage);
    setIsError(true);
    
    if (showToast) {
      toast({
        variant: 'destructive',
        title: `${context} Failed`,
        description: errorMessage,
      });
    }
    
    return errorMessage;
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  const withErrorHandling = useCallback(async (fn, context = 'Operation', showToast = true) => {
    clearError();
    try {
      return await fn();
    } catch (error) {
      handleError(error, context, showToast);
      throw error;
    }
  }, [handleError, clearError]);

  return {
    error,
    isError,
    handleError,
    clearError,
    withErrorHandling,
  };
};

export default useErrorHandler;

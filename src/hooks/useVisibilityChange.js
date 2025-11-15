import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Hook is available but not used by default to prevent auto-refresh
export const useVisibilityChange = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only invalidate queries that are older than 10 minutes
        // This prevents unnecessary refetches on tab switching
        queryClient.invalidateQueries({
          predicate: (query) => {
            const lastUpdated = query.state.dataUpdatedAt;
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
            return lastUpdated < tenMinutesAgo;
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);
};
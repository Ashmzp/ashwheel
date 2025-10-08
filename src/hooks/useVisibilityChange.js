import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useVisibilityChange = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // This invalidates all queries, forcing a refetch of stale data
        // when the tab becomes visible again. This helps keep data fresh
        // without constant background polling.
        queryClient.invalidateQueries();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);
};
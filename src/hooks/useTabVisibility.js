import { useState, useEffect } from 'react';

/**
 * Hook to track tab visibility without causing auto-refresh
 * Only tracks visibility state, doesn't trigger any queries
 */
export const useTabVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [lastVisibleTime, setLastVisibleTime] = useState(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible) {
        setLastVisibleTime(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { 
    isVisible, 
    lastVisibleTime,
    wasHiddenFor: (minutes) => {
      return Date.now() - lastVisibleTime > minutes * 60 * 1000;
    }
  };
};
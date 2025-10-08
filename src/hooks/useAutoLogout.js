import { useEffect, useCallback, useRef } from 'react';

const useAutoLogout = (user, signOut) => {
  const inactivityTime = 15 * 60 * 1000; // 15 minutes
  const timeoutId = useRef(null);

  const logoutUser = useCallback(() => {
    if (user) {
      signOut(true); // Pass true for auto-logout
    }
  }, [user, signOut]);

  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(logoutUser, inactivityTime);
  }, [logoutUser, inactivityTime]);

  useEffect(() => {
    if (user) {
      const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
      resetTimer(); // Initial timer start

      return () => {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
        events.forEach(event => window.removeEventListener(event, resetTimer));
      };
    }
  }, [user, resetTimer]);
};

export default useAutoLogout;
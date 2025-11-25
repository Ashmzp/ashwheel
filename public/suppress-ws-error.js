// Suppress WebSocket connection errors in console
(function() {
  const originalError = console.error;
  console.error = function(...args) {
    const msg = args[0]?.toString() || '';
    if (msg.includes('WebSocket') || msg.includes('[vite]')) {
      return;
    }
    originalError.apply(console, args);
  };
})();

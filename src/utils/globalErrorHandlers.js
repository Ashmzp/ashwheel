/**
 * Global Error Handlers
 * Prevents app crashes from unhandled errors and promise rejections
 */

export const initGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent default browser behavior
    event.preventDefault();
    
    // You can add error tracking service here (e.g., Sentry)
    // trackError('unhandled_rejection', event.reason);
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // Prevent default browser behavior for non-critical errors
    // event.preventDefault();
  });

  console.log('✅ Global error handlers initialized');
};

export default initGlobalErrorHandlers;

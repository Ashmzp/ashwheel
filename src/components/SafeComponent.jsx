import React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * HOC to wrap components with error boundary and safe rendering
 * Fixes HIGH severity issues related to component crashes
 */
export const withSafeComponent = (Component, fallback = null) => {
  return function SafeComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

/**
 * Safe component wrapper with loading and error states
 */
export const SafeComponentWrapper = ({ 
  loading, 
  error, 
  children, 
  loadingComponent = <div>Loading...</div>,
  errorComponent = null 
}) => {
  if (loading) {
    return loadingComponent;
  }

  if (error) {
    return errorComponent || (
      <div className="p-4 text-center text-destructive">
        <p>Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error.message || 'Unknown error'}</p>
      </div>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default SafeComponentWrapper;

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Error recovery UI component
 * Fixes HIGH severity issue #38
 */
const ErrorRecovery = ({ 
  error, 
  onRetry, 
  onReset,
  title = 'Something went wrong',
  showDetails = false 
}) => {
  if (!error) return null;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p>{error.message || 'An unexpected error occurred'}</p>
          
          {showDetails && error.stack && (
            <details className="text-xs">
              <summary className="cursor-pointer">Technical Details</summary>
              <pre className="mt-2 p-2 bg-secondary rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            )}
            
            {onReset && (
              <Button 
                onClick={onReset} 
                variant="outline" 
                size="sm"
              >
                Reset
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorRecovery;

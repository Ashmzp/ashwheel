import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Offline indicator component
 * Fixes HIGH severity issue #32
 */
const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline ? (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You are offline. Some features may not work.
          </AlertDescription>
        </Alert>
      ) : wasOffline ? (
        <Alert className="shadow-lg bg-green-50 border-green-200">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Back online! Syncing data...
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;

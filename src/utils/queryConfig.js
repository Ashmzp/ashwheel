// Default query configuration to prevent unnecessary refetches
export const DEFAULT_QUERY_CONFIG = {
  staleTime: Infinity, // Never consider data stale
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchIntervalInBackground: false,
  retry: 0,
  networkMode: 'online',
};

// Settings query config (longer cache)
export const SETTINGS_QUERY_CONFIG = {
  staleTime: Infinity, // Never consider data stale
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchIntervalInBackground: false,
  retry: 0,
  networkMode: 'online',
};

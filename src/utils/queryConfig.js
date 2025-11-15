// Default query configuration to prevent unnecessary refetches
export const DEFAULT_QUERY_CONFIG = {
  staleTime: 1000 * 60 * 30, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  retry: 1,
  networkMode: 'online',
};

// Settings query config (longer cache)
export const SETTINGS_QUERY_CONFIG = {
  staleTime: 1000 * 60 * 60, // 1 hour
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  retry: 1,
  networkMode: 'online',
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/utils/db';

// Query Keys - Centralized cache keys
export const QUERY_KEYS = {
  CUSTOMERS: 'customers',
  INVOICES: 'invoices',
  PURCHASES: 'purchases',
  VEHICLE_INVOICES: 'vehicleInvoices',
  STOCK: 'stock',
  SALES_RETURNS: 'salesReturns',
  PURCHASE_RETURNS: 'purchaseReturns',
  JOURNAL_ENTRIES: 'journalEntries',
  RECEIPTS: 'receipts',
  SETTINGS: 'settings',
  PRICE_LIST: 'priceList',
  JOB_CARDS: 'jobCards',
  FOLLOW_UPS: 'followUps',
  WORKSHOP_PURCHASES: 'workshopPurchases',
  WORKSHOP_INVENTORY: 'workshopInventory',
};

// Customers Hook
export const useCustomers = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CUSTOMERS, options],
    queryFn: () => db.getCustomers(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Invoices Hook
export const useInvoices = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, options],
    queryFn: () => db.getInvoices(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Purchases Hook
export const usePurchases = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PURCHASES, options],
    queryFn: () => db.getPurchases(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Vehicle Invoices Hook
export const useVehicleInvoices = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.VEHICLE_INVOICES, options],
    queryFn: () => db.getVehicleInvoices(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Stock Hook
export const useStock = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.STOCK, options],
    queryFn: () => db.getStock(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Sales Returns Hook
export const useSalesReturns = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SALES_RETURNS, options],
    queryFn: () => db.getSalesReturns(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Purchase Returns Hook
export const usePurchaseReturns = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PURCHASE_RETURNS, options],
    queryFn: () => db.getPurchaseReturns(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Journal Entries Hook
export const useJournalEntries = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.JOURNAL_ENTRIES, options],
    queryFn: () => db.getJournalEntries(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Receipts Hook
export const useReceipts = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.RECEIPTS, options],
    queryFn: () => db.getReceipts(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Settings Hook
export const useSettings = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS],
    queryFn: () => db.getSettings(),
    staleTime: 1000 * 60 * 60, // 1 hour for settings
  });
};

// Price List Hook
export const usePriceList = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRICE_LIST, options],
    queryFn: () => db.getPriceList(options),
    staleTime: 1000 * 60 * 30,
  });
};

// Mutation Hooks with Auto Cache Invalidation
export const useSaveCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customer) => db.saveCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CUSTOMERS] });
    },
  });
};

export const useSaveInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoice) => db.saveInvoice(invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STOCK] });
    },
  });
};

export const useSavePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (purchase) => db.savePurchase(purchase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PURCHASES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STOCK] });
    },
  });
};

export const useSaveVehicleInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoice) => db.saveVehicleInvoice(invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLE_INVOICES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STOCK] });
    },
  });
};

export const useSaveReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receipt) => db.saveReceipt(receipt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECEIPTS] });
    },
  });
};

export const useSaveJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry) => db.saveJournalEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOURNAL_ENTRIES] });
    },
  });
};

// Delete Mutations
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => db.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CUSTOMERS] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => db.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STOCK] });
    },
  });
};

// Workshop Module Hooks
export const useJobCards = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.JOB_CARDS, options],
    queryFn: async () => {
      const { getJobCards } = await import('@/utils/db/jobCards');
      return getJobCards(options);
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useFollowUps = (startDate, endDate, searchTerm) => {
  return useQuery({
    queryKey: [QUERY_KEYS.FOLLOW_UPS, startDate, endDate, searchTerm],
    queryFn: async () => {
      const { getFollowUps } = await import('@/utils/db/workshopFollowUps');
      return getFollowUps(startDate, endDate, searchTerm);
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!(startDate && endDate),
  });
};

export const useWorkshopPurchases = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSHOP_PURCHASES, options],
    queryFn: async () => {
      const { getWorkshopPurchases } = await import('@/utils/db/workshopPurchases');
      return getWorkshopPurchases(options);
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useWorkshopInventory = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSHOP_INVENTORY, options],
    queryFn: async () => {
      const { getWorkshopInventory } = await import('@/utils/db/workshopInventory');
      return getWorkshopInventory(options);
    },
    staleTime: 1000 * 60 * 30,
  });
};

// Workshop Mutations
export const useSaveJobCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobCard, isNew, originalJobCard }) => {
      const { saveJobCard } = await import('@/utils/db/jobCards');
      return saveJobCard(jobCard, isNew, originalJobCard);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_CARDS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSHOP_INVENTORY] });
    },
  });
};

export const useDeleteJobCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobCard) => {
      const { deleteJobCard } = await import('@/utils/db/jobCards');
      return deleteJobCard(jobCard);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_CARDS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSHOP_INVENTORY] });
    },
  });
};

// Cache Utility Functions
export const useCacheUtils = () => {
  const queryClient = useQueryClient();

  return {
    // Invalidate specific module cache
    invalidateCache: (queryKey) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    
    // Invalidate all caches
    invalidateAllCaches: () => {
      queryClient.invalidateQueries();
    },
    
    // Clear specific cache
    clearCache: (queryKey) => {
      queryClient.removeQueries({ queryKey: [queryKey] });
    },
    
    // Clear all caches
    clearAllCaches: () => {
      queryClient.clear();
    },
    
    // Prefetch data
    prefetchData: async (queryKey, queryFn) => {
      await queryClient.prefetchQuery({ queryKey: [queryKey], queryFn });
    },
  };
};

# 🚀 Quick Reference - Caching Hooks

## 📖 Import Statement
```jsx
import { 
  useCustomers, 
  useSaveCustomer, 
  useDeleteCustomer,
  // ... other hooks
} from '@/hooks/useDataCache';
```

## 📊 Query Hooks (Data Fetching)

| Module | Hook | Usage |
|--------|------|-------|
| Customers | `useCustomers(options)` | `const { data, isLoading } = useCustomers({ page: 1 })` |
| Invoices | `useInvoices(options)` | `const { data, isLoading } = useInvoices({ page: 1 })` |
| Purchases | `usePurchases(options)` | `const { data, isLoading } = usePurchases({ page: 1 })` |
| Vehicle Invoices | `useVehicleInvoices(options)` | `const { data, isLoading } = useVehicleInvoices()` |
| Stock | `useStock(options)` | `const { data, isLoading } = useStock()` |
| Sales Returns | `useSalesReturns(options)` | `const { data, isLoading } = useSalesReturns()` |
| Purchase Returns | `usePurchaseReturns(options)` | `const { data, isLoading } = usePurchaseReturns()` |
| Journal Entries | `useJournalEntries(options)` | `const { data, isLoading } = useJournalEntries()` |
| Receipts | `useReceipts(options)` | `const { data, isLoading } = useReceipts()` |
| Settings | `useSettings()` | `const { data, isLoading } = useSettings()` |
| Price List | `usePriceList(options)` | `const { data, isLoading } = usePriceList()` |
| Job Cards | `useJobCards(options)` | `const { data, isLoading } = useJobCards({ searchTerm: '' })` |
| Follow Ups | `useFollowUps(start, end, search)` | `const { data } = useFollowUps('2024-01-01', '2024-12-31', '')` |
| Workshop Purchases | `useWorkshopPurchases(options)` | `const { data } = useWorkshopPurchases()` |
| Workshop Inventory | `useWorkshopInventory(options)` | `const { data } = useWorkshopInventory()` |

## ✏️ Mutation Hooks (Save/Update/Delete)

| Action | Hook | Usage |
|--------|------|-------|
| Save Customer | `useSaveCustomer()` | `const save = useSaveCustomer(); await save.mutateAsync(customer)` |
| Delete Customer | `useDeleteCustomer()` | `const del = useDeleteCustomer(); await del.mutateAsync(id)` |
| Save Invoice | `useSaveInvoice()` | `const save = useSaveInvoice(); await save.mutateAsync(invoice)` |
| Delete Invoice | `useDeleteInvoice()` | `const del = useDeleteInvoice(); await del.mutateAsync(id)` |
| Save Purchase | `useSavePurchase()` | `const save = useSavePurchase(); await save.mutateAsync(purchase)` |
| Save Vehicle Invoice | `useSaveVehicleInvoice()` | `const save = useSaveVehicleInvoice(); await save.mutateAsync(invoice)` |
| Save Receipt | `useSaveReceipt()` | `const save = useSaveReceipt(); await save.mutateAsync(receipt)` |
| Save Journal Entry | `useSaveJournalEntry()` | `const save = useSaveJournalEntry(); await save.mutateAsync(entry)` |
| Save Job Card | `useSaveJobCard()` | `const save = useSaveJobCard(); await save.mutateAsync({ jobCard, isNew, originalJobCard })` |
| Delete Job Card | `useDeleteJobCard()` | `const del = useDeleteJobCard(); await del.mutateAsync(jobCard)` |

## 🛠️ Cache Utilities

```jsx
import { useCacheUtils, QUERY_KEYS } from '@/hooks/useDataCache';

const cacheUtils = useCacheUtils();

// Clear specific cache
cacheUtils.clearCache(QUERY_KEYS.CUSTOMERS);

// Clear all caches
cacheUtils.clearAllCaches();

// Refresh specific cache
cacheUtils.invalidateCache(QUERY_KEYS.INVOICES);

// Refresh all caches
cacheUtils.invalidateAllCaches();

// Prefetch data
await cacheUtils.prefetchData(QUERY_KEYS.STOCK, fetchStockFunction);
```

## 🔑 Query Keys

```jsx
QUERY_KEYS.CUSTOMERS
QUERY_KEYS.INVOICES
QUERY_KEYS.PURCHASES
QUERY_KEYS.VEHICLE_INVOICES
QUERY_KEYS.STOCK
QUERY_KEYS.SALES_RETURNS
QUERY_KEYS.PURCHASE_RETURNS
QUERY_KEYS.JOURNAL_ENTRIES
QUERY_KEYS.RECEIPTS
QUERY_KEYS.SETTINGS
QUERY_KEYS.PRICE_LIST
QUERY_KEYS.JOB_CARDS
QUERY_KEYS.FOLLOW_UPS
QUERY_KEYS.WORKSHOP_PURCHASES
QUERY_KEYS.WORKSHOP_INVENTORY
```

## 📝 Common Patterns

### Pattern 1: Fetch and Display
```jsx
const { data, isLoading, error } = useCustomers();

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return <div>{data?.data?.map(...)}</div>;
```

### Pattern 2: Save Data
```jsx
const saveCustomer = useSaveCustomer();

const handleSave = async (customer) => {
  try {
    await saveCustomer.mutateAsync(customer);
    alert('Saved!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
```

### Pattern 3: Delete Data
```jsx
const deleteCustomer = useDeleteCustomer();

const handleDelete = async (id) => {
  if (confirm('Delete?')) {
    await deleteCustomer.mutateAsync(id);
  }
};
```

### Pattern 4: Loading State
```jsx
const saveCustomer = useSaveCustomer();

<button disabled={saveCustomer.isPending}>
  {saveCustomer.isPending ? 'Saving...' : 'Save'}
</button>
```

### Pattern 5: Multiple Queries
```jsx
const { data: customers } = useCustomers();
const { data: invoices } = useInvoices();
const { data: stock } = useStock();

// All cached independently, no duplicate calls!
```

## ⚙️ Cache Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `staleTime` | 30 minutes | Data stays fresh |
| `cacheTime` | 1 hour | Cache retention |
| `refetchOnMount` | false | No refetch if cached |
| `refetchOnWindowFocus` | false | No refetch on focus |

## 🎯 Response Structure

```jsx
const { 
  data,           // Your data
  isLoading,      // Loading state
  error,          // Error object
  refetch,        // Manual refetch function
  isFetching,     // Background fetching state
} = useCustomers();
```

## 🔄 Auto Cache Invalidation

| Action | Invalidates |
|--------|-------------|
| Save Invoice | Invoices + Stock |
| Save Purchase | Purchases + Stock |
| Save Vehicle Invoice | Vehicle Invoices + Stock |
| Save Job Card | Job Cards + Workshop Inventory |
| Delete Job Card | Job Cards + Workshop Inventory |
| Save Customer | Customers |
| Delete Customer | Customers |

---

**Keep this handy for quick reference! 📌**

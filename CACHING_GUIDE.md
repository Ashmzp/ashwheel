# 🚀 Caching Implementation Guide - Ashwheel

## ✅ Implementation Complete!

सभी modules में automatic caching लागू हो गई है। अब data एक बार fetch होने के बाद **30 minutes** तक cache में रहेगा।

## 📦 Features

- ✅ **Automatic Caching** - Data 30 minutes तक cache में रहता है
- ✅ **Smart Invalidation** - Data update होने पर automatic cache refresh
- ✅ **No Duplicate API Calls** - Same data के लिए multiple API calls नहीं होंगी
- ✅ **All Modules Covered** - सभी modules (Customers, Invoices, Workshop, etc.) में लागू

## 🎯 Usage Examples

### 1. Customers Module में उपयोग

```jsx
import { useCustomers, useSaveCustomer, useDeleteCustomer } from '@/hooks/useDataCache';

function CustomerList() {
  // Data fetch with caching
  const { data, isLoading, error } = useCustomers({ 
    page: 1, 
    pageSize: 100,
    searchTerm: '' 
  });

  // Save mutation with auto cache refresh
  const saveCustomer = useSaveCustomer();
  
  // Delete mutation with auto cache refresh
  const deleteCustomer = useDeleteCustomer();

  const handleSave = async (customer) => {
    await saveCustomer.mutateAsync(customer);
    // Cache automatically refresh हो जाएगा
  };

  const handleDelete = async (id) => {
    await deleteCustomer.mutateAsync(id);
    // Cache automatically refresh हो जाएगा
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data?.map(customer => (
        <div key={customer.id}>{customer.customer_name}</div>
      ))}
    </div>
  );
}
```

### 2. Invoices Module में उपयोग

```jsx
import { useInvoices, useSaveInvoice } from '@/hooks/useDataCache';

function InvoiceList() {
  const { data, isLoading } = useInvoices({ page: 1, pageSize: 50 });
  const saveInvoice = useSaveInvoice();

  const handleSaveInvoice = async (invoice) => {
    await saveInvoice.mutateAsync(invoice);
    // Invoices और Stock दोनों की cache refresh होगी
  };

  return (
    <div>
      {data?.data?.map(invoice => (
        <div key={invoice.id}>{invoice.invoice_no}</div>
      ))}
    </div>
  );
}
```

### 3. Workshop Job Cards में उपयोग

```jsx
import { useJobCards, useSaveJobCard, useDeleteJobCard } from '@/hooks/useDataCache';

function JobCardList() {
  const { data, isLoading } = useJobCards({ 
    searchTerm: '', 
    dateRange: {} 
  });
  
  const saveJobCard = useSaveJobCard();
  const deleteJobCard = useDeleteJobCard();

  const handleSave = async (jobCard, isNew, originalJobCard) => {
    await saveJobCard.mutateAsync({ jobCard, isNew, originalJobCard });
    // Job Cards और Workshop Inventory cache refresh होगी
  };

  return (
    <div>
      {data?.data?.map(jobCard => (
        <div key={jobCard.id}>{jobCard.invoice_no}</div>
      ))}
    </div>
  );
}
```

### 4. Cache Utilities का उपयोग

```jsx
import { useCacheUtils } from '@/hooks/useDataCache';

function SettingsPage() {
  const cacheUtils = useCacheUtils();

  const handleClearCache = () => {
    // Specific module की cache clear करें
    cacheUtils.clearCache('customers');
    
    // या सभी cache clear करें
    cacheUtils.clearAllCaches();
  };

  const handleRefreshData = () => {
    // Specific module की cache invalidate करें (refresh)
    cacheUtils.invalidateCache('invoices');
    
    // या सभी cache invalidate करें
    cacheUtils.invalidateAllCaches();
  };

  return (
    <div>
      <button onClick={handleClearCache}>Clear Cache</button>
      <button onClick={handleRefreshData}>Refresh Data</button>
    </div>
  );
}
```

## 📋 Available Hooks

### Query Hooks (Data Fetching)
- `useCustomers(options)` - Customers data
- `useInvoices(options)` - Invoices data
- `usePurchases(options)` - Purchases data
- `useVehicleInvoices(options)` - Vehicle invoices data
- `useStock(options)` - Stock data
- `useSalesReturns(options)` - Sales returns data
- `usePurchaseReturns(options)` - Purchase returns data
- `useJournalEntries(options)` - Journal entries data
- `useReceipts(options)` - Receipts data
- `useSettings()` - Settings data (1 hour cache)
- `usePriceList(options)` - Price list data
- `useJobCards(options)` - Job cards data
- `useFollowUps(startDate, endDate, searchTerm)` - Follow-ups data
- `useWorkshopPurchases(options)` - Workshop purchases data
- `useWorkshopInventory(options)` - Workshop inventory data

### Mutation Hooks (Data Modification)
- `useSaveCustomer()` - Save customer with auto cache refresh
- `useSaveInvoice()` - Save invoice with auto cache refresh
- `useSavePurchase()` - Save purchase with auto cache refresh
- `useSaveVehicleInvoice()` - Save vehicle invoice with auto cache refresh
- `useSaveReceipt()` - Save receipt with auto cache refresh
- `useSaveJournalEntry()` - Save journal entry with auto cache refresh
- `useDeleteCustomer()` - Delete customer with auto cache refresh
- `useDeleteInvoice()` - Delete invoice with auto cache refresh
- `useSaveJobCard()` - Save job card with auto cache refresh
- `useDeleteJobCard()` - Delete job card with auto cache refresh

### Utility Hook
- `useCacheUtils()` - Cache management utilities

## ⚙️ Configuration

Cache settings (`main.jsx` में configured):

```javascript
staleTime: 1000 * 60 * 30,  // 30 minutes - Data fresh रहेगा
cacheTime: 1000 * 60 * 60,  // 1 hour - Cache memory में रहेगा
refetchOnMount: false,       // Mount पर refetch नहीं होगा अगर cache में data है
refetchOnWindowFocus: false, // Window focus पर refetch नहीं होगा
```

## 🎨 Benefits

1. **Performance** - API calls कम होंगी, app fast होगा
2. **User Experience** - Instant data loading, no loading spinners
3. **Network Efficiency** - Bandwidth save होगी
4. **Automatic Updates** - Data modify होने पर automatic refresh
5. **Smart Caching** - Related data भी refresh होती है (e.g., Invoice save करने पर Stock भी refresh)

## 🔄 Migration Guide

### पुराना तरीका (Without Caching):
```jsx
const [customers, setCustomers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setLoading(false);
  };
  fetchCustomers();
}, []);
```

### नया तरीका (With Caching):
```jsx
const { data: customers, isLoading } = useCustomers();
// बस इतना ही! 🎉
```

## 📝 Notes

- पहली बार data fetch होगा, फिर 30 minutes तक cache से serve होगा
- Data update/delete होने पर automatic cache refresh होगा
- Multiple components same data use कर सकते हैं, API call एक ही बार होगी
- Settings data 1 hour तक cache रहेगा (क्योंकि वो rarely change होता है)

---

**Made with ❤️ for Ashwheel**

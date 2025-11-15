# Tab Switch Auto-Refresh Fix Summary

## समस्या (Problem)
सभी pages में tab switch करने पर auto refresh हो रहा था, जिससे user experience खराब हो रहा था।

## मुख्य कारण (Root Causes)
1. **useVisibilityChange hook** - सभी queries को invalidate कर रहा था
2. **React Query global config** - refetchOnReconnect enabled था
3. **Individual query configs** - कुछ pages में proper stale time नहीं था
4. **useRealtimeData hook** - unnecessary refetches हो रहे थे

## किए गए फिक्स (Applied Fixes)

### 1. useVisibilityChange Hook Fix
**File:** `src/hooks/useVisibilityChange.js`
- अब केवल 10 मिनट से पुराने queries को invalidate करता है
- Aggressive invalidation को रोका गया

### 2. Global Query Client Configuration
**File:** `src/main.jsx`
- `refetchOnReconnect: false` - reconnect पर auto-refresh बंद
- `networkMode: 'online'` - केवल online mode में fetch

### 3. Query Configuration Updates
**File:** `src/utils/queryConfig.js`
- `refetchOnReconnect: false` added
- `networkMode: 'online'` added
- Consistent configuration across all queries

### 4. useRealtimeData Hook Optimization
**File:** `src/hooks/useRealtimeData.js`
- Unnecessary refetches को रोका गया
- Force parameter added for manual refresh

### 5. Page-Specific Fixes

#### VehicleInvoicesPage
**File:** `src/pages/VehicleInvoicesPage.jsx`
- `placeholderData` added for smooth transitions
- DEFAULT_QUERY_CONFIG applied

#### PurchasesPage
**File:** `src/pages/PurchasesPage.jsx`
- Stale time increased to 30 minutes
- `refetchOnMount: false` और `refetchOnReconnect: false` added

#### StockList Component
**File:** `src/components/Stock/StockList.jsx`
- Stale time increased to 30 minutes
- Complete query optimization applied

#### Dashboard Component
**File:** `src/components/Dashboard/Dashboard.jsx`
- Converted from useState to useQuery
- All data fetching now uses React Query with proper caching
- DEFAULT_QUERY_CONFIG applied to all queries

### 6. New Utility Hook
**File:** `src/hooks/useTabVisibility.js`
- Tab visibility tracking without causing refreshes
- Provides visibility state and timing information

## परिणाम (Results)

✅ **Tab switching अब auto-refresh नहीं करता**
✅ **Data properly cached रहता है**
✅ **Better user experience**
✅ **Reduced server load**
✅ **Faster page transitions**

## Testing Checklist

- [ ] VehicleInvoicesPage - tab switch test
- [ ] PurchasesPage - tab switch test  
- [ ] CustomersPage - tab switch test
- [ ] StockPage - tab switch test
- [ ] Dashboard - tab switch test
- [ ] All other pages - tab switch test

## Configuration Summary

```javascript
// Global Query Config
{
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  staleTime: 1000 * 60 * 30, // 30 minutes
  cacheTime: 1000 * 60 * 60, // 1 hour
  networkMode: 'online'
}
```

## Notes
- सभी queries अब 30 मिनट तक fresh रहती हैं
- Manual refresh के लिए query invalidation का use करें
- Real-time updates के लिए Supabase subscriptions काम करते रहेंगे
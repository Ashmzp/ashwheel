// ============================================
// EXAMPLE 1: Customer List Component with Caching
// ============================================

import { useCustomers, useSaveCustomer, useDeleteCustomer } from '@/hooks/useDataCache';
import { useState } from 'react';

function CustomerListExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // ✅ Data automatically cached for 30 minutes
  const { data, isLoading, error, refetch } = useCustomers({ 
    page, 
    pageSize: 100,
    searchTerm 
  });

  // ✅ Mutations with automatic cache invalidation
  const saveCustomer = useSaveCustomer();
  const deleteCustomer = useDeleteCustomer();

  const handleSave = async (customer) => {
    try {
      await saveCustomer.mutateAsync(customer);
      // ✅ Cache automatically refreshes - no manual refetch needed!
      alert('Customer saved successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer.mutateAsync(id);
      // ✅ Cache automatically refreshes
      alert('Customer deleted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (isLoading) return <div>Loading customers...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search customers..."
      />
      
      <div>
        {data?.data?.map(customer => (
          <div key={customer.id}>
            <span>{customer.customer_name}</span>
            <button onClick={() => handleDelete(customer.id)}>Delete</button>
          </div>
        ))}
      </div>

      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Invoice Form with Caching
// ============================================

import { useInvoices, useSaveInvoice, useStock } from '@/hooks/useDataCache';

function InvoiceFormExample() {
  const [invoice, setInvoice] = useState({});

  // ✅ Both queries cached independently
  const { data: invoices } = useInvoices({ page: 1 });
  const { data: stock } = useStock();
  
  const saveInvoice = useSaveInvoice();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveInvoice.mutateAsync(invoice);
      // ✅ Both invoices AND stock cache will refresh automatically
      alert('Invoice saved!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={saveInvoice.isPending}>
        {saveInvoice.isPending ? 'Saving...' : 'Save Invoice'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 3: Workshop Job Card with Caching
// ============================================

import { useJobCards, useSaveJobCard, useWorkshopInventory } from '@/hooks/useDataCache';

function JobCardListExample() {
  const [dateRange, setDateRange] = useState({});

  // ✅ Job cards cached
  const { data: jobCards, isLoading } = useJobCards({ 
    searchTerm: '', 
    dateRange 
  });

  // ✅ Workshop inventory cached
  const { data: inventory } = useWorkshopInventory();

  const saveJobCard = useSaveJobCard();

  const handleSaveJobCard = async (jobCard, isNew, originalJobCard) => {
    try {
      await saveJobCard.mutateAsync({ jobCard, isNew, originalJobCard });
      // ✅ Both job cards AND workshop inventory cache refresh automatically
      alert('Job card saved!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (isLoading) return <div>Loading job cards...</div>;

  return (
    <div>
      {jobCards?.data?.map(jobCard => (
        <div key={jobCard.id}>
          <span>{jobCard.invoice_no} - {jobCard.customer_name}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EXAMPLE 4: Cache Management
// ============================================

import { useCacheUtils, QUERY_KEYS } from '@/hooks/useDataCache';

function CacheManagementExample() {
  const cacheUtils = useCacheUtils();

  return (
    <div>
      <h3>Cache Management</h3>
      
      {/* Clear specific module cache */}
      <button onClick={() => cacheUtils.clearCache(QUERY_KEYS.CUSTOMERS)}>
        Clear Customers Cache
      </button>

      {/* Refresh specific module */}
      <button onClick={() => cacheUtils.invalidateCache(QUERY_KEYS.INVOICES)}>
        Refresh Invoices
      </button>

      {/* Clear all caches */}
      <button onClick={() => cacheUtils.clearAllCaches()}>
        Clear All Caches
      </button>

      {/* Refresh all data */}
      <button onClick={() => cacheUtils.invalidateAllCaches()}>
        Refresh All Data
      </button>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Multiple Components Using Same Data
// ============================================

// Component 1
function CustomerDropdown() {
  const { data: customers } = useCustomers();
  // ✅ Data fetched once and cached
  
  return (
    <select>
      {customers?.data?.map(c => (
        <option key={c.id} value={c.id}>{c.customer_name}</option>
      ))}
    </select>
  );
}

// Component 2
function CustomerTable() {
  const { data: customers } = useCustomers();
  // ✅ Same data, NO additional API call! Uses cache
  
  return (
    <table>
      {customers?.data?.map(c => (
        <tr key={c.id}>
          <td>{c.customer_name}</td>
        </tr>
      ))}
    </table>
  );
}

// Component 3
function CustomerCount() {
  const { data: customers } = useCustomers();
  // ✅ Still NO additional API call! Uses same cache
  
  return <div>Total Customers: {customers?.count || 0}</div>;
}

// ============================================
// EXAMPLE 6: Conditional Data Fetching
// ============================================

import { useFollowUps } from '@/hooks/useDataCache';

function FollowUpListExample() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Query only runs when dates are available
  const { data, isLoading } = useFollowUps(startDate, endDate, searchTerm);

  return (
    <div>
      <input 
        type="date" 
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input 
        type="date" 
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      
      {isLoading && <div>Loading...</div>}
      {data?.map(followUp => (
        <div key={followUp.id}>{followUp.customer_name}</div>
      ))}
    </div>
  );
}

// ============================================
// EXAMPLE 7: Settings with Long Cache
// ============================================

import { useSettings } from '@/hooks/useDataCache';

function SettingsExample() {
  // ✅ Settings cached for 1 hour (longer than other data)
  const { data: settings, isLoading } = useSettings();

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div>
      <h3>Company: {settings?.company_name}</h3>
      <p>GST: {settings?.gst_no}</p>
    </div>
  );
}

export {
  CustomerListExample,
  InvoiceFormExample,
  JobCardListExample,
  CacheManagementExample,
  CustomerDropdown,
  CustomerTable,
  CustomerCount,
  FollowUpListExample,
  SettingsExample,
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Search, Edit, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import CustomerForm from '@/components/Customers/CustomerForm';
import { saveCustomer, deleteCustomer as deleteCustomerFromDB, getCustomers } from '@/utils/db/customers';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControls } from '@/components/ui/pagination';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { exportToExcel } from '@/utils/excel';
import { formatDate } from '@/utils/dateUtils';
import useCustomerStore from '@/stores/customerStore';

const CustomersPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
      type: 'all',
      startDate: '',
      endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { canAccess } = useAuth();
  const PAGE_SIZE = 20;
  const { resetForm } = useCustomerStore();


  const filterQuery = useMemo(() => (query) => {
    if (searchTerm) {
      query = query.or(`customer_name.ilike.%${searchTerm}%,mobile1.ilike.%${searchTerm}%,mobile2.ilike.%${searchTerm}%`);
    }
    if (filters.type) {
      if (filters.type === 'registered') query = query.not('gst', 'is', null);
      else if (filters.type === 'non-registered') query = query.is('gst', null);
    }
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);
    return query;
  }, [searchTerm, filters]);

  const { data: customers, loading, count, refetch } = useRealtimeData('customers', {
    page: currentPage,
    pageSize: PAGE_SIZE,
    filter: filterQuery,
  });

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const handleSaveCustomer = async (customerData) => {
    try {
      const isUpdating = !!editingCustomer;
      if (!customerData.id) {
          customerData.id = uuidv4();
      }

      await saveCustomer(customerData);
      
      toast({
        title: 'Success!',
        description: `Customer has been ${isUpdating ? 'updated' : 'saved'}.`
      });
      
      setIsFormOpen(false);
      setEditingCustomer(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast({
        title: "Error",
        description: `Failed to save customer. ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async (customerId) => {
    if(window.confirm("Are you sure you want to delete this customer?")){
      try {
        await deleteCustomerFromDB(customerId);
        toast({
          title: "Customer Deleted",
          description: "The customer has been removed from the list.",
        });
      } catch (error) {
        console.error("Failed to delete customer:", error);
        toast({
          title: "Deletion Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    resetForm();
  };

  const handleExport = async () => {
    try {
      toast({ title: 'Exporting...', description: 'Fetching all matching customers for export.' });
      
      const { data: allCustomers } = await getCustomers({ 
        pageSize: 10000, 
        searchTerm,
        filters
      });
  
      if (!allCustomers || allCustomers.length === 0) {
        toast({ title: 'No Data', description: 'No customers found for the current filters.', variant: 'destructive' });
        return;
      }
  
      const exportData = allCustomers.map(c => ({
        'Customer Name': c.customer_name,
        'Guardian Name': c.guardian_name || 'N/A',
        'Mobile 1': c.mobile1,
        'Mobile 2': c.mobile2 || 'N/A',
        'Address': `${c.address || ''}, ${c.district || ''}, ${c.state || ''} - ${c.pincode || ''}`,
        'GSTIN': c.gst || 'N/A',
        'Type': c.gst ? 'Registered' : 'Non-Registered',
        'Date Added': formatDate(c.created_at),
      }));
  
      exportToExcel(exportData, 'customers_report');
      toast({ title: 'Export Successful!', description: `${allCustomers.length} customers exported.` });
    } catch (error) {
      toast({ title: 'Export Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Force refetch when page changes
    setTimeout(() => refetch(true), 100);
  };

  if (isFormOpen || editingCustomer) {
    return (
      <div className="container-responsive py-3 md:py-4">
        <CustomerForm 
          customer={editingCustomer} 
          onSave={handleSaveCustomer} 
          onCancel={handleCancelForm} 
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Customer Management - Showroom Pro</title>
        <meta name="description" content="Manage your showroom customers efficiently." />
      </Helmet>
      <div className="container-responsive py-3 md:py-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="page-header">
            <h1 className="page-title">Customer Management</h1>
            {canAccess('customers', 'write') && (
              <Button onClick={() => setIsFormOpen(true)} className="btn-compact">
                <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add New Customer
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <Card>
            <CardHeader className="card-compact">
              <div className="flex-responsive">
                <div className="search-bar">
                  <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or mobile..." 
                    className="input-compact pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-controls">
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}>
                        <SelectTrigger className="btn-compact w-full sm:w-auto">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="registered">Registered</SelectItem>
                            <SelectItem value="non-registered">Non-Registered</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="date" className="input-compact w-full sm:w-auto" value={filters.startDate} onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))} />
                    <Input type="date" className="input-compact w-full sm:w-auto" value={filters.endDate} onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))} />
                  <Button variant="outline" onClick={handleExport} className="btn-compact"><FileDown className="mr-1 h-3.5 w-3.5" /> Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="card-compact">
              <div className="scrollable-container">
                <Table className="table-compact">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Guardian</TableHead>
                      <TableHead>Mobile No.</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {loading ? (
                        <TableRow><TableCell colSpan="6" className="text-center py-10">Loading customers...</TableCell></TableRow>
                      ) : customers.length > 0 ? customers.map((customer) => (
                        <motion.tr 
                          key={customer.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          layout
                        >
                          <TableCell className="font-medium">{customer.customer_name}</TableCell>
                          <TableCell className="text-muted-foreground">{customer.guardian_name || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{customer.mobile1}</TableCell>
                          <TableCell className="text-muted-foreground">{customer.gst || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.gst ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'}`}>
                              {customer.gst ? 'Registered' : 'Non-Registered'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="action-buttons">
                              {canAccess('customers', 'write') && (
                                <Button variant="ghost" onClick={() => handleEdit(customer)}>
                                  <Edit />
                                </Button>
                              )}
                              {canAccess('customers', 'delete') && (
                                <Button variant="ghost" className="text-destructive" onClick={() => handleDelete(customer.id)}>
                                  <Trash2 />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      )) : (
                        <TableRow>
                          <TableCell colSpan="6" className="text-center py-10 text-muted-foreground">
                            No customers found.
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default CustomersPage;
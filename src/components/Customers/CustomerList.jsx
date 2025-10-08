import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Filter,
  Calendar,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { getCustomers, deleteCustomer } from '@/utils/storage';
import { exportToExcel } from '@/utils/excel';
import { formatDate, isDateInRange } from '@/utils/dateUtils';

const CustomerList = ({ onAddCustomer, onEditCustomer }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    nonRegistered: 0
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, dateRange]);

  const loadCustomers = async () => {
    const customerData = await getCustomers();
    setCustomers(customerData);
    
    const registered = customerData.filter(c => c.gst).length;
    setStats({
      total: customerData.length,
      registered,
      nonRegistered: customerData.length - registered
    });
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile1.includes(searchTerm) ||
        (customer.gst && customer.gst.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(customer =>
        isDateInRange(customer.created_at, dateRange.start, dateRange.end)
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        await loadCustomers();
        
        toast({
          title: "Success",
          description: "Customer deleted successfully!"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleExportToExcel = () => {
    try {
      const exportData = filteredCustomers.map(customer => ({
        'Customer Name': customer.customer_name,
        'Guardian': customer.guardian_name || '',
        'Mobile Number': customer.mobile1,
        'Date of Birth': customer.dob || '',
        'Address': customer.address,
        'State': customer.state,
        'District': customer.district,
        'PIN Code': customer.pincode,
        'GST Number': customer.gst || '',
        'Customer Type': customer.gst ? 'Registered' : 'Non-Registered',
        'Created Date': formatDate(customer.created_at)
      }));

      exportToExcel(exportData, 'customers');
      
      toast({
        title: "Success",
        description: "Customer data exported successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold gradient-text">Customer Management</h2>
        <Button onClick={onAddCustomer} className="button-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="quick-stats">
        <div className="quick-stat-card">
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="quick-stat-value">{stats.total}</div>
          <div className="quick-stat-label">Total Customers</div>
        </div>
        <div className="quick-stat-card">
          <UserCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="quick-stat-value">{stats.registered}</div>
          <div className="quick-stat-label">Registered</div>
        </div>
        <div className="quick-stat-card">
          <UserX className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <div className="quick-stat-value">{stats.nonRegistered}</div>
          <div className="quick-stat-label">Non-Registered</div>
        </div>
        <div className="quick-stat-card">
          <Search className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="quick-stat-value">{filteredCustomers.length}</div>
          <div className="quick-stat-label">Filtered Results</div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, mobile, or GST number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              
              <Button
                onClick={handleExportToExcel}
                className="export-button flex items-center gap-2"
                disabled={filteredCustomers.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <div className="responsive-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.customer_name}
                      </TableCell>
                      <TableCell>
                        {customer.guardian_name ? 
                          `${customer.guardian_type} ${customer.guardian_name}` : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>{customer.mobile1}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {customer.address}, {customer.district}, {customer.state} - {customer.pincode}
                      </TableCell>
                      <TableCell>
                        {customer.gst || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${
                          customer.gst ? 'status-registered' : 'status-non-registered'
                        }`}>
                          {customer.gst ? 'Registered' : 'Non-Registered'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditCustomer(customer)}
                            className="edit-button"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="delete-button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="empty-state">
              <Users className="empty-state-icon" />
              <p className="empty-state-title">No Customers Found</p>
              <p className="empty-state-description">
                {searchTerm || dateRange.start || dateRange.end
                  ? 'Try adjusting your search criteria'
                  : 'Start by adding your first customer'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerList;
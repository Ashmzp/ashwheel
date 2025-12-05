import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Download, Filter, Edit, Trash2, MoreVertical, Settings, X, BookOpen, Clock, ShoppingCart, XCircle, User, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { getBookings, getBookingSummary } from '@/utils/db/bookings';
import { exportToExcel } from '@/utils/excel';
import { formatDate, getCurrentMonthDateRange } from '@/utils/dateUtils';
import { useDebounce } from '@/hooks/useDebounce';
import useBookingStore from '@/stores/bookingStore';
import { PaginationControls } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';

const StatCard = ({ icon, title, value, color }) => (
  <Card className={`bg-gradient-to-br ${color} text-white overflow-hidden`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const SummaryTile = ({ title, data, icon, renderItem, onExport, exportFileName }) => {
  const { toast } = useToast();
  const totalCount = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + (item.count || item.booking_qty || 0), 0);
  }, [data]);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
       toast({
        title: 'Export Not Available',
        description: 'This summary cannot be exported yet.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {totalCount > 0 && <span className="text-sm font-bold">{totalCount}</span>}
          {icon}
          <Button variant="ghost" size="icon" onClick={handleExport} className="h-6 w-6">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
            {data.map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                {renderItem(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No data available.</p>
        )}
      </CardContent>
    </Card>
  );
};

const BookingList = ({ onAdd, onEdit, onDelete }) => {
  const {
    page, setPage,
    searchTerm, setSearchTerm,
    dateRange, setDateRange,
    visibleColumns, toggleColumn,
    allColumns
  } = useBookingStore();
  
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const pageSize = 10;
  const { toast } = useToast();

  const [fetchTrigger, setFetchTrigger] = useState(0);

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['bookingSummary', dateRange, fetchTrigger],
    queryFn: () => getBookingSummary(dateRange.start, dateRange.end),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', page, pageSize, debouncedSearchTerm, dateRange, fetchTrigger],
    queryFn: () => getBookings({ page, pageSize, searchTerm: debouncedSearchTerm, startDate: dateRange.start, endDate: dateRange.end }),
    placeholderData: (previousData) => previousData,
  });

  const handleSearch = () => {
    setFetchTrigger(prev => prev + 1);
  };

  const bookings = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const renderCell = (booking, columnId, forExport = false) => {
    if (columnId.startsWith('custom_')) {
      const fieldName = columnId.replace('custom_', '');
      return booking.custom_fields?.[fieldName] || '-';
    }
    switch (columnId) {
      case 'booking_date':
      case 'delivery_date':
        return formatDate(booking[columnId]);
      case 'booking_amount':
        const amount = Number(booking[columnId] || 0);
        return forExport ? amount : amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
      case 'status':
        if (forExport) return booking.status;
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          booking.status === 'Open' ? 'bg-blue-500/20 text-blue-300' :
          booking.status === 'Postpone' ? 'bg-yellow-500/20 text-yellow-300' :
          booking.status === 'Sold' ? 'bg-green-500/20 text-green-300' :
          'bg-red-500/20 text-red-300'
        }`}>{booking.status}</span>;
      default:
        return booking[columnId] || '-';
    }
  };

  const handleMainExport = async () => {
    try {
      const { data: allBookings } = await getBookings({ 
        page: 1, 
        pageSize: 10000, // A large number to fetch all records
        searchTerm: debouncedSearchTerm, 
        startDate: dateRange.start, 
        endDate: dateRange.end 
      });

      const dataToExport = allBookings.map(b => {
        const exportData = {};
        allColumns.forEach(col => {
          exportData[col.label] = renderCell(b, col.id, true);
        });
        return exportData;
      });
      exportToExcel(dataToExport, 'bookings');
      toast({ title: 'Success', description: 'Bookings exported successfully.' });
    } catch (e) {
      console.error("Failed to export data:", e);
      toast({ title: 'Error', description: 'Failed to export bookings.', variant: 'destructive' });
    }
  };

  const handleSummaryExport = (data, fileName, headers) => {
    if (!data || data.length === 0) {
      toast({ title: 'No Data', description: 'There is no data to export.', variant: 'destructive' });
      return;
    }
    const dataToExport = data.map(item => {
      const row = {};
      headers.forEach(header => {
        row[header.label] = item[header.key];
      });
      return row;
    });
    exportToExcel(dataToExport, fileName);
    toast({ title: 'Success', description: `${fileName} exported successfully.` });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange(getCurrentMonthDateRange());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold gradient-text">Booking Management</h2>
        <Button onClick={onAdd} className="button-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Booking
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-4 w-4" />} title="Open" value={summary?.open_count || 0} color="from-blue-500 to-blue-700" />
        <StatCard icon={<Clock className="h-4 w-4" />} title="Postpone" value={summary?.postpone_count || 0} color="from-yellow-500 to-yellow-700" />
        <StatCard icon={<ShoppingCart className="h-4 w-4" />} title="Sold" value={summary?.sold_count || 0} color="from-green-500 to-green-700" />
        <StatCard icon={<XCircle className="h-4 w-4" />} title="Cancelled" value={summary?.cancelled_count || 0} color="from-red-500 to-red-700" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryTile 
          title="Sales Person Summary" 
          data={summary?.sales_person_summary} 
          icon={<User className="h-4 w-4 text-muted-foreground" />}
          onExport={() => handleSummaryExport(
            summary?.sales_person_summary, 
            'Sales_Person_Summary',
            [{label: 'Sales Person', key: 'sales_person'}, {label: 'Count', key: 'count'}]
          )}
          renderItem={(item) => (
            <>
              <span className="truncate pr-2">{item.sales_person || 'N/A'}</span>
              <span className="font-semibold">{item.count}</span>
            </>
          )}
        />
        <SummaryTile 
          title="Model & Colour Summary" 
          data={summary?.model_colour_summary} 
          icon={<Car className="h-4 w-4 text-muted-foreground" />}
          onExport={() => handleSummaryExport(
            summary?.model_colour_summary, 
            'Model_Colour_Summary',
            [
              {label: 'Model Name', key: 'model_name'}, 
              {label: 'Colour', key: 'colour'},
              {label: 'Booking Qty', key: 'booking_qty'},
              {label: 'Stock Qty', key: 'stock_qty'},
            ]
          )}
          renderItem={(item) => (
            <div className="flex justify-between w-full text-xs">
              <span className="truncate pr-2">{item.model_name || 'N/A'} - {item.colour || 'N/A'}</span>
              <div className="flex gap-2 items-center">
                <span className="font-semibold" title="Booking Qty">B: {item.booking_qty}</span>
                <span className="text-muted-foreground" title="Stock Qty">S: {item.stock_qty}</span>
              </div>
            </div>
          )}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, mobile, model, receipt no, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch}><Search className="w-4 h-4 mr-2" />Search</Button>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}><Filter className="w-4 h-4 mr-2" />Filters</Button>
              <Button onClick={handleMainExport} variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline"><Settings className="w-4 h-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Configure Columns</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-2">
                    {allColumns.map(col => (
                      <div key={col.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={col.id}
                          checked={visibleColumns.includes(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                        <label htmlFor={col.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" onClick={clearFilters} className="w-full"><X className="w-4 h-4 mr-2" />Clear</Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {isLoading ? <p>Loading bookings...</p> : error ? <p>Error: {error.message}</p> : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map(colId => {
                        const col = allColumns.find(c => c.id === colId);
                        return <TableHead key={colId}>{col?.label}</TableHead>;
                      })}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map(booking => (
                      <TableRow key={booking.id}>
                        {visibleColumns.map(colId => (
                          <TableCell key={colId}>{renderCell(booking, colId)}</TableCell>
                        ))}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => onEdit(booking.id)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(booking.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {bookings.length === 0 && <p className="text-center p-4 text-muted-foreground">No bookings found.</p>}
              {totalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingList;
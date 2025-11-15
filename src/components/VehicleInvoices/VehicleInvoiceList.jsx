import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '@/styles/responsive.css';
import { Search, Plus, Download, UserCheck, UserX, Package, ArrowUpDown, Printer, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/utils/excel';
import { AnimatePresence, motion } from 'framer-motion';
import { PaginationControls } from '@/components/ui/pagination';
import ColumnSettingsDialog from './ColumnSettingsDialog';
import { EXPORT_COLUMNS_CONFIG } from './columnsConfig';
import { getVehicleInvoicesForExport } from '@/utils/db';

const ALL_COLUMN_KEYS = Object.keys(EXPORT_COLUMNS_CONFIG).filter(key => !EXPORT_COLUMNS_CONFIG[key].source);
const LOCAL_STORAGE_KEY = 'vehicleInvoiceVisibleColumns_report';

const VehicleInvoiceList = ({ 
  invoices, 
  onAddInvoice, 
  onEditInvoice, 
  onDeleteInvoice, 
  onPrint, 
  loading, 
  canAccess, 
  summaryData, 
  summaryLoading,
  dateRange,
  setDateRange,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination
}) => {
  const { toast } = useToast();
  const [selectedRows, setSelectedRows] = useState([]);
  const [sorting, setSorting] = useState({ key: 'invoice_date', order: 'desc' });
  const [pageInput, setPageInput] = useState(pagination.currentPage);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.filter(col => EXPORT_COLUMNS_CONFIG[col] && !EXPORT_COLUMNS_CONFIG[col].source);
        }
    } catch (e) {}
    return ALL_COLUMN_KEYS.filter(key => EXPORT_COLUMNS_CONFIG[key].default);
  });

  useEffect(() => {
    setSelectedRows([]);
  }, [invoices]);

  useEffect(() => {
    setPageInput(pagination.currentPage);
  }, [pagination.currentPage]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(invoices.map(inv => inv.invoice_id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice? This will return all items to stock.')) {
      try {
        await onDeleteInvoice(invoiceId);
      } catch (error) {
        toast({ title: "Error", description: `Failed to delete invoice: ${error.message}`, variant: "destructive" });
      }
    }
  };

  const handleExport = useCallback(async () => {
    toast({ title: "Exporting...", description: "Preparing data for export. This may take a moment." });
    
    try {
        const dataToExport = await getVehicleInvoicesForExport({
            startDate: dateRange.start,
            endDate: dateRange.end,
            searchTerm: searchTerm
        });
        
        if (dataToExport.length === 0) {
            toast({ title: "No Data", description: "There is no data to export for the selected criteria.", variant: "destructive" });
            return;
        }

        const expandedData = [];
        dataToExport.forEach(invoice => {
            const commonData = {};
            visibleColumns.forEach(colName => {
                if(EXPORT_COLUMNS_CONFIG[colName] && EXPORT_COLUMNS_CONFIG[colName].export) {
                    const config = EXPORT_COLUMNS_CONFIG[colName];
                     if (!config.source) {
                        const value = config.getter ? config.getter(invoice) : invoice[config.key];
                        commonData[colName] = config.format ? config.format(value) : (value ?? '');
                    }
                }
            });

            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach(item => {
                    const itemRow = {...commonData};
                    itemRow['Model Name'] = item.model_name || '';
                    itemRow['Chassis No'] = item.chassis_no || '';
                    itemRow['Engine No'] = item.engine_no || '';
                    itemRow['Colour'] = item.colour || '';
                    itemRow['Price'] = item.price || 0;
                    expandedData.push(itemRow);
                });
            } else {
                // If an invoice has no items, still include it once
                const emptyRow = {...commonData};
                emptyRow['Model Name'] = '';
                emptyRow['Chassis No'] = '';
                emptyRow['Engine No'] = '';
                emptyRow['Colour'] = '';
                emptyRow['Price'] = 0;
                expandedData.push(emptyRow);
            }
        });
        
        // Ensure all visible columns exist in the final export data, even if empty
        const finalData = expandedData.map(row => {
            const finalRow = {};
            visibleColumns.forEach(colName => {
                finalRow[colName] = row[colName] ?? '';
            });
             if (visibleColumns.includes('Model Name')) finalRow['Model Name'] = row['Model Name'];
             if (visibleColumns.includes('Chassis No')) finalRow['Chassis No'] = row['Chassis No'];
             if (visibleColumns.includes('Engine No')) finalRow['Engine No'] = row['Engine No'];
             if (visibleColumns.includes('Colour')) finalRow['Colour'] = row['Colour'];
            return finalRow;
        });


        exportToExcel(finalData, `vehicle_invoices_${dateRange.start}_to_${dateRange.end}`);
        toast({ title: "Export Successful", description: "Your data has been exported to Excel." });
    } catch (error) {
        toast({ title: "Export Failed", description: error.message, variant: 'destructive' });
    }
  }, [dateRange, searchTerm, visibleColumns, toast]);
  
  const handleSort = (key) => {
    setSorting(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => {
      const config = EXPORT_COLUMNS_CONFIG[sorting.key];
      const aVal = config?.getter ? config.getter(a) : a[sorting.key];
      const bVal = config?.getter ? config.getter(b) : b[sorting.key];
      if (aVal < bVal) return sorting.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, sorting]);

  const renderCellContent = (invoice, colName) => {
    const config = EXPORT_COLUMNS_CONFIG[colName];
    if (!config) return null;

    const value = config.getter ? config.getter(invoice) : invoice[config.key];
    const displayValue = config.format ? config.format(value) : (value ?? '');

    // Special formatting for multi-line display
    if (['Model Name', 'Chassis No', 'Engine No'].includes(colName) && invoice.items?.length > 0) {
      return (
        <TableCell key={`${invoice.invoice_id}-${colName}`}>
          <div className="space-y-1">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="text-sm">
                {colName === 'Model Name' && item.model_name}
                {colName === 'Chassis No' && item.chassis_no}
                {colName === 'Engine No' && item.engine_no}
              </div>
            ))}
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell key={`${invoice.invoice_id}-${colName}`}>{displayValue}</TableCell>
    );
  };

  const handleGoToPage = () => {
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination({ currentPage: page });
    } else {
      toast({ title: "Invalid Page", description: `Please enter a page number between 1 and ${pagination.totalPages}.`, variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="page-header">
        <h1 className="page-title">Vehicle Invoice Management</h1>
        {canAccess('vehicle_invoices', 'write') && (
          <Button onClick={onAddInvoice} className="btn-compact"><Plus className="w-3.5 h-3.5 mr-1" /> Create Vehicle Invoice</Button>
        )}
      </div>

      {summaryData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Registered Sales</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryData.registered_qty}</div><p className="text-xs text-muted-foreground">chassis billed</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Non-Registered Sales</CardTitle><UserX className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryData.non_registered_qty}</div><p className="text-xs text-muted-foreground">chassis billed</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Sales</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryData.total_qty}</div><p className="text-xs text-muted-foreground">chassis billed in period</p></CardContent></Card>
        </motion.div>
      )}
      {summaryLoading && <div className="text-center p-4">Loading summary...</div>}

      <Card>
        <CardHeader className="card-compact">
          <div className="flex-responsive">
            <div className="search-bar">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Invoice, Customer, Chassis, Engine..." className="input-compact pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="filter-controls">
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="input-compact" />
              <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="input-compact" />
              <Button variant="outline" onClick={handleExport} className="btn-compact"><Download className="mr-1 h-3.5 w-3.5" /> Export</Button>
              <ColumnSettingsDialog visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} storageKey={LOCAL_STORAGE_KEY} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="card-compact">
          <div className="scrollable-container">
            <Table className="table-compact">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox checked={invoices && selectedRows.length === invoices.length && invoices.length > 0} onCheckedChange={handleSelectAll} />
                  </TableHead>
                  {visibleColumns.map(colName => {
                    const config = EXPORT_COLUMNS_CONFIG[colName];
                    return (
                        <TableHead key={colName} onClick={() => config.sortable && handleSort(colName)} className={config.sortable ? 'cursor-pointer' : ''}>
                          {colName}
                          {config.sortable && sorting.key === colName && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                        </TableHead>
                    )
                  })}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {loading ? (
                    <TableRow><TableCell colSpan={visibleColumns.length + 2} className="text-center h-24">Loading invoices...</TableCell></TableRow>
                  ) : sortedInvoices.length > 0 ? sortedInvoices.map((invoice) => (
                     <motion.tr
                        key={invoice.invoice_id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={selectedRows.includes(invoice.invoice_id) ? 'bg-secondary' : ''}
                      >
                        <TableCell>
                            <Checkbox
                                checked={selectedRows.includes(invoice.invoice_id)}
                                onCheckedChange={(checked) => handleSelectRow(invoice.invoice_id, checked)}
                            />
                        </TableCell>
                        {visibleColumns.map(colName => renderCellContent(invoice, colName))}
                        <TableCell className="text-right">
                          <div className="action-buttons">
                            <Button variant="ghost" title="Print Delivery Challan" onClick={() => onPrint('DeliveryChallan', invoice)}><Printer className="text-blue-400" /></Button>
                            <Button variant="ghost" title="Print Tax Invoice" onClick={() => onPrint('TaxInvoice', invoice)}><Printer className="text-green-400" /></Button>
                            {canAccess('vehicle_invoices', 'write') && (
                                <Button variant="ghost" title="Edit Invoice" onClick={() => onEditInvoice(invoice)}><Edit /></Button>
                            )}
                            {canAccess('vehicle_invoices', 'delete') && (
                                <Button variant="ghost" title="Delete Invoice" className="text-red-500" onClick={() => handleDelete(invoice.invoice_id)}><Trash2 /></Button>
                            )}
                          </div>
                        </TableCell>
                    </motion.tr>
                  )) : (
                    <TableRow><TableCell colSpan={visibleColumns.length + 2} className="text-center h-24">No invoices found.</TableCell></TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} records)
            </div>
            <div className="flex items-center gap-2">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination({ currentPage: page })}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max={pagination.totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGoToPage()}
                  className="input-compact w-16"
                />
                <Button onClick={handleGoToPage} className="btn-compact">Go</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleInvoiceList;
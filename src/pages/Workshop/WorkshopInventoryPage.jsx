import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { getWorkshopInventory } from '@/utils/db/workshopInventory';
import { exportToExcel } from '@/utils/excel';
import { isDateInRange, formatDate } from '@/utils/dateUtils';
import useSettingsStore from '@/stores/settingsStore';

const defaultInventoryColumns = [
    { id: 'part_no', label: 'Part No.' },
    { id: 'part_name', label: 'Part Name' },
    { id: 'hsn_code', label: 'HSN' },
    { id: 'purchase_rate', label: 'Purchase Rate' },
    { id: 'quantity', label: 'Qty' },
    { id: 'uom', label: 'UOM' },
    { id: 'sale_rate', label: 'Sale Rate' },
    { id: 'gst', label: 'GST(%)' },
    { id: 'category', label: 'Category' },
];

const PAGE_SIZE = 1000;

const WorkshopInventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { settings } = useSettingsStore();
  const workshopSettings = settings.workshop_settings || {};

  const inventoryColumns = useMemo(() => {
    const savedColumns = workshopSettings.workshop_purchase_columns;
    let columns = (savedColumns && Array.isArray(savedColumns) && savedColumns.length > 0)
        ? savedColumns
            .filter(c => c.id !== 'total' && c.id !== 'action')
            .map(c => ({
                id: {
                    partNo: 'part_no',
                    partName: 'part_name',
                    hsn: 'hsn_code',
                    purchaseRate: 'purchase_rate',
                    qty: 'quantity',
                    saleRate: 'sale_rate',
                }[c.id] || c.id,
                label: c.label
            }))
        : defaultInventoryColumns;

    if (!workshopSettings.enable_uom) {
        columns = columns.filter(col => col.id !== 'uom');
    }
    
    return columns;
  }, [workshopSettings.workshop_purchase_columns, workshopSettings.enable_uom]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkshopInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch inventory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredInventory = useMemo(() => {
    let filtered = inventory;
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowercasedTerm)
        )
      );
    }
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(item => isDateInRange(item.last_updated, dateRange.start, dateRange.end));
    }
    return filtered;
  }, [inventory, searchTerm, dateRange]);

  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredInventory.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredInventory, currentPage]);

  const totalPages = Math.ceil(filteredInventory.length / PAGE_SIZE);

  const handleExport = () => {
    if (filteredInventory.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const exportData = filteredInventory.map(item => {
      const row = {};
      inventoryColumns.forEach(col => {
        row[col.label] = item[col.id] || '';
      });
      row['Total Purchase Value'] = (item.purchase_rate * item.quantity).toFixed(2);
      row['Last Updated'] = formatDate(item.last_updated);
      return row;
    });
    exportToExcel(exportData, 'workshop_inventory');
    toast({ title: "Export Successful", description: "Inventory data exported." });
  };

  return (
    <>
      <Helmet>
        <title>Workshop Inventory - Ashwheel</title>
        <meta name="description" content="Manage and track workshop parts inventory." />
      </Helmet>
      <div className="p-4 md:p-8 space-y-6">
        <h1 className="page-title">Workshop Inventory</h1>
        <Card>
          <CardHeader className="card-compact">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search inventory..." className="input-compact pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full sm:w-auto" />
                <Input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full sm:w-auto" />
                <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="card-compact">
            <div className="scrollable-container">
              <Table className="table-compact">
                <TableHeader>
                  <TableRow>
                    {inventoryColumns.map(col => (
                      <TableHead key={col.id}>{col.label}</TableHead>
                    ))}
                    <TableHead>Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={inventoryColumns.length + 1} className="text-center h-24">Loading inventory...</TableCell></TableRow>
                  ) : paginatedInventory.length > 0 ? paginatedInventory.map((item) => (
                    <TableRow key={item.id}>
                      {inventoryColumns.map(col => (
                        <TableCell key={col.id}>{item[col.id]}</TableCell>
                      ))}
                      <TableCell>₹{(item.purchase_rate * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={inventoryColumns.length + 1} className="text-center h-24">No inventory found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-4 mt-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WorkshopInventoryPage;
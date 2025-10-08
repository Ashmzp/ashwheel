import React, { useState, useEffect, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Search, Download, ListFilter } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useToast } from '@/components/ui/use-toast';
    import { getStock } from '@/utils/storage';
    import { exportToExcel } from '@/utils/excel';
    import { formatDate, getStockDays, getStockDaysClass, isDateInRange } from '@/utils/dateUtils';

    const StockList = () => {
      const [stock, setStock] = useState([]);
      const [filteredStock, setFilteredStock] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');
      const [filters, setFilters] = useState({
        aging: 'all',
        model: 'all'
      });
      const [stats, setStats] = useState({ totalStock: 0, newStock: 0, mediumStock: 0, oldStock: 0, totalValue: 0 });
      const [loading, setLoading] = useState(true);
      const { toast } = useToast();

      const fetchStock = useCallback(async () => {
        setLoading(true);
        const stockData = await getStock();
        setStock(Array.isArray(stockData) ? stockData : []);
        setLoading(false);
      }, []);

      useEffect(() => {
        fetchStock();
      }, [fetchStock]);

      const modelNames = [...new Set(stock.map(item => item.model_name))];

      useEffect(() => {
        let filtered = Array.isArray(stock) ? [...stock] : [];

        if (searchTerm) {
          const searchParts = searchTerm.split(',').map(part => part.trim().toLowerCase());
          if (searchParts.length === 2) {
            const [modelSearch, colorSearch] = searchParts;
            filtered = filtered.filter(item => 
              item.model_name.toLowerCase().includes(modelSearch) && 
              item.colour.toLowerCase().includes(colorSearch)
            );
          } else {
            filtered = filtered.filter(item =>
              item.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.chassis_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.engine_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.colour.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
        }
        
        if (filters.aging !== 'all') {
            filtered = filtered.filter(item => {
                const days = getStockDays(item.purchase_date);
                if (filters.aging === 'new' && days <= 30) return true;
                if (filters.aging === 'medium' && days > 30 && days <= 90) return true;
                if (filters.aging === 'old' && days > 90) return true;
                return false;
            });
        }
        
        if (filters.model !== 'all') {
            filtered = filtered.filter(item => item.model_name === filters.model);
        }

        setFilteredStock(filtered);

        if (Array.isArray(filtered)) {
            const newStockCount = filtered.filter(item => getStockDays(item.purchase_date) <= 30).length;
            const mediumStockCount = filtered.filter(item => getStockDays(item.purchase_date) > 30 && getStockDays(item.purchase_date) <= 90).length;
            const oldStockCount = filtered.filter(item => getStockDays(item.purchase_date) > 90).length;
            const totalValue = filtered.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
            setStats({ totalStock: filtered.length, newStock: newStockCount, mediumStock: mediumStockCount, oldStock: oldStockCount, totalValue });
        }
      }, [stock, searchTerm, filters]);

      const handleExport = () => {
        if (filteredStock.length === 0) {
          toast({ title: "No data to export", variant: "destructive" });
          return;
        }
        const exportData = filteredStock.map(item => ({
          'Model Name': item.model_name,
          'Chassis No': item.chassis_no,
          'Engine No': item.engine_no,
          'Colour': item.colour,
          'Category': item.category,
          'Stock Days': getStockDays(item.purchase_date),
          'Purchase Date': formatDate(item.purchase_date),
          'Price': item.price
        }));
        exportToExcel(exportData, 'stock_list');
        toast({ title: "Export Successful", description: "Stock data exported." });
      };

      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Stock Management</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle>Total Stock</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalStock}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>New (≤30d)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-500">{stats.newStock}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Medium (31-90d)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-yellow-500">{stats.mediumStock}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Old (>90d)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-500">{stats.oldStock}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search model, chassis, color or 'model,color'..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <Select value={filters.aging} onValueChange={(value) => setFilters(prev => ({...prev, aging: value}))}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by aging" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Aging</SelectItem>
                            <SelectItem value="new">New (≤30d)</SelectItem>
                            <SelectItem value="medium">Medium (31-90d)</SelectItem>
                            <SelectItem value="old">Old (>90d)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.model} onValueChange={(value) => setFilters(prev => ({...prev, model: value}))}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by model" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Models</SelectItem>
                            {modelNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Chassis No</TableHead>
                      <TableHead>Engine No</TableHead>
                      <TableHead>Colour</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Days</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={7} className="text-center h-24">Loading stock...</TableCell></TableRow>
                    ) : filteredStock.length > 0 ? filteredStock.map((item) => {
                      const days = getStockDays(item.purchase_date);
                      const daysClass = getStockDaysClass(days);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.model_name}</TableCell>
                          <TableCell>{item.chassis_no}</TableCell>
                          <TableCell>{item.engine_no}</TableCell>
                          <TableCell>{item.colour}</TableCell>
                          <TableCell>{item.category || 'N/A'}</TableCell>
                          <TableCell className={daysClass}>{days} days</TableCell>
                          <TableCell>₹{parseFloat(item.price || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">No stock found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    };

    export default StockList;
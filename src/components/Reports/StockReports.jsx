import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { getAllStock } from '@/utils/db/stock';
import { exportToExcel } from '@/utils/excel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, Search, FileDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDebounce } from '@/hooks/useDebounce';

const StockReports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeStockTab, setActiveStockTab] = useLocalStorage('stockReportActiveTab', 'model-color-wise');
  const [searchTerm, setSearchTerm] = useLocalStorage('stockReportSearchTerm', '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const queryKey = ['allStockForReports', user?.id];

  const { data: stockData, isLoading, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => getAllStock(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('public:stock:reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);
  
  const { processedData, totals, colorHeaders } = useMemo(() => {
    if (!stockData) return { processedData: [], totals: {}, colorHeaders: [] };
    
    const lowerCaseSearch = debouncedSearchTerm.toLowerCase();

    const filteredStock = debouncedSearchTerm
      ? stockData.filter(item => item.model_name.toLowerCase().includes(lowerCaseSearch))
      : stockData;

    const grandTotal = filteredStock.length;

    if (activeStockTab === 'model-color-wise') {
      const allColors = [...new Set(stockData.map(item => item.colour || 'N/A'))].sort();
      const modelMap = new Map();

      filteredStock.forEach(item => {
        if (!modelMap.has(item.model_name)) {
          const colorCounts = {};
          allColors.forEach(c => colorCounts[c] = 0);
          modelMap.set(item.model_name, {
            model_name: item.model_name,
            ...colorCounts,
            total: 0
          });
        }
        const modelEntry = modelMap.get(item.model_name);
        const color = item.colour || 'N/A';
        modelEntry[color]++;
        modelEntry.total++;
      });
      
      const finalData = Array.from(modelMap.values()).sort((a,b) => a.model_name.localeCompare(b.model_name));
      
      const colorTotals = {};
      allColors.forEach(c => {
        colorTotals[c] = finalData.reduce((sum, model) => sum + model[c], 0);
      });

      return {
        processedData: finalData,
        colorHeaders: allColors,
        totals: {
          grandTotal: grandTotal,
          ...colorTotals,
        }
      };
    }
    
    const modelMap = new Map();
    filteredStock.forEach(item => {
      if (!modelMap.has(item.model_name)) {
        modelMap.set(item.model_name, { model_name: item.model_name, colors: new Map(), total: 0 });
      }
      const modelEntry = modelMap.get(item.model_name);
      const color = item.colour || 'N/A';
      modelEntry.colors.set(color, (modelEntry.colors.get(color) || 0) + 1);
      modelEntry.total += 1;
    });

    let finalData = [];
    if (activeStockTab === 'model-color-list') {
      modelMap.forEach(model => {
        finalData.push({ isHeader: true, model_name: model.model_name, total: model.total });
        model.colors.forEach((qty, color) => {
          finalData.push({ isHeader: false, model_name: model.model_name, color, qty });
        });
      });
    } else { // model-wise
      finalData = Array.from(modelMap.values()).map(model => ({ model_name: model.model_name, total: model.total }));
    }
    
    return {
      processedData: finalData.sort((a, b) => a.model_name.localeCompare(b.model_name)),
      totals: { grandTotal: grandTotal },
      colorHeaders: [],
    };

  }, [stockData, activeStockTab, debouncedSearchTerm]);

  const handleExport = () => {
    if (processedData.length === 0) {
      toast({ title: 'No Data', description: 'There is no data to export.', variant: 'destructive' });
      return;
    }

    let dataToExport, grandTotalRow;
    
    if (activeStockTab === 'model-color-wise') {
        dataToExport = processedData.map(item => {
            const row = { 'MODEL NAME': item.model_name };
            colorHeaders.forEach(color => row[color.toUpperCase()] = item[color]);
            row['TOTAL QTY'] = item.total;
            return row;
        });
        grandTotalRow = { 'MODEL NAME': 'Grand Total' };
        colorHeaders.forEach(color => grandTotalRow[color.toUpperCase()] = totals[color]);
        grandTotalRow['TOTAL QTY'] = totals.grandTotal;

    } else if (activeStockTab === 'model-color-list') {
        dataToExport = [];
        const modelTotals = new Map();
        processedData.forEach(item => item.isHeader && modelTotals.set(item.model_name, item.total));
        modelTotals.forEach((total, modelName) => {
            dataToExport.push({ 'Model Name': modelName, 'Colour': '', 'QTY': '', 'Total QTY': total });
            processedData.forEach(item => {
                if (!item.isHeader && item.model_name === modelName) {
                    dataToExport.push({ 'Model Name': '', 'Colour': item.color, 'QTY': item.qty, 'Total QTY': '' });
                }
            });
        });
        grandTotalRow = { 'Model Name': 'Grand Total', 'Colour': '', 'QTY': '', 'Total QTY': totals.grandTotal };

    } else { // model-wise
        dataToExport = processedData.map(item => ({ 'Model Name': item.model_name, 'QTY': item.total }));
        grandTotalRow = { 'Model Name': 'Grand Total', 'QTY': totals.grandTotal };
    }
    
    dataToExport.push(grandTotalRow);
    exportToExcel(dataToExport, `Stock_Report_${activeStockTab}`);
    toast({ title: 'Export Successful', description: 'Report has been exported to Excel.' });
  };
  
  const renderTable = () => {
    if (isLoading && !stockData) {
      return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (processedData.length === 0 && !isLoading) {
      return <div className="text-center py-10">No results found.</div>;
    }

    if (activeStockTab === 'model-color-wise') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10">MODEL NAME</TableHead>
              {colorHeaders.map(color => <TableHead key={color} className="text-center">{color.toUpperCase()}</TableHead>)}
              <TableHead className="text-right font-bold">TOTAL QTY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((item) => (
              <TableRow key={item.model_name}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">{item.model_name}</TableCell>
                {colorHeaders.map(color => <TableCell key={`${item.model_name}-${color}`} className="text-center">{item[color] > 0 ? item[color] : '-'}</TableCell>)}
                <TableCell className="text-right font-bold">{item.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-secondary/80 font-bold">
              <TableCell className="sticky left-0 bg-secondary/80 z-10">Grand Total</TableCell>
              {colorHeaders.map(color => <TableCell key={`total-${color}`} className="text-center">{totals[color]}</TableCell>)}
              <TableCell className="text-right">{totals.grandTotal}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
    }
    
    if (activeStockTab === 'model-color-list') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Model Name</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>QTY</TableHead>
              <TableHead className="text-right">Total QTY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((item, index) => (
              <TableRow key={`${item.model_name}-${item.color || index}`} className={cn(item.isHeader ? "bg-secondary/50 font-bold" : "")}>
                <TableCell>{item.isHeader ? item.model_name : ''}</TableCell>
                <TableCell>{item.isHeader ? '' : item.color}</TableCell>
                <TableCell>{item.isHeader ? '' : item.qty}</TableCell>
                <TableCell className="text-right">{item.isHeader ? item.total : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-secondary/80 font-bold">
              <TableCell colSpan={3}>Grand Total</TableCell>
              <TableCell className="text-right">{totals.grandTotal}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
    }
    
    // Model Wise
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>MODEL NAME</TableHead>
            <TableHead className="text-right">TOTAL QTY</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedData.map((item) => (
            <TableRow key={item.model_name}>
              <TableCell className="font-medium">{item.model_name}</TableCell>
              <TableCell className="text-right font-bold">{item.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-secondary/80 font-bold">
              <TableCell>Grand Total</TableCell>
              <TableCell className="text-right">{totals.grandTotal}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  };

  if (error) return <div className="text-center text-red-500">Error loading stock data: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setActiveStockTab('model-color-wise')} variant={activeStockTab === 'model-color-wise' ? 'default' : 'outline'}>Model & Colour Wise</Button>
            <Button onClick={() => setActiveStockTab('model-wise')} variant={activeStockTab === 'model-wise' ? 'default' : 'outline'}>Model Wise</Button>
            <Button onClick={() => setActiveStockTab('model-color-list')} variant={activeStockTab === 'model-color-list' ? 'default' : 'outline'}>Colour Wise List View</Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by model..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            <Button onClick={handleExport} disabled={isLoading}><FileDown className="mr-2 h-4 w-4" />Export</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockReports;
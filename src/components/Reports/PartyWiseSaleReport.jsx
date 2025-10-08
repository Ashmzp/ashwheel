import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { exportToExcel } from '@/utils/excel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, Search, FileDown, Calendar as CalendarIcon, List, LayoutGrid } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import useReportStore from '@/stores/reportStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DateRange = lazy(() => import('react-date-range').then(mod => ({ default: mod.DateRange })));

const PartyWiseSaleReport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { partyWiseSaleReport, setPartyWiseSaleReportState } = useReportStore();
  const { searchTerm, reportType, dateRange: storedDateRange, customerType } = partyWiseSaleReport;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState([
    {
      startDate: storedDateRange.startDate ? new Date(storedDateRange.startDate) : startOfMonth(new Date()),
      endDate: storedDateRange.endDate ? new Date(storedDateRange.endDate) : endOfMonth(new Date()),
      key: 'selection'
    }
  ]);

  useEffect(() => {
    setPartyWiseSaleReportState({ 
      dateRange: {
        startDate: dateRange[0].startDate.toISOString(),
        endDate: dateRange[0].endDate.toISOString()
      }
    });
  }, [dateRange, setPartyWiseSaleReportState]);

  const queryKey = ['partySaleReport', user?.id, dateRange[0].startDate, dateRange[0].endDate];

  const { data: reportData, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_party_wise_sale_report_v2', {
        p_start_date: format(dateRange[0].startDate, 'yyyy-MM-dd'),
        p_end_date: format(dateRange[0].endDate, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data?.report_data || [];
    },
    enabled: !!user,
  });

  const processedData = useMemo(() => {
    if (!reportData) return { summary: null, detailed: null };

    let filteredData = reportData.filter(item =>
      item.party_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    if (customerType && customerType !== 'All') {
      filteredData = filteredData.filter(item => item.customer_type === customerType);
    }

    const summaryMap = new Map();
    filteredData.forEach(item => {
      const key = `${item.party_name}|${item.customer_type}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, { party_name: item.party_name, customer_type: item.customer_type, total_sale: 0 });
      }
      summaryMap.get(key).total_sale += item.sale_count;
    });

    const registeredParties = Array.from(summaryMap.values()).filter(p => p.customer_type === 'Registered');
    const nonRegisteredSale = Array.from(summaryMap.values())
      .filter(p => p.customer_type === 'Non-Registered')
      .reduce((sum, item) => sum + item.total_sale, 0);
    const totalRegisteredSale = registeredParties.reduce((sum, p) => sum + p.total_sale, 0);
    const grandTotal = totalRegisteredSale + nonRegisteredSale;
    const summary = { registeredParties, totalRegisteredSale, nonRegisteredSale, grandTotal };

    const detailedMap = new Map();
    const allModels = new Set();
    filteredData.forEach(item => {
      allModels.add(item.model_name);
      const key = `${item.party_name}|${item.customer_type}`;
      if (!detailedMap.has(key)) {
        detailedMap.set(key, { party_name: item.party_name, customer_type: item.customer_type, models: {}, total: 0 });
      }
      const party = detailedMap.get(key);
      party.models[item.model_name] = (party.models[item.model_name] || 0) + item.sale_count;
      party.total += item.sale_count;
    });

    const modelHeaders = Array.from(allModels).sort();
    const detailedRows = Array.from(detailedMap.values());
    
    const detailedTotals = { models: {}, total: 0 };
    modelHeaders.forEach(model => {
        detailedTotals.models[model] = detailedRows.reduce((sum, row) => sum + (row.models[model] || 0), 0);
    });
    detailedTotals.total = detailedRows.reduce((sum, row) => sum + row.total, 0);

    const detailed = { rows: detailedRows, modelHeaders, totals: detailedTotals };

    return { summary, detailed };
  }, [reportData, debouncedSearchTerm, customerType]);

  const handleExport = () => {
    if (!reportData || reportData.length === 0) {
      toast({ title: 'No Data', description: 'There is no data to export.', variant: 'destructive' });
      return;
    }

    let dataToExport = [];
    let fileName = '';

    if (reportType === 'summary') {
      fileName = 'Party_Wise_Sale_Summary_Report';
      processedData.summary.registeredParties.forEach(p => dataToExport.push({ 'Party Name': p.party_name, 'Total Sale': p.total_sale }));
      dataToExport.push({});
      dataToExport.push({ 'Party Name': 'Total (Registered)', 'Total Sale': processedData.summary.totalRegisteredSale });
      dataToExport.push({ 'Party Name': 'Non-Registered', 'Total Sale': processedData.summary.nonRegisteredSale });
      dataToExport.push({ 'Party Name': 'Grand Total', 'Total Sale': processedData.summary.grandTotal });
      exportToExcel(dataToExport, fileName);
    } else {
      fileName = 'Party_Wise_Model_Sale_Detailed_Report';
      
      processedData.detailed.rows.forEach(row => {
        const exportRow = { 'Party Name': row.party_name, 'Customer Type': row.customer_type };
        processedData.detailed.modelHeaders.forEach(m => exportRow[m] = row.models[m] || 0);
        exportRow['Total'] = row.total;
        dataToExport.push(exportRow);
      });

      const totalRow = { 'Party Name': 'Grand Total', 'Customer Type': '' };
      processedData.detailed.modelHeaders.forEach(m => totalRow[m] = processedData.detailed.totals.models[m] || 0);
      totalRow['Total'] = processedData.detailed.totals.total;
      dataToExport.push(totalRow);
      
      exportToExcel(dataToExport, fileName);
    }
    
    toast({ title: 'Export Successful', description: 'Report has been exported to Excel.' });
  };

  const renderSummaryReport = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Party Name</TableHead>
          <TableHead className="text-right">Total Sale</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {processedData.summary.registeredParties.map(p => (
          <TableRow key={p.party_name}>
            <TableCell>{p.party_name}</TableCell>
            <TableCell className="text-right font-medium">{p.total_sale}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-secondary/60 font-bold">
          <TableCell>Total (Registered)</TableCell>
          <TableCell className="text-right">{processedData.summary.totalRegisteredSale}</TableCell>
        </TableRow>
        <TableRow className="bg-secondary/60 font-bold">
          <TableCell>Non-Registered</TableCell>
          <TableCell className="text-right">{processedData.summary.nonRegisteredSale}</TableCell>
        </TableRow>
        <TableRow className="bg-primary/20 font-extrabold text-lg">
          <TableCell>Grand Total</TableCell>
          <TableCell className="text-right">{processedData.summary.grandTotal}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );

  const renderDetailedReport = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Party Name</TableHead>
            <TableHead>Customer Type</TableHead>
            {processedData.detailed.modelHeaders.map(model => <TableHead key={model} className="text-center">{model}</TableHead>)}
            <TableHead className="text-right font-bold min-w-[100px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedData.detailed.rows.map(row => (
            <TableRow key={`${row.party_name}-${row.customer_type}`}>
              <TableCell className="font-medium sticky left-0 bg-background z-10">{row.party_name}</TableCell>
              <TableCell>{row.customer_type}</TableCell>
              {processedData.detailed.modelHeaders.map(model => <TableCell key={model} className="text-center">{row.models[model] || '-'}</TableCell>)}
              <TableCell className="text-right font-bold">{row.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-primary/20 font-extrabold text-lg">
            <TableCell className="sticky left-0 bg-inherit z-10">Grand Total</TableCell>
            <TableCell></TableCell>
            {processedData.detailed.modelHeaders.map(model => (
              <TableCell key={model} className="text-center">{processedData.detailed.totals.models[model] || 0}</TableCell>
            ))}
            <TableCell className="text-right">{processedData.detailed.totals.total}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );

  if (error) return <div className="text-center text-red-500">Error loading report data: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Party Wise Sale Report</CardTitle>
          <div className="flex gap-2">
            <Button variant={reportType === 'summary' ? 'default' : 'outline'} onClick={() => setPartyWiseSaleReportState({ reportType: 'summary' })}><List className="mr-2 h-4 w-4" /> Summary</Button>
            <Button variant={reportType === 'detailed' ? 'default' : 'outline'} onClick={() => setPartyWiseSaleReportState({ reportType: 'detailed' })}><LayoutGrid className="mr-2 h-4 w-4" /> Detailed</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full sm:w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange[0].startDate, "dd LLL, y")} - {format(dateRange[0].endDate, "dd LLL, y")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Suspense fallback={<div className="p-4">Loading Calendar...</div>}>
                  <DateRange
                    editableDateInputs={true}
                    onChange={item => setDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                  />
                </Suspense>
              </PopoverContent>
            </Popover>
            <Select value={customerType || 'All'} onValueChange={(value) => setPartyWiseSaleReportState({ customerType: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Customer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Non-Registered">Non-Registered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by party name..." value={searchTerm} onChange={(e) => setPartyWiseSaleReportState({ searchTerm: e.target.value })} className="pl-10"/>
            </div>
            <Button onClick={handleExport} disabled={isLoading}><FileDown className="mr-2 h-4 w-4" />Export</Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !reportData || reportData.length === 0 ? (
          <div className="text-center py-10">No sales data found for the selected period.</div>
        ) : (
          reportType === 'summary' ? renderSummaryReport() : renderDetailedReport()
        )}
      </CardContent>
    </Card>
  );
};

export default PartyWiseSaleReport;
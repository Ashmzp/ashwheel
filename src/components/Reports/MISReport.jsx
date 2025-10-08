import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { exportToExcel } from '@/utils/excel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, FileDown, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from 'react-date-range';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import useReportStore from '@/stores/reportStore';

const MISReport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { misReport, setMisReportState } = useReportStore();
  const { activeTab, viewMode, customerFilter } = misReport;

  const [customDateRange, setCustomDateRange] = useState([
    {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      key: 'selection'
    }
  ]);

  const getDateRanges = () => {
    const now = new Date();
    const currentMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    const currentYear = { start: startOfYear(now), end: endOfYear(now) };
    const lastYear = { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) };
    const currentYearThisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastYearThisMonth = { start: startOfMonth(subYears(now, 1)), end: endOfMonth(subYears(now, 1)) };

    return {
      'month-comparison': { current: currentMonth, previous: lastMonth },
      'year-comparison': { current: currentYear, previous: lastYear },
      'ly-cy-month': { current: currentYearThisMonth, previous: lastYearThisMonth },
      'custom': { current: { start: customDateRange[0].startDate, end: customDateRange[0].endDate }, previous: null }
    };
  };

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['misReport', activeTab, customDateRange, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const ranges = getDateRanges();
      const currentRange = ranges[activeTab].current;
      const previousRange = ranges[activeTab].previous;

      const fetchData = async (startDate, endDate) => {
        const { data, error } = await supabase.rpc('get_vehicle_invoices_report_v4', {
          p_start_date: format(startDate, 'yyyy-MM-dd'),
          p_end_date: format(endDate, 'yyyy-MM-dd'),
          p_search_term: '',
          p_page_size: 99999,
          p_page_number: 1
        });
        if (error) throw error;
        return data[0]?.invoices_data || [];
      };

      const currentData = await fetchData(currentRange.start, currentRange.end);
      const previousData = previousRange ? await fetchData(previousRange.start, previousRange.end) : [];

      const processData = (invoices) => {
        const modelMap = new Map();
        let registeredTotal = 0;
        let nonRegisteredTotal = 0;

        invoices.forEach(invoice => {
          const isRegistered = invoice.customer?.gst || (invoice.customer_details_json?.gst && invoice.customer_details_json.gst.trim() !== '');
          const items = invoice.items || [];
          
          items.forEach(item => {
            const modelName = item.model_name || 'Unknown';
            
            if (!modelMap.has(modelName)) {
              modelMap.set(modelName, { registered: 0, nonRegistered: 0, total: 0 });
            }
            
            const modelData = modelMap.get(modelName);
            if (isRegistered) {
              modelData.registered += 1;
              registeredTotal += 1;
            } else {
              modelData.nonRegistered += 1;
              nonRegisteredTotal += 1;
            }
            modelData.total += 1;
          });
        });

        return {
          modelData: Array.from(modelMap.entries()).map(([model, data]) => ({
            model,
            ...data
          })).sort((a, b) => a.model.localeCompare(b.model)),
          totals: {
            registered: registeredTotal,
            nonRegistered: nonRegisteredTotal,
            total: registeredTotal + nonRegisteredTotal
          }
        };
      };

      const current = processData(currentData);
      const previous = processData(previousData);

      return { current, previous };
    },
    enabled: !!user,
  });

  const filteredData = useMemo(() => {
    if (!reportData) return null;

    const filterByCustomerType = (data) => {
      if (customerFilter === 'all') return data;
      
      return {
        modelData: data.modelData.map(item => {
          if (customerFilter === 'registered') {
            return { model: item.model, registered: item.registered, nonRegistered: 0, total: item.registered };
          } else {
            return { model: item.model, registered: 0, nonRegistered: item.nonRegistered, total: item.nonRegistered };
          }
        }).filter(item => item.total > 0),
        totals: {
          registered: customerFilter === 'registered' ? data.totals.registered : 0,
          nonRegistered: customerFilter === 'non-registered' ? data.totals.nonRegistered : 0,
          total: customerFilter === 'registered' ? data.totals.registered : 
                 customerFilter === 'non-registered' ? data.totals.nonRegistered : data.totals.total
        }
      };
    };

    return {
      current: filterByCustomerType(reportData.current),
      previous: reportData.previous ? filterByCustomerType(reportData.previous) : null
    };
  }, [reportData, customerFilter]);

  const handleExport = () => {
    if (!filteredData) {
      toast({ title: 'No Data', description: 'There is no data to export.', variant: 'destructive' });
      return;
    }

    let dataToExport = [];
    let fileName = `MIS_Report_${activeTab}_${viewMode}`;

    if (viewMode === 'model-wise') {
      const ranges = getDateRanges();
      const currentLabel = activeTab === 'month-comparison' ? 'This Month' :
                          activeTab === 'year-comparison' ? 'This Year' : 'Current Period';
      const previousLabel = activeTab === 'month-comparison' ? 'Last Month' :
                           activeTab === 'year-comparison' ? 'Last Year' : 'Previous Period';

      filteredData.current.modelData.forEach(item => {
        const previousItem = filteredData.previous?.modelData.find(p => p.model === item.model);
        const row = {
          'Model': item.model,
          [`${currentLabel} (Registered)`]: customerFilter !== 'non-registered' ? item.registered : 0,
          [`${currentLabel} (Non-Registered)`]: customerFilter !== 'registered' ? item.nonRegistered : 0,
          [`${currentLabel} (Total)`]: item.total
        };

        if (filteredData.previous) {
          row[`${previousLabel} (Registered)`] = customerFilter !== 'non-registered' ? (previousItem?.registered || 0) : 0;
          row[`${previousLabel} (Non-Registered)`] = customerFilter !== 'registered' ? (previousItem?.nonRegistered || 0) : 0;
          row[`${previousLabel} (Total)`] = previousItem?.total || 0;
          row['Growth'] = ((item.total - (previousItem?.total || 0)) / Math.max(previousItem?.total || 1, 1) * 100).toFixed(1) + '%';
        }

        dataToExport.push(row);
      });

      const totalRow = {
        'Model': 'TOTAL',
        [`${currentLabel} (Registered)`]: customerFilter !== 'non-registered' ? filteredData.current.totals.registered : 0,
        [`${currentLabel} (Non-Registered)`]: customerFilter !== 'registered' ? filteredData.current.totals.nonRegistered : 0,
        [`${currentLabel} (Total)`]: filteredData.current.totals.total
      };

      if (filteredData.previous) {
        totalRow[`${previousLabel} (Registered)`] = customerFilter !== 'non-registered' ? filteredData.previous.totals.registered : 0;
        totalRow[`${previousLabel} (Non-Registered)`] = customerFilter !== 'registered' ? filteredData.previous.totals.nonRegistered : 0;
        totalRow[`${previousLabel} (Total)`] = filteredData.previous.totals.total;
        totalRow['Growth'] = ((filteredData.current.totals.total - filteredData.previous.totals.total) / Math.max(filteredData.previous.totals.total, 1) * 100).toFixed(1) + '%';
      }

      dataToExport.push(totalRow);
    } else {
      const ranges = getDateRanges();
      const currentLabel = activeTab === 'month-comparison' ? 'This Month' :
                          activeTab === 'year-comparison' ? 'This Year' : 'Current Period';
      const previousLabel = activeTab === 'month-comparison' ? 'Last Month' :
                           activeTab === 'year-comparison' ? 'Last Year' : 'Previous Period';

      dataToExport = [{
        'Period': currentLabel,
        'Registered Sales': customerFilter !== 'non-registered' ? filteredData.current.totals.registered : 0,
        'Non-Registered Sales': customerFilter !== 'registered' ? filteredData.current.totals.nonRegistered : 0,
        'Total Sales': filteredData.current.totals.total
      }];

      if (filteredData.previous) {
        dataToExport.push({
          'Period': previousLabel,
          'Registered Sales': customerFilter !== 'non-registered' ? filteredData.previous.totals.registered : 0,
          'Non-Registered Sales': customerFilter !== 'registered' ? filteredData.previous.totals.nonRegistered : 0,
          'Total Sales': filteredData.previous.totals.total
        });

        dataToExport.push({
          'Period': 'Growth %',
          'Registered Sales': ((filteredData.current.totals.registered - filteredData.previous.totals.registered) / Math.max(filteredData.previous.totals.registered, 1) * 100).toFixed(1) + '%',
          'Non-Registered Sales': ((filteredData.current.totals.nonRegistered - filteredData.previous.totals.nonRegistered) / Math.max(filteredData.previous.totals.nonRegistered, 1) * 100).toFixed(1) + '%',
          'Total Sales': ((filteredData.current.totals.total - filteredData.previous.totals.total) / Math.max(filteredData.previous.totals.total, 1) * 100).toFixed(1) + '%'
        });
      }
    }

    exportToExcel(dataToExport, fileName);
    toast({ title: 'Export Successful', description: 'Report has been exported to Excel.' });
  };

  const renderModelWiseReport = () => {
    if (!filteredData) return null;

    const ranges = getDateRanges();
    const currentLabel = activeTab === 'month-comparison' ? 'This Month' :
                        activeTab === 'year-comparison' ? 'This Year' : 'Current Period';
    const previousLabel = activeTab === 'month-comparison' ? 'Last Month' :
                         activeTab === 'year-comparison' ? 'Last Year' : 'Previous Period';

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            {customerFilter !== 'non-registered' && <TableHead className="text-center">{currentLabel} (Reg)</TableHead>}
            {customerFilter !== 'registered' && <TableHead className="text-center">{currentLabel} (Non-Reg)</TableHead>}
            <TableHead className="text-center">{currentLabel} (Total)</TableHead>
            {filteredData.previous && (
              <>
                {customerFilter !== 'non-registered' && <TableHead className="text-center">{previousLabel} (Reg)</TableHead>}
                {customerFilter !== 'registered' && <TableHead className="text-center">{previousLabel} (Non-Reg)</TableHead>}
                <TableHead className="text-center">{previousLabel} (Total)</TableHead>
                <TableHead className="text-center">Growth %</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.current.modelData.map(item => {
            const previousItem = filteredData.previous?.modelData.find(p => p.model === item.model);
            const growth = previousItem ? ((item.total - previousItem.total) / Math.max(previousItem.total, 1) * 100).toFixed(1) : 0;
            
            return (
              <TableRow key={item.model}>
                <TableCell className="font-medium">{item.model}</TableCell>
                {customerFilter !== 'non-registered' && <TableCell className="text-center">{item.registered}</TableCell>}
                {customerFilter !== 'registered' && <TableCell className="text-center">{item.nonRegistered}</TableCell>}
                <TableCell className="text-center font-bold">{item.total}</TableCell>
                {filteredData.previous && (
                  <>
                    {customerFilter !== 'non-registered' && <TableCell className="text-center">{previousItem?.registered || 0}</TableCell>}
                    {customerFilter !== 'registered' && <TableCell className="text-center">{previousItem?.nonRegistered || 0}</TableCell>}
                    <TableCell className="text-center">{previousItem?.total || 0}</TableCell>
                    <TableCell className={`text-center font-medium ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {growth}%
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-secondary/80 font-bold">
            <TableCell>TOTAL</TableCell>
            {customerFilter !== 'non-registered' && <TableCell className="text-center">{filteredData.current.totals.registered}</TableCell>}
            {customerFilter !== 'registered' && <TableCell className="text-center">{filteredData.current.totals.nonRegistered}</TableCell>}
            <TableCell className="text-center">{filteredData.current.totals.total}</TableCell>
            {filteredData.previous && (
              <>
                {customerFilter !== 'non-registered' && <TableCell className="text-center">{filteredData.previous.totals.registered}</TableCell>}
                {customerFilter !== 'registered' && <TableCell className="text-center">{filteredData.previous.totals.nonRegistered}</TableCell>}
                <TableCell className="text-center">{filteredData.previous.totals.total}</TableCell>
                <TableCell className={`text-center font-bold ${((filteredData.current.totals.total - filteredData.previous.totals.total) / Math.max(filteredData.previous.totals.total, 1) * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {((filteredData.current.totals.total - filteredData.previous.totals.total) / Math.max(filteredData.previous.totals.total, 1) * 100).toFixed(1)}%
                </TableCell>
              </>
            )}
          </TableRow>
        </TableFooter>
      </Table>
    );
  };

  const renderTotalSummary = () => {
    if (!filteredData) return null;

    const ranges = getDateRanges();
    const currentLabel = activeTab === 'month-comparison' ? 'This Month' :
                        activeTab === 'year-comparison' ? 'This Year' : 'Current Period';
    const previousLabel = activeTab === 'month-comparison' ? 'Last Month' :
                         activeTab === 'year-comparison' ? 'Last Year' : 'Previous Period';

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{currentLabel} - Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerFilter !== 'non-registered' ? filteredData.current.totals.registered : 0}</div>
            {filteredData.previous && (
              <p className="text-xs text-muted-foreground">
                Previous: {customerFilter !== 'non-registered' ? filteredData.previous.totals.registered : 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{currentLabel} - Non-Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerFilter !== 'registered' ? filteredData.current.totals.nonRegistered : 0}</div>
            {filteredData.previous && (
              <p className="text-xs text-muted-foreground">
                Previous: {customerFilter !== 'registered' ? filteredData.previous.totals.nonRegistered : 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{currentLabel} - Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.current.totals.total}</div>
            {filteredData.previous && (
              <p className="text-xs text-muted-foreground">
                Previous: {filteredData.previous.totals.total}
              </p>
            )}
          </CardContent>
        </Card>

        {filteredData.previous && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Growth %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${((filteredData.current.totals.total - filteredData.previous.totals.total) / Math.max(filteredData.previous.totals.total, 1) * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {((filteredData.current.totals.total - filteredData.previous.totals.total) / Math.max(filteredData.previous.totals.total, 1) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs {previousLabel}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (error) return <div className="text-center text-red-500">Error loading MIS report data: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>MIS Report</CardTitle>
          <Button onClick={handleExport} disabled={isLoading}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="flex flex-wrap gap-2">
              <Select value={customerFilter} onValueChange={(value) => setMisReportState({ customerFilter: value })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Customer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="registered">Registered Only</SelectItem>
                  <SelectItem value="non-registered">Non-Registered Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={(value) => setMisReportState({ viewMode: value })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="View Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="model-wise">Model-wise</SelectItem>
                  <SelectItem value="total">Total Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeTab === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(customDateRange[0].startDate, "dd LLL, y")} - {format(customDateRange[0].endDate, "dd LLL, y")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateRange
                    editableDateInputs={true}
                    onChange={item => setCustomDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={customDateRange}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setMisReportState({ activeTab: value })}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="month-comparison">Last Month / This Month</TabsTrigger>
              <TabsTrigger value="year-comparison">Last Year / This Year</TabsTrigger>
              <TabsTrigger value="ly-cy-month">LY This Month / CY This Month</TabsTrigger>
              <TabsTrigger value="custom">Custom Range</TabsTrigger>
            </TabsList>

            <TabsContent value="month-comparison" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : viewMode === 'model-wise' ? renderModelWiseReport() : renderTotalSummary()}
            </TabsContent>

            <TabsContent value="year-comparison" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : viewMode === 'model-wise' ? renderModelWiseReport() : renderTotalSummary()}
            </TabsContent>

            <TabsContent value="ly-cy-month" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : viewMode === 'model-wise' ? renderModelWiseReport() : renderTotalSummary()}
            </TabsContent>

            <TabsContent value="custom" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : viewMode === 'model-wise' ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Custom Period: {format(customDateRange[0].startDate, "dd MMM yyyy")} - {format(customDateRange[0].endDate, "dd MMM yyyy")}
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        {customerFilter !== 'non-registered' && <TableHead className="text-center">Registered</TableHead>}
                        {customerFilter !== 'registered' && <TableHead className="text-center">Non-Registered</TableHead>}
                        <TableHead className="text-center">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData?.current.modelData.map(item => (
                        <TableRow key={item.model}>
                          <TableCell className="font-medium">{item.model}</TableCell>
                          {customerFilter !== 'non-registered' && <TableCell className="text-center">{item.registered}</TableCell>}
                          {customerFilter !== 'registered' && <TableCell className="text-center">{item.nonRegistered}</TableCell>}
                          <TableCell className="text-center font-bold">{item.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-secondary/80 font-bold">
                        <TableCell>TOTAL</TableCell>
                        {customerFilter !== 'non-registered' && <TableCell className="text-center">{filteredData?.current.totals.registered}</TableCell>}
                        {customerFilter !== 'registered' && <TableCell className="text-center">{filteredData?.current.totals.nonRegistered}</TableCell>}
                        <TableCell className="text-center">{filteredData?.current.totals.total}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ) : renderTotalSummary()}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default MISReport;
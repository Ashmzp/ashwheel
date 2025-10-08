import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, FileDown, FileText } from 'lucide-react';
import { getLedgerSummary } from '@/utils/db/journalEntries';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/utils/excel';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LedgerSummary = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerType, setCustomerType] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    getLedgerSummary(customerType)
      .then(data => {
        setSummaryData(data);
        setIsLoading(false);
      })
      .catch(error => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to fetch ledger summary: ${error.message}`,
        });
        setIsLoading(false);
      });
  }, [customerType, toast]);

  const { totalPayable, totalReceivable, grandTotal } = useMemo(() => {
    const totals = summaryData.reduce(
      (acc, item) => {
        acc.totalPayable += item.payable_amount;
        acc.totalReceivable += item.receivable_amount;
        return acc;
      },
      { totalPayable: 0, totalReceivable: 0 }
    );
    totals.grandTotal = totals.totalReceivable - totals.totalPayable;
    return totals;
  }, [summaryData]);

  const handleExportExcel = () => {
    if (summaryData.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No data to export.' });
      return;
    }
    const dataToExport = summaryData.map(item => ({
      'Customer Name': item.customer_name,
      'Receivable Amount': item.receivable_amount,
      'Payable Amount': item.payable_amount,
      'Net Balance': item.net_balance,
    }));
    dataToExport.push({
      'Customer Name': 'GRAND TOTAL',
      'Receivable Amount': totalReceivable,
      'Payable Amount': totalPayable,
      'Net Balance': grandTotal,
    });
    exportToExcel(dataToExport, `Ledger_Summary_${customerType}`);
  };

  const handleExportPdf = () => {
    if (summaryData.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No data to export.' });
      return;
    }
    const doc = new jsPDF();
    doc.text(`Ledger Summary - ${customerType.charAt(0).toUpperCase() + customerType.slice(1)} Customers`, 14, 16);
    doc.autoTable({
      head: [['Customer Name', 'Receivable (Dr)', 'Payable (Cr)', 'Net Balance']],
      body: summaryData.map(item => [
        item.customer_name,
        item.receivable_amount.toFixed(2),
        item.payable_amount.toFixed(2),
        `${Math.abs(item.net_balance).toFixed(2)} ${item.net_balance >= 0 ? 'Dr' : 'Cr'}`,
      ]),
      foot: [
        ['GRAND TOTAL', totalReceivable.toFixed(2), totalPayable.toFixed(2), `${Math.abs(grandTotal).toFixed(2)} ${grandTotal >= 0 ? 'Dr' : 'Cr'}`]
      ],
      startY: 20,
      showFoot: 'lastPage',
    });
    doc.save(`Ledger_Summary_${customerType}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger Summary</CardTitle>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <Select value={customerType} onValueChange={setCustomerType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Customer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="non-registered">Non-Registered</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportExcel} disabled={summaryData.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={handleExportPdf} disabled={summaryData.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">Receivable (Dr)</TableHead>
                <TableHead className="text-right">Payable (Cr)</TableHead>
                <TableHead className="text-right">Net Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : summaryData.length > 0 ? (
                summaryData.map((item) => (
                  <TableRow key={item.customer_id}>
                    <TableCell>{item.customer_name}</TableCell>
                    <TableCell className="text-right text-green-500">{item.receivable_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-500">{item.payable_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Math.abs(item.net_balance).toFixed(2)} {item.net_balance >= 0 ? 'Dr' : 'Cr'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No summary data available for the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>GRAND TOTAL</TableCell>
                <TableCell className="text-right text-green-500">{totalReceivable.toFixed(2)}</TableCell>
                <TableCell className="text-right text-red-500">{totalPayable.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {Math.abs(grandTotal).toFixed(2)} {grandTotal >= 0 ? 'Dr' : 'Cr'}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LedgerSummary;
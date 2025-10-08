import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileDown, FileText } from 'lucide-react';
import { getCustomers } from '@/utils/db/customers';
import { getPartyLedger } from '@/utils/db/journalEntries';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/utils/excel';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DateRangePicker } from '@/components/ui/daterangepicker';
import { getCurrentMonthDateRange } from '@/utils/dateUtils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const AutocompleteCustomerSearch = ({ onSelect, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true);
      getCustomers({ searchTerm: debouncedSearchTerm, pageSize: 10 })
        .then(({ data }) => {
          setResults(data);
          setIsLoading(false);
          setIsOpen(true);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm]);

  const handleSelect = (customer) => {
    setSearchTerm(customer.customer_name);
    onSelect(customer);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(results.length > 0)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && (
        <div className="absolute z-10 w-full bg-card border rounded-md mt-1 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-center">Loading...</div>
          ) : results.length > 0 ? (
            results.map((customer) => (
              <div
                key={customer.id}
                className="p-2 hover:bg-accent cursor-pointer"
                onClick={() => handleSelect(customer)}
              >
                {customer.customer_name} ({customer.mobile1})
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-muted-foreground">No customers found.</div>
          )}
        </div>
      )}
    </div>
  );
};

const LedgerView = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState(() => {
    const { start, end } = getCurrentMonthDateRange();
    return { from: new Date(start), to: new Date(end) };
  });
  const [page, setPage] = useState(1);
  const pageSize = 100;

  useEffect(() => {
    if (selectedCustomer && dateRange?.from && dateRange?.to) {
      setIsLoading(true);
      getPartyLedger(selectedCustomer.id, dateRange.from, dateRange.to)
        .then(data => {
          setLedgerData(data);
          setIsLoading(false);
        })
        .catch(error => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to fetch ledger: ${error.message}`,
          });
          setIsLoading(false);
        });
    } else {
      setLedgerData([]);
    }
  }, [selectedCustomer, dateRange, toast]);

  const calculateBalance = () => {
    let balance = 0;
    return ledgerData.map(entry => {
      balance += (entry.debit || 0) - (entry.credit || 0);
      return { ...entry, balance };
    });
  };

  const ledgerWithBalance = calculateBalance();
  const paginatedData = ledgerWithBalance.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(ledgerWithBalance.length / pageSize);
  const finalBalance = ledgerWithBalance.length > 0 ? ledgerWithBalance[ledgerWithBalance.length - 1].balance : 0;

  const handleExportExcel = () => {
    if (!selectedCustomer || ledgerWithBalance.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No data to export.' });
      return;
    }
    const dataToExport = ledgerWithBalance.map(entry => ({
      'Date': new Date(entry.transaction_date).toLocaleDateString(),
      'Party Name': selectedCustomer.customer_name,
      'Vehicle Details': `${entry.model_name || ''} / ${entry.chassis_no || ''}`,
      'Particulars': entry.particulars,
      'Debit': entry.debit,
      'Credit': entry.credit,
      'Balance': entry.balance,
    }));
    
    dataToExport.push({ 'Particulars': 'Closing Balance', 'Balance': finalBalance });
    exportToExcel(dataToExport, `Ledger_${selectedCustomer.customer_name.replace(/\s/g, '_')}`);
  };

  const handleExportPdf = () => {
    if (!selectedCustomer || ledgerWithBalance.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No data to export.' });
      return;
    }
    const doc = new jsPDF();
    doc.text(`Ledger for ${selectedCustomer.customer_name}`, 14, 16);
    doc.autoTable({
      head: [['Date', 'Particulars', 'Vehicle', 'Debit', 'Credit', 'Balance']],
      body: ledgerWithBalance.map(e => [
        new Date(e.transaction_date).toLocaleDateString(),
        e.particulars,
        `${e.model_name || ''} / ${e.chassis_no || ''}`,
        (e.debit || 0).toFixed(2),
        (e.credit || 0).toFixed(2),
        `${Math.abs(e.balance).toFixed(2)} ${e.balance >= 0 ? 'Dr' : 'Cr'}`
      ]),
      startY: 20,
    });
    doc.text(`Closing Balance: ${Math.abs(finalBalance).toFixed(2)} ${finalBalance >= 0 ? 'Dr' : 'Cr'}`, 14, doc.autoTable.previous.finalY + 10);
    doc.save(`Ledger_${selectedCustomer.customer_name.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Customer</CardTitle>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="w-full md:w-1/3">
            <AutocompleteCustomerSearch
              onSelect={setSelectedCustomer}
              placeholder="Search by customer name or mobile..."
            />
          </div>
          <div className="w-full md:w-auto">
            <DateRangePicker dateRange={dateRange} onDateChange={setDateRange} />
          </div>
          <Button onClick={handleExportExcel} disabled={!selectedCustomer || ledgerData.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={handleExportPdf} disabled={!selectedCustomer || ledgerData.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedCustomer && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold">{selectedCustomer.customer_name}</h3>
            <p className="text-muted-foreground">{selectedCustomer.address}</p>
            <p className="text-muted-foreground">Mobile: {selectedCustomer.mobile1}</p>
          </div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead>Vehicle Details</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(entry.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell>{selectedCustomer.customer_name}</TableCell>
                    <TableCell>{entry.model_name || entry.chassis_no ? `${entry.model_name || ''} / ${entry.chassis_no || ''}`.trim() : '-'}</TableCell>
                    <TableCell>{entry.particulars}</TableCell>
                    <TableCell className="text-right">{(entry.debit || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(entry.credit || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Math.abs(entry.balance).toFixed(2)} {entry.balance >= 0 ? 'Dr' : 'Cr'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {selectedCustomer ? 'No transactions found for this customer in the selected date range.' : 'Please select a customer to view their ledger.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} />
              </PaginationItem>
              {[...Array(totalPages).keys()].map(p => (
                <PaginationItem key={p + 1}>
                  <PaginationLink href="#" onClick={() => setPage(p + 1)} isActive={page === p + 1}>
                    {p + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        {ledgerWithBalance.length > 0 && (
          <div className="mt-4 text-right font-bold text-lg">
            Closing Balance: {Math.abs(finalBalance).toFixed(2)} {finalBalance >= 0 ? 'Dr' : 'Cr'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LedgerView;
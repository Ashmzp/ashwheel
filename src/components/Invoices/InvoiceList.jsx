import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/utils/excel';
import { formatDate, isDateInRange } from '@/utils/dateUtils';
import { AnimatePresence, motion } from 'framer-motion';

const InvoiceList = ({ invoices, onAddInvoice, onEditInvoice, onDeleteInvoice, onPrintInvoice, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { toast } = useToast();

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    let filtered = invoices;

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        (inv.invoice_no && inv.invoice_no.toLowerCase().includes(lowercasedTerm)) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(lowercasedTerm)) ||
        (inv.items && Array.isArray(inv.items) && inv.items.some(item => 
          (item.chassis_no && item.chassis_no.toLowerCase().includes(lowercasedTerm)) ||
          (item.engine_no && item.engine_no.toLowerCase().includes(lowercasedTerm))
        ))
      );
    }
    
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(inv => isDateInRange(inv.invoice_date, dateRange.start, dateRange.end));
    }

    return filtered;
  }, [searchTerm, dateRange, invoices]);

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await onDeleteInvoice(invoiceId);
      } catch (error) {
        toast({ title: "Error", description: `Failed to delete invoice: ${error.message}`, variant: "destructive" });
      }
    }
  };

  const handleExport = () => {
    if(filteredInvoices.length === 0) {
        toast({ title: "No Data", description: "There is no data to export.", variant: "destructive" });
        return;
    }
    const dataToExport = filteredInvoices.flatMap(inv => 
      (inv.items && Array.isArray(inv.items) && inv.items.length > 0) ? inv.items.map(item => ({
        'Invoice No': inv.invoice_no,
        'Invoice Date': formatDate(inv.invoice_date),
        'Customer Name': inv.customer_name,
        'Customer Type': inv.customer_type,
        'Model Name': item.model_name,
        'Chassis No': item.chassis_no,
        'Engine No': item.engine_no,
        'Colour': item.colour,
        'HSN': item.hsn,
        'GST %': item.gst,
        'Price': item.price,
        'Total Amount': inv.total_amount,
        ...(inv.custom_field_values || {})
      })) : [{ // Handle invoices with no items
        'Invoice No': inv.invoice_no,
        'Invoice Date': formatDate(inv.invoice_date),
        'Customer Name': inv.customer_name,
        'Customer Type': inv.customer_type,
        'Total Amount': inv.total_amount,
        ...(inv.custom_field_values || {})
      }]
    );
    exportToExcel(dataToExport, 'invoices_report');
    toast({ title: "Success", description: "Data exported to Excel." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoice Management</h1>
        <Button onClick={onAddInvoice}><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Invoice No, Customer, Chassis..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-auto" />
              <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-auto" />
              <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Chassis No(s)</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">Loading invoices...</TableCell></TableRow>
                  ) : filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
                    <motion.tr 
                      key={invoice.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${invoice.customer_type === 'registered' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {invoice.customer_type}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{(invoice.items || []).map(i => i.chassis_no).join(', ')}</TableCell>
                      <TableCell>₹{invoice.total_amount?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onPrintInvoice(invoice)}><Printer className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onEditInvoice(invoice)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(invoice.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </motion.tr>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">No invoices found.</TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceList;
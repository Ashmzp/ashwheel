import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, Edit, Trash2 } from 'lucide-react';
import { exportToExcel } from '@/utils/excel';
import { formatDate, isDateInRange } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';

const WorkshopPurchaseList = ({ purchases, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { canAccess } = useAuth();

  const filteredPurchases = useMemo(() => {
    return purchases
      .filter(p => {
        const term = searchTerm.toLowerCase();
        return (
          (p.party_name && p.party_name.toLowerCase().includes(term)) ||
          (p.invoice_no && p.invoice_no.toLowerCase().includes(term))
        );
      })
      .filter(p => isDateInRange(p.invoice_date, dateRange.start, dateRange.end));
  }, [purchases, searchTerm, dateRange]);

  const handleExport = () => {
    const dataToExport = filteredPurchases.flatMap(p => 
        (p.items || []).map(item => ({
            'Invoice No': p.invoice_no,
            'Invoice Date': formatDate(p.invoice_date),
            'Party Name': p.party_name,
            'Part No': item.partNo,
            'Part Name': item.partName,
            'HSN': item.hsn,
            'Purchase Rate': item.purchaseRate,
            'Quantity': item.qty,
            'Sale Rate': item.saleRate,
            'GST (%)': item.gst,
            'Category': item.category,
        }))
    );
    if (dataToExport.length > 0) {
        exportToExcel(dataToExport, 'Workshop_Purchases');
    }
  };

  const handleDeleteClick = (purchase) => {
    if (window.confirm('Are you sure you want to delete this purchase? This will also update the inventory.')) {
      onDelete(purchase);
    }
  };

  const canWrite = canAccess('workshop_purchases', 'write');
  const canDelete = canAccess('workshop_purchases', 'delete');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card>
        <CardHeader>
          <CardTitle className="gradient-text">Workshop Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by Party Name or Invoice No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden responsive-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No.</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Item Count</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((p, index) => {
                    const totalAmount = (p.items || []).reduce((sum, item) => {
                        const itemTotal = (item.purchaseRate * item.qty) * (1 + item.gst / 100);
                        return sum + (isNaN(itemTotal) ? 0 : itemTotal);
                    }, 0);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(p.invoice_date)}</TableCell>
                        <TableCell>{p.invoice_no}</TableCell>
                        <TableCell>{p.party_name}</TableCell>
                        <TableCell>{(p.items || []).length}</TableCell>
                        <TableCell>₹{totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {canWrite && (
                            <Button variant="ghost" size="icon" onClick={() => onEdit(p)}><Edit className="h-4 w-4" /></Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteClick(p)}><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-8 text-muted-foreground">
                      No purchases found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WorkshopPurchaseList;
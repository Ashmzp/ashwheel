import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/utils/excel';
import { formatDate, isDateInRange } from '@/utils/dateUtils';
import { getPurchases } from '@/utils/storage';

const PurchaseList = ({ onAddPurchase, onEditPurchase, onDeletePurchase }) => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    const data = await getPurchases();
    setPurchases(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);
  
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    let filtered = purchases || [];
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.items && p.items.some(item => (item.chassis_no && item.chassis_no.toLowerCase().includes(searchTerm.toLowerCase())) || (item.engine_no && item.engine_no.toLowerCase().includes(searchTerm.toLowerCase()))))
      );
    }
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(p => isDateInRange(p.invoice_date, dateRange.start, dateRange.end));
    }
    setFilteredPurchases(filtered);
  }, [searchTerm, dateRange, purchases]);

  const handleDelete = async (purchaseId) => {
    if (window.confirm('Are you sure? This will also remove related items from stock.')) {
      try {
        await onDeletePurchase(purchaseId);
        await fetchPurchases();
        toast({ title: "Success", description: "Purchase deleted successfully!" });
      } catch (error) {
        toast({ title: "Error", description: `Failed to delete purchase. ${error.message}`, variant: "destructive" });
      }
    }
  };

  const handleExport = () => {
    const dataToExport = filteredPurchases.flatMap(p => 
      (p.items || []).map(item => ({
        'Party Name': p.party_name,
        'Invoice Date': formatDate(p.invoice_date),
        'Invoice Number': p.invoice_no,
        'Model Name': item.modelName,
        'Chassis Number': item.chassisNo,
        'Engine Number': item.engineNo,
        'Colour': item.colour,
        'HSN Code': item.hsn,
        'GST %': item.gst,
        'Price': item.price,
      }))
    );
    if(dataToExport.length > 0) {
      exportToExcel(dataToExport, 'purchases_report');
      toast({ title: "Success", description: "Data exported to Excel." });
    } else {
      toast({ title: "Info", description: "No data to export." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Purchase Management</h1>
        <Button onClick={onAddPurchase}><Plus className="w-4 h-4 mr-2" /> Add Purchase</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Invoice, Party, Chassis..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
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
                  <TableHead>Serial No</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading purchases...</TableCell></TableRow>
                ) : filteredPurchases.length > 0 ? filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.serial_no}</TableCell>
                    <TableCell>{formatDate(purchase.invoice_date)}</TableCell>
                    <TableCell>{purchase.invoice_no}</TableCell>
                    <TableCell>{purchase.party_name}</TableCell>
                    <TableCell>{purchase.items?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onEditPurchase(purchase)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(purchase.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No purchases found.</TableCell>
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

export default PurchaseList;
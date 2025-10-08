import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { searchWorkshopPurchasesForReturn } from '@/utils/db/workshopReturns';
import { supabase } from '@/lib/customSupabaseClient';
import { formatDate, getCurrentDate } from '@/utils/dateUtils';
import { PlusCircle, Search, Loader2, Download, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import debounce from 'debounce';
import { utils, writeFile } from 'xlsx';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const WpReturnPage = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentReturn, setCurrentReturn] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('workshop_purchase_returns').select('*');
    
    if (searchTerm) {
      query = query.or(`party_name.ilike.%${searchTerm}%,return_invoice_no.ilike.%${searchTerm}%`);
    }
    if (dateRange.start) {
      query = query.gte('return_date', dateRange.start);
    }
    if (dateRange.end) {
      query = query.lte('return_date', dateRange.end);
    }

    const { data, error } = await query.order('return_date', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching returns', description: error.message, variant: 'destructive' });
    } else {
      setReturns(data);
    }
    setIsLoading(false);
  }, [toast, searchTerm, dateRange]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleExport = () => {
    const worksheet = utils.json_to_sheet(returns.map(r => ({
      ...r,
      items: JSON.stringify(r.items)
    })));
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'WP Returns');
    writeFile(workbook, 'wp_returns.xlsx');
  };

  const handleEdit = (ret) => {
    setCurrentReturn(ret);
    setIsFormOpen(true);
  };
  
  const handleNew = () => {
    setCurrentReturn(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (returnId) => {
    if (!window.confirm("Are you sure you want to delete this return? This will add the items back to stock.")) return;
    
    const { error } = await supabase.rpc('manage_wp_return', {
        p_action: 'DELETE',
        p_payload: { id: returnId }
    });

    if (error) {
      toast({ title: 'Error deleting return', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Return deleted and stock updated.' });
      fetchReturns();
    }
  };

  return (
    <>
      <Helmet>
        <title>Workshop Purchase Return - Ashwheel</title>
        <meta name="description" content="Manage workshop purchase returns." />
      </Helmet>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">Workshop Purchase Return (WP Return)</CardTitle>
                <CardDescription>Manage returns of workshop purchases.</CardDescription>
              </div>
              <Button onClick={handleNew}><PlusCircle className="mr-2 h-4 w-4" /> New Return</Button>
            </div>
            <div className="mt-4 flex gap-4 items-center">
              <Input
                placeholder="Search by Party or Invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} />
              <Input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} />
              <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Return No.</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{formatDate(r.return_date)}</TableCell>
                      <TableCell>{r.return_invoice_no}</TableCell>
                      <TableCell>{r.party_name}</TableCell>
                      <TableCell>{r.reason}</TableCell>
                      <TableCell>{r.total_amount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis-vertical h-4 w-4"><path d="M12 12h.01"/><path d="M12 5h.01"/><path d="M12 19h.01"/></svg>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(r)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(r.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <WpReturnForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={fetchReturns} existingReturn={currentReturn} />
      </div>
    </>
  );
};

const WpReturnForm = ({ isOpen, onClose, onSave, existingReturn }) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  const [returnDate, setReturnDate] = useState(getCurrentDate());
  const [id, setId] = useState(null);

  useEffect(() => {
    if (existingReturn) {
      setId(existingReturn.id);
      setReturnDate(format(new Date(existingReturn.return_date), 'yyyy-MM-dd'));
      setReason(existingReturn.reason);
      setReturnItems(existingReturn.items.map(i => ({ ...i, partNo: i.partNo || i.part_no, partName: i.partName || i.part_name, purchaseRate: i.purchaseRate || i.rate, returnQty: i.qty })));
      setSelectedPurchase({ 
        id: existingReturn.original_purchase_id,
        invoice_no: 'N/A', // Not available directly, can be fetched if needed
        party_name: existingReturn.party_name,
        invoice_date: 'N/A'
      });
    } else {
        handleClose(true); // reset state without closing dialog
    }
  }, [existingReturn, isOpen]);

  const debouncedSearch = useCallback(debounce(async (term) => {
    if (term.length < 2 || existingReturn) return;
    setSearchResults(await searchWorkshopPurchasesForReturn(term));
  }, 300), [existingReturn]);

  useEffect(() => {
    debouncedSearch(search);
  }, [search, debouncedSearch]);

  const handleSelectPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setReturnItems(purchase.items.map(item => ({ ...item, partNo: item.partNo || item.part_no, partName: item.partName || item.part_name, purchaseRate: item.purchaseRate || item.rate, returnQty: 0 })));
    setSearchResults([]);
    setSearch('');
  };

  const handleQtyChange = (partNo, value) => {
    const qty = Number(value);
    setReturnItems(prev => prev.map(item => {
      if (item.partNo === partNo) {
        if (qty > item.qty && !existingReturn) {
          toast({ title: 'Invalid Quantity', description: 'Return quantity cannot exceed purchased quantity.', variant: 'destructive' });
          return { ...item, returnQty: item.qty };
        }
        return { ...item, returnQty: qty };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!reason || (!selectedPurchase && !existingReturn)) {
      toast({ title: 'Missing Information', description: 'Please select a purchase and provide a reason.', variant: 'destructive' });
      return;
    }
    const itemsToReturn = returnItems.filter(item => item.returnQty > 0);
    if (itemsToReturn.length === 0) {
      toast({ title: 'No Items to Return', description: 'Please specify quantity for at least one item.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const totalAmount = itemsToReturn.reduce((acc, item) => acc + ((item.purchaseRate || item.rate) * item.returnQty), 0);
      
      const returnData = {
        id: id,
        return_date: returnDate,
        original_purchase_id: selectedPurchase?.id,
        party_name: selectedPurchase?.party_name,
        items: itemsToReturn.map(i => ({...i, qty: i.returnQty, part_no: i.partNo, part_name: i.partName, rate: i.purchaseRate})),
        reason,
        total_amount: totalAmount,
      };

      const { error } = await supabase.rpc('manage_wp_return', {
          p_action: id ? 'UPDATE' : 'CREATE',
          p_payload: returnData
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Purchase return saved successfully.' });
      onSave();
      handleClose();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (isReset = false) => {
    setId(null);
    setSearch('');
    setSearchResults([]);
    setSelectedPurchase(null);
    setReturnItems([]);
    setReason('');
    setReturnDate(getCurrentDate());
    if(!isReset) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{id ? 'Edit' : 'New'} Workshop Purchase Return</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="return-date" className="text-right">Return Date</Label>
            <Input id="return-date" type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="col-span-3" />
          </div>
          {!id && <div className="grid grid-cols-4 items-center gap-4 relative">
            <Label htmlFor="search-purchase" className="text-right">Search Purchase</Label>
            <Input id="search-purchase" value={search} onChange={e => setSearch(e.target.value)} placeholder="Invoice No or Party Name" className="col-span-3" />
            {searchResults.length > 0 && (
              <Card className="absolute top-full left-1/4 w-3/4 mt-1 z-10 col-span-3">
                <CardContent className="p-2 max-h-60 overflow-y-auto">
                  {searchResults.map(p => (
                    <div key={p.id} onClick={() => handleSelectPurchase(p)} className="p-2 hover:bg-accent cursor-pointer rounded-md">
                      <p className="font-semibold">{p.invoice_no} - {p.party_name}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(p.invoice_date)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>}
          {(selectedPurchase || id) && (
            <>
              {selectedPurchase && <Card>
                <CardHeader><CardTitle>Selected Purchase Details</CardTitle></CardHeader>
                <CardContent>
                  <p><strong>Invoice No:</strong> {selectedPurchase.invoice_no}</p>
                  <p><strong>Party:</strong> {selectedPurchase.party_name}</p>
                  <p><strong>Date:</strong> {formatDate(selectedPurchase.invoice_date)}</p>
                </CardContent>
              </Card>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part No</TableHead>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Purchased/Sold Qty</TableHead>
                    <TableHead>Return Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnItems.map(item => (
                    <TableRow key={item.partNo || item.part_no}>
                      <TableCell>{item.partNo || item.part_no}</TableCell>
                      <TableCell>{item.partName || item.part_name}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>
                        <Input type="number" value={item.returnQty} onChange={e => handleQtyChange(item.partNo || item.part_no, e.target.value)} max={item.qty} min={0} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Reason</Label>
                <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} className="col-span-3" placeholder="Reason for return (mandatory)" />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WpReturnPage;
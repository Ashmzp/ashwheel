import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { searchInvoicesForReturn } from '@/utils/db';
import { formatDate } from '@/utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import useSalesReturnStore from '@/stores/salesReturnStore';
import { useAutosave } from '@/hooks/useAutosave';

const SalesReturnForm = ({ onSave, onCancel, existingReturn }) => {
    const formData = useSalesReturnStore(state => state);
    const { setFormData, resetForm } = useSalesReturnStore();

    useAutosave(useSalesReturnStore, 'sales-return-form-storage');

    const { toast } = useToast();
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if(existingReturn) {
             toast({title: "Editing not fully implemented", description: "Editing returns is complex."})
            onCancel();
        } else if (!formData.returnInvoiceNo) {
            setFormData({ returnInvoiceNo: `SR-${Date.now()}` });
        }
    }, [existingReturn, onCancel, toast, formData.returnInvoiceNo, setFormData]);
    
    const searchInvoices = useCallback(async (query) => {
        if (query.length < 3) {
            setFormData({ foundInvoices: [] });
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchInvoicesForReturn(query);
            setFormData({ foundInvoices: results });
        } catch (error) {
            toast({ title: "Search Error", description: "Could not perform search.", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    }, [toast, setFormData]);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setFormData({ searchQuery: query });
        
        clearTimeout(searchTimeoutRef.current);

        if (query.length > 2) {
            setIsSearching(true);
            searchTimeoutRef.current = setTimeout(() => {
                searchInvoices(query);
            }, 500);
        } else {
            setFormData({ foundInvoices: [] });
            setIsSearching(false);
        }
    };

    const handleSelectInvoice = (invoice, item) => {
        setFormData({
            selectedInvoice: invoice,
            selectedItems: [item],
            foundInvoices: [],
            searchQuery: item ? `${item.chassis_no} / ${item.engine_no}` : invoice.invoice_no
        });
    };

    const handleSubmit = async () => {
        if (!formData.selectedInvoice || formData.selectedItems.length === 0) {
            toast({ title: "Validation Error", description: "Please select an invoice and at least one item to return.", variant: "destructive" });
            return;
        }

        const totalRefundAmount = formData.selectedItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        
        const returnData = {
            id: existingReturn?.id || uuidv4(),
            return_invoice_no: formData.returnInvoiceNo,
            return_date: formData.returnDate,
            original_invoice_id: formData.selectedInvoice.id,
            customer_id: formData.selectedInvoice.customer_id,
            customer_name: formData.selectedInvoice.customer_name,
            items: formData.selectedItems,
            reason: formData.reason,
            total_refund_amount: totalRefundAmount,
        };
        await onSave(returnData);
        resetForm();
    };
    
    const handleCancelClick = () => {
        resetForm();
        onCancel();
    };

    const firstSelectedItem = formData.selectedItems[0];

    return (
        <Card>
            <CardHeader><CardTitle>{existingReturn ? 'Edit Sales Return' : 'Create Sales Return'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Return Invoice No</Label><Input value={formData.returnInvoiceNo} disabled /></div>
                    <div><Label>Return Date</Label><Input type="date" value={formData.returnDate} onChange={e => setFormData({ returnDate: e.target.value })} /></div>
                </div>

                 <div className="relative">
                    <Label>Search by Chassis No or Engine No</Label>
                    <div className="relative">
                        <Input 
                            placeholder="Start typing Chassis or Engine No..." 
                            value={formData.searchQuery}
                            onChange={handleSearchChange}
                        />
                        {isSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>
                    {formData.foundInvoices.length > 0 && (
                        <ul className="absolute z-10 w-full bg-background border rounded-md mt-1 max-h-60 overflow-y-auto">
                           {formData.foundInvoices.map(({ invoice, item }) => (
                                <li key={item.chassis_no} className="p-2 hover:bg-accent cursor-pointer" onClick={() => handleSelectInvoice(invoice, item)}>
                                    <p className="font-semibold">{item.chassis_no} / {item.engine_no}</p>
                                    <p className="text-sm text-muted-foreground">{invoice.customer_name} - Inv: {invoice.invoice_no}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                {formData.selectedInvoice && firstSelectedItem && (
                    <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div><Label>Party Name</Label><Input value={formData.selectedInvoice.customer_name} disabled/></div>
                           <div><Label>Invoice No</Label><Input value={formData.selectedInvoice.invoice_no} disabled/></div>
                           <div><Label>Invoice Date</Label><Input value={formatDate(formData.selectedInvoice.invoice_date)} disabled/></div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Vehicle Details</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Model Name</TableHead>
                                        <TableHead>Chassis No</TableHead>
                                        <TableHead>Engine No</TableHead>
                                        <TableHead>Colour</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>{firstSelectedItem.model_name}</TableCell>
                                        <TableCell>{firstSelectedItem.chassis_no}</TableCell>
                                        <TableCell>{firstSelectedItem.engine_no}</TableCell>
                                        <TableCell>{firstSelectedItem.colour}</TableCell>
                                        <TableCell>₹{parseFloat(firstSelectedItem.price || 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <div>
                    <Label>Reason for Return (Optional)</Label>
                    <Input value={formData.reason} onChange={e => setFormData({ reason: e.target.value })} />
                </div>
                
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancelClick}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!formData.selectedInvoice || formData.selectedItems.length === 0}>Save Return</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default SalesReturnForm;
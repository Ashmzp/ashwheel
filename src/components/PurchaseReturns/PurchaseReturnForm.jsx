import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { searchPurchasesForReturn } from '@/utils/db';
import { formatDate } from '@/utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from "@/components/ui/checkbox";
import usePurchaseReturnStore from '@/stores/purchaseReturnStore';
import { useAutosave } from '@/hooks/useAutosave';

const PurchaseReturnForm = ({ onSave, onCancel, existingReturn }) => {
    const formData = usePurchaseReturnStore(state => state);
    const { setFormData, resetForm } = usePurchaseReturnStore();
    
    useAutosave(usePurchaseReturnStore, 'purchase-return-form-storage');

    const { toast } = useToast();
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if(existingReturn) {
             toast({title: "Editing not fully implemented", description: "Editing returns is complex."})
            onCancel();
        } else if (!formData.returnInvoiceNo) {
            setFormData({ returnInvoiceNo: `PR-${Date.now()}` });
        }
    }, [existingReturn, onCancel, toast, formData.returnInvoiceNo, setFormData]);
    
    const searchPurchases = useCallback(async (query) => {
        if (query.length < 3) {
            setFormData({ foundPurchases: [] });
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchPurchasesForReturn(query);
            setFormData({ foundPurchases: results });
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
                searchPurchases(query);
            }, 500);
        } else {
            setFormData({ foundPurchases: [] });
            setIsSearching(false);
        }
    };

    const handleSelectPurchase = (purchase) => {
        setFormData({
            selectedPurchase: purchase,
            selectedItems: [],
            foundPurchases: [],
            searchQuery: purchase.items[0] ? `${purchase.items[0].chassisNo} / ${purchase.items[0].engineNo}` : purchase.invoice_no
        });
    };

    const handleItemToggle = (item) => {
        const isSelected = (Array.isArray(formData.selectedItems) ? formData.selectedItems : []).some(i => i.chassisNo === item.chassisNo);
        let newSelectedItems;
        if (isSelected) {
            newSelectedItems = (Array.isArray(formData.selectedItems) ? formData.selectedItems : []).filter(i => i.chassisNo !== item.chassisNo);
        } else {
            newSelectedItems = [...(Array.isArray(formData.selectedItems) ? formData.selectedItems : []), item];
        }
        setFormData({ selectedItems: newSelectedItems });
    };

    const handleSubmit = async () => {
        if (!formData.selectedPurchase || formData.selectedItems.length === 0) {
            toast({ title: "Validation Error", description: "Please select a purchase and at least one item to return.", variant: "destructive" });
            return;
        }

        const totalAmount = formData.selectedItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        
        const returnData = {
            id: existingReturn?.id || uuidv4(),
            return_invoice_no: formData.returnInvoiceNo,
            return_date: formData.returnDate,
            original_purchase_id: formData.selectedPurchase.id,
            party_name: formData.selectedPurchase.party_name,
            items: formData.selectedItems,
            reason: formData.reason,
            total_amount: totalAmount,
        };
        await onSave(returnData);
        resetForm();
    };
    
    const handleCancelClick = () => {
        resetForm();
        onCancel();
    };

    return (
        <Card>
            <CardHeader><CardTitle>{existingReturn ? 'Edit Purchase Return' : 'Create Purchase Return'}</CardTitle></CardHeader>
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
                    {formData.foundPurchases.length > 0 && (
                        <ul className="absolute z-10 w-full bg-background border rounded-md mt-1 max-h-60 overflow-y-auto">
                            {formData.foundPurchases.map(p => (
                                <li key={p.id} className="p-2 hover:bg-accent cursor-pointer" onClick={() => handleSelectPurchase(p)}>
                                    <p className="font-semibold">{p.items[0]?.chassisNo} / {p.items[0]?.engineNo}</p>
                                    <p className="text-sm text-muted-foreground">{p.party_name} - Inv: {p.invoice_no}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                {formData.selectedPurchase && (
                    <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div><Label>Party Name</Label><Input value={formData.selectedPurchase.party_name} disabled/></div>
                           <div><Label>Invoice No</Label><Input value={formData.selectedPurchase.invoice_no} disabled/></div>
                           <div><Label>Invoice Date</Label><Input value={formatDate(formData.selectedPurchase.invoice_date)} disabled/></div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Vehicle Details</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Return</TableHead>
                                        <TableHead>Model Name</TableHead>
                                        <TableHead>Chassis No</TableHead>
                                        <TableHead>Engine No</TableHead>
                                        <TableHead>Colour</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(Array.isArray(formData.selectedPurchase.items) ? formData.selectedPurchase.items : []).map(item => (
                                        <TableRow key={item.chassisNo}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={(Array.isArray(formData.selectedItems) ? formData.selectedItems : []).some(i => i.chassisNo === item.chassisNo)} 
                                                    onCheckedChange={() => handleItemToggle(item)} 
                                                />
                                            </TableCell>
                                            <TableCell>{item.modelName}</TableCell>
                                            <TableCell>{item.chassisNo}</TableCell>
                                            <TableCell>{item.engineNo}</TableCell>
                                            <TableCell>{item.colour}</TableCell>
                                            <TableCell>₹{parseFloat(item.price || 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
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
                    <Button onClick={handleSubmit} disabled={!formData.selectedPurchase || formData.selectedItems.length === 0}>Save Return</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default PurchaseReturnForm;
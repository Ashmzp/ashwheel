import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Download, Upload } from 'lucide-react';
import { validateRequired } from '@/utils/validation';
import { getCustomers } from '@/utils/db/customers';
import { getPurchases } from '@/utils/db/purchases';
import { parseExcelData } from '@/utils/excel';
import PurchaseItemsTable from './PurchaseItemsTable';
import usePurchaseStore from '@/stores/purchaseStore';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';

const PurchaseForm = ({ onSave, onCancel }) => {
  const { id, created_at, serial_no, invoiceDate, invoiceNo, partyName, items } = usePurchaseStore();
  const { setFormData, setItems: setItemsInStore, addItem } = usePurchaseStore();
  const { user } = useAuth();
  
  const [partyNameSearch, setPartyNameSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', partyNameSearch],
    queryFn: () => getCustomers({ searchTerm: partyNameSearch, pageSize: 10 }).then(res => res.data),
    enabled: !!partyNameSearch && showSuggestions,
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    setPartyNameSearch(partyName || '');
  }, [partyName]);

  const getNextSerialNo = useCallback(async () => {
    if (id) return; 
    const { data, error } = await supabase
      .from('purchases')
      .select('serial_no')
      .eq('user_id', user.id)
      .order('serial_no', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') { 
      console.error('Error fetching last serial number:', error);
      setFormData({ serial_no: 1 });
      return;
    }
    const nextSerial = data && data.length > 0 ? (data[0].serial_no || 0) + 1 : 1;
    setFormData({ serial_no: nextSerial });
  }, [setFormData, user.id, id]);

  useEffect(() => {
    getNextSerialNo();
  }, [getNextSerialNo]);

  const handlePartyNameChange = (e) => {
    const term = e.target.value;
    setPartyNameSearch(term);
    setShowSuggestions(true);
    setFormData({ partyName: term });
  };

  const handleCustomerSelect = (customer) => {
    setPartyNameSearch(customer.customer_name);
    setFormData({ partyName: customer.customer_name });
    setShowSuggestions(false);
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const importedData = await parseExcelData(file);
      
      const { data: purchasesResult } = await getPurchases({pageSize: 10000});
      const allChassisNos = purchasesResult.flatMap(p => (p.items || []).map(item => item.chassisNo.toUpperCase()));

      let newItemsCount = 0;
      importedData.forEach((row, index) => {
        const chassisNo = (row['Chassis No'] || row['Chassis Number'] || '').toString().toUpperCase();
        if (chassisNo && !allChassisNos.includes(chassisNo) && !items.some(i => i.chassisNo === chassisNo)) {
          addItem({
            id: Date.now().toString() + index,
            modelName: row['Model Name'] || '',
            chassisNo: chassisNo,
            engineNo: (row['Engine No'] || row['Engine Number'] || '').toString().toUpperCase(),
            colour: row['Colour'] || '',
            hsn: row['HSN'] || null,
            gst: row['GST'] || null,
            price: row['Price'] || '0',
            category: row['Category'] || null,
          });
          newItemsCount++;
        }
      });


      if (newItemsCount > 0) {
        toast({ title: "Import Successful", description: `${newItemsCount} items imported.` });
      } else {
        toast({ title: "Import Info", description: "No new valid items found to import.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Import Error", description: `Failed to parse file. ${error.message}`, variant: "destructive" });
    } finally {
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = 'Model Name,Chassis Number,Engine Number,Colour,Price,HSN,GST,Category\nExample Model,ABC123,ENG123,Red,100000,87112019,28,Scooter';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'purchase_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateForm = async () => {
    const newErrors = {};
    if (!validateRequired(invoiceDate)) newErrors.invoiceDate = 'Invoice date is required';
    if (!validateRequired(invoiceNo)) newErrors.invoiceNo = 'Invoice number is required';
    if (!validateRequired(partyName)) newErrors.partyName = 'Party name is required';
    if (!items || items.length === 0) newErrors.items = 'At least one item is required';
    
    if (validateRequired(invoiceNo) && !id) {
        const { data: existingPurchases, error } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('invoice_no', invoiceNo);

        if (error) {
            console.error("Error checking for existing invoice:", error);
        } else if (existingPurchases && existingPurchases.length > 0) {
            newErrors.invoiceNo = 'This invoice number already exists for you.';
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await validateForm())) {
      toast({ title: "Validation Error", description: "Please fill all required fields and correct the errors.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const purchaseData = {
        id: id || crypto.randomUUID(),
        serial_no,
        invoiceDate,
        invoiceNo,
        partyName,
        items,
        created_at: created_at || new Date().toISOString(),
      };
      await onSave(purchaseData);
    } catch (error) {
      toast({ title: "Error", description: `Failed to save purchase. ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit Purchase' : 'Add New Purchase'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="serialNo">Serial No</Label>
                <Input id="serialNo" value={serial_no || ''} disabled />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(e) => setFormData({ invoiceDate: e.target.value })} className={errors.invoiceDate ? 'border-red-500' : ''} />
                {errors.invoiceDate && <p className="text-red-500 text-sm mt-1">{errors.invoiceDate}</p>}
              </div>
              <div>
                <Label htmlFor="invoiceNo">Invoice No *</Label>
                <Input id="invoiceNo" value={invoiceNo} onChange={(e) => setFormData({ invoiceNo: e.target.value })} className={errors.invoiceNo ? 'border-red-500' : ''} />
                {errors.invoiceNo && <p className="text-red-500 text-sm mt-1">{errors.invoiceNo}</p>}
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="partyName">Party Name *</Label>
              <Input 
                id="partyName" 
                value={partyNameSearch} 
                onChange={handlePartyNameChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
                className={errors.partyName ? 'border-red-500' : ''} 
              />
              {errors.partyName && <p className="text-red-500 text-sm mt-1">{errors.partyName}</p>}
              {showSuggestions && customers.length > 0 && (
                <motion.ul 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full bg-secondary border border-border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg"
                >
                  {customers.map(c => (
                    <li 
                      key={c.id} 
                      className="px-3 py-2 cursor-pointer hover:bg-accent"
                      onMouseDown={() => handleCustomerSelect(c)}
                    >
                      <p className="font-semibold">{c.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{c.mobile1}</p>
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Items</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" /> Template</Button>
                  <Button type="button" variant="outline" asChild><label htmlFor="excel-upload" className="cursor-pointer flex items-center"><Upload className="w-4 h-4 mr-2" /> Import Excel</label></Button>
                  <input type="file" id="excel-upload" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleExcelImport} className="hidden" />
                </div>
              </div>
              <PurchaseItemsTable />
              {errors.items && <p className="text-red-500 text-sm mt-1">{errors.items}</p>}
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (id ? 'Update Purchase' : 'Save Purchase')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PurchaseForm;
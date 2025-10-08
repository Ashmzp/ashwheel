
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

const PurchaseForm = ({ onSave, onCancel }) => {
  const formData = usePurchaseStore((state) => state);
  const { setFormData, setItems } = usePurchaseStore();
  const { user } = useAuth();
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [partyNameSearch, setPartyNameSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchTimeout = useRef(null);

  useEffect(() => {
    setPartyNameSearch(formData.partyName || '');
  }, [formData.partyName]);

  const getNextSerialNo = useCallback(async () => {
    if (formData.id) return; // Don't fetch for existing purchases
    const { data, error } = await supabase
      .from('purchases')
      .select('serial_no')
      .eq('user_id', user.id)
      .order('serial_no', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
      console.error('Error fetching last serial number:', error);
      setFormData({ serial_no: 1 });
      return;
    }
    const nextSerial = data && data.length > 0 ? (data[0].serial_no || 0) + 1 : 1;
    setFormData({ serial_no: nextSerial });
  }, [setFormData, user.id, formData.id]);

  useEffect(() => {
    getNextSerialNo();
  }, [getNextSerialNo]);

  const fetchCustomers = useCallback(async (searchTerm) => {
    if (!searchTerm) {
        setCustomers([]);
        return;
    };
    try {
      const { data } = await getCustomers({ searchTerm });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
        toast({ title: "Error fetching customers", description: error.message, variant: "destructive" });
    }
  }, [toast]);
  
  const filteredCustomers = useMemo(() => {
    if (!partyNameSearch) return [];
    const searchTerm = partyNameSearch.toLowerCase();
    return customers.filter(c => 
      c.customer_name.toLowerCase().includes(searchTerm) || 
      (c.mobile1 && c.mobile1.includes(searchTerm))
    );
  }, [partyNameSearch, customers]);

  const handlePartyNameChange = (e) => {
    const term = e.target.value;
    setPartyNameSearch(term);
    setShowSuggestions(true);
    setSelectedCustomer(null);
    setFormData({ partyName: term });
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
        fetchCustomers(term);
    }, 300);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
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
      const purchases = Array.isArray(purchasesResult) ? purchasesResult : [];
      const allChassisNos = purchases.flatMap(p => (p.items || []).map(item => item.chassisNo));

      const newItems = importedData.map((row, index) => ({
        id: Date.now().toString() + index,
        modelName: row['Model Name'] || '',
        chassisNo: (row['Chassis No'] || row['Chassis Number'] || '').toString().toUpperCase(),
        engineNo: (row['Engine No'] || row['Engine Number'] || '').toString().toUpperCase(),
        colour: row['Colour'] || '',
        hsn: row['HSN'] || null,
        gst: row['GST'] || null,
        price: row['Price'] || '0',
        category: row['Category'] || null,
      })).filter(item => item.chassisNo && !allChassisNos.includes(item.chassisNo) && !formData.items.some(i => i.chassisNo === item.chassisNo));

      if (newItems.length > 0) {
        setItems([...formData.items, ...newItems]);
        toast({ title: "Import Successful", description: `${newItems.length} items imported.` });
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
    if (!validateRequired(formData.invoiceDate)) newErrors.invoiceDate = 'Invoice date is required';
    if (!validateRequired(formData.invoiceNo)) newErrors.invoiceNo = 'Invoice number is required';
    if (!validateRequired(formData.partyName)) newErrors.partyName = 'Party name is required';
    if (!formData.items || formData.items.length === 0) newErrors.items = 'At least one item is required';
    
    if (validateRequired(formData.invoiceNo) && !formData.id) {
        const { data: existingPurchases, error } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('invoice_no', formData.invoiceNo);

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
        ...formData,
        id: formData.id || crypto.randomUUID(),
        serial_no: formData.serial_no,
        created_at: formData.created_at || new Date().toISOString(),
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
          <CardTitle>{formData.id ? 'Edit Purchase' : 'Add New Purchase'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="serialNo">Serial No</Label>
                <Input id="serialNo" value={formData.serial_no || ''} disabled />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input id="invoiceDate" type="date" value={formData.invoiceDate} onChange={(e) => setFormData({ invoiceDate: e.target.value })} className={errors.invoiceDate ? 'border-red-500' : ''} />
                {errors.invoiceDate && <p className="text-red-500 text-sm mt-1">{errors.invoiceDate}</p>}
              </div>
              <div>
                <Label htmlFor="invoiceNo">Invoice No *</Label>
                <Input id="invoiceNo" value={formData.invoiceNo} onChange={(e) => setFormData({ invoiceNo: e.target.value })} className={errors.invoiceNo ? 'border-red-500' : ''} />
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
              {showSuggestions && filteredCustomers.length > 0 && (
                <motion.ul 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full bg-secondary border border-border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg"
                >
                  {filteredCustomers.map(c => (
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

            {selectedCustomer && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-accent/50 rounded-lg">
                <h4 className="font-semibold mb-2 text-primary-foreground">{selectedCustomer.customer_name}</h4>
                <p className="text-sm">Mobile: {selectedCustomer.mobile1} | Address: {selectedCustomer.address} | GST: {selectedCustomer.gst || 'N/A'}</p>
              </motion.div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Items</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" /> Template</Button>
                  <Button type="button" variant="outline" asChild><label htmlFor="excel-upload" className="cursor-pointer flex items-center"><Upload className="w-4 h-4 mr-2" /> Import Excel</label></Button>
                  <input type="file" id="excel-upload" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleExcelImport} className="hidden" />
                </div>
              </div>
              <PurchaseItemsTable items={formData.items} setItems={(newItems) => setFormData({ items: newItems })} />
              {errors.items && <p className="text-red-500 text-sm mt-1">{errors.items}</p>}
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (formData.id ? 'Update Purchase' : 'Save Purchase')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PurchaseForm;

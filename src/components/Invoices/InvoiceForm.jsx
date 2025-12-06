import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, PlusCircle } from 'lucide-react';
import { getCustomers, getStock, getNextInvoiceNo, saveCustomer, getSettings, addStock as addStockToDb } from '@/utils/db/index.js';
import { getCurrentDate } from '@/utils/dateUtils';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoicePreview from './InvoicePreview';
import { v4 as uuidv4 } from 'uuid';
import CustomerForm from '@/components/Customers/CustomerForm';

const InvoiceForm = ({ invoice, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: invoice?.id || uuidv4(),
    invoice_date: invoice?.invoice_date || getCurrentDate(),
    invoice_no: invoice?.invoice_no || '',
    customer_name: invoice?.customer_name || '',
    customer_type: invoice?.customer_type || 'non-registered',
    items: invoice?.items || [],
    custom_field_values: invoice?.custom_field_values || {},
    extra_charges: invoice?.extra_charges || { Registration: 0, Insurance: 0, Accessories: 0 },
    total_amount: invoice?.total_amount || 0,
  });
  const [customers, setCustomers] = useState([]);
  const [stock, setStock] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [settings, setSettings] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const { toast } = useToast();

  const generateInvoiceNo = useCallback(async (isRegistered, date) => {
    if (invoice) return; // Don't generate new number for existing invoice
    const invoiceNo = await getNextInvoiceNo(isRegistered ? 'registered' : 'non_registered', date);
    setFormData(prev => ({ ...prev, invoice_no: invoiceNo }));
  }, [invoice]);
  
  const refreshData = useCallback(async () => {
    const [customerResult, stockData, settingsData] = await Promise.all([
      getCustomers({}),
      getStock(),
      getSettings()
    ]);
    setCustomers(Array.isArray(customerResult.data) ? customerResult.data : []);
    setStock(Array.isArray(stockData) ? stockData : []);
    setSettings(settingsData);
    
    if (invoice && Array.isArray(customerResult.data)) {
      const customer = customerResult.data.find(c => c.customer_name === invoice.customer_name);
      setSelectedCustomer(customer);
      setCustomerSearch(invoice.customer_name);
    }
  }, [invoice]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!invoice && !formData.invoice_no && settings) {
        generateInvoiceNo(false, new Date(formData.invoice_date));
    }
  }, [settings, invoice, formData.invoice_no, generateInvoiceNo, formData.invoice_date]);
  
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    const searchTerm = customerSearch.toLowerCase();
    return customers.filter(c => c.customer_name.toLowerCase().includes(searchTerm) || (c.mobile1 && c.mobile1.includes(searchTerm)));
  }, [customerSearch, customers]);

  const handleCustomerSearchChange = (e) => {
    setCustomerSearch(e.target.value);
    setShowSuggestions(true);
    setSelectedCustomer(null);
    setFormData(prev => ({ ...prev, customer_name: e.target.value, customer_type: 'non-registered' }));
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.customer_name);
    const isRegistered = !!customer.gst;
    setFormData(prev => ({ ...prev, customer_name: customer.customer_name, customer_type: isRegistered ? 'registered' : 'non-registered' }));
    generateInvoiceNo(isRegistered, new Date(formData.invoice_date));
    setShowSuggestions(false);
  };
  
  useEffect(() => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    const extraTotal = Object.values(formData.extra_charges || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    setFormData(prev => ({...prev, total_amount: itemsTotal + extraTotal}));
  }, [formData.items, formData.extra_charges]);

  const handleItemRemove = async (itemToRemove) => {
    if (invoice) { // Only add back to stock if editing an existing invoice
      try {
        await addStockToDb([itemToRemove]);
        toast({ title: 'Stock Restored', description: `Item ${itemToRemove.chassis_no} has been added back to stock.` });
      } catch (error) {
        toast({ title: 'Error', description: `Failed to restore item to stock: ${error.message}`, variant: 'destructive' });
        return; // Prevent removing from form if DB operation fails
      }
    }
    setFormData(p => ({ ...p, items: p.items.filter(item => item.chassis_no !== itemToRemove.chassis_no) }));
  };

  const fetchSettings = useCallback(async () => {
    const settingsData = await getSettings();
    setSettings(settingsData);
    setLoadingSettings(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const nonRegFieldsConfig = useMemo(() => settings?.nonRegFields || {}, [settings]);
  
  const activeNonRegFields = useMemo(() => {
    return Object.entries(nonRegFieldsConfig)
      .filter(([key, value]) => value.enabled)
      .map(([key]) => key);
  }, [nonRegFieldsConfig]);

  useEffect(() => {
    let newErrors = { ...errors };
    if (formData.customerType === 'non-registered') {
      activeNonRegFields.forEach(field => {
        if (nonRegFieldsConfig[field].mandatory && !formData.custom_field_values?.[field]) {
          newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required.`;
        } else {
          delete newErrors[field];
        }
      });
    } else {
      activeNonRegFields.forEach(field => delete newErrors[field]);
    }
    setErrors(newErrors);
  }, [formData.customerType, formData.custom_field_values, nonRegFieldsConfig, activeNonRegFields]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customer_name || !selectedCustomer) newErrors.customer_name = "Please select an existing customer or add a new one.";
    if (formData.items.length === 0) newErrors.items = "At least one item must be added to the invoice.";
    
    if (selectedCustomer && !selectedCustomer.gst) {
        Object.entries(settings.nonRegFields || {}).forEach(([key, val]) => {
            if(val.enabled && val.mandatory && !formData.custom_field_values?.[key]) {
                newErrors[key] = `${key} is mandatory.`;
            }
        });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fill all required fields correctly.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  const handleCustomFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      custom_field_values: {
        ...prev.custom_field_values,
        [field]: value
      }
    }));
  };

  const handleNewCustomerSave = async (customerData) => {
      await saveCustomer(customerData);
      toast({title: "Customer created", description: "You can now select the new customer."});
      setShowCustomerForm(false);
      await refreshData();
      handleCustomerSelect(customerData);
  }

  if (!settings) {
    return <div>Loading form...</div>;
  }
  
  if (showCustomerForm) {
      return (
          <div className="p-8">
              <CustomerForm onSave={handleNewCustomerSave} onCancel={() => setShowCustomerForm(false)} />
          </div>
      )
  }

  if (showPreview) {
    return <InvoicePreview formData={formData} customer={selectedCustomer} settings={settings} onBack={() => setShowPreview(false)} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
            <Button variant="outline" onClick={() => setShowPreview(true)} disabled={formData.items.length === 0}><Eye className="w-4 h-4 mr-2" /> Preview</Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Invoice No</Label><Input value={formData.invoice_no} disabled /></div>
              <div><Label>Invoice Date</Label><Input type="date" value={formData.invoice_date} onChange={e => {
                setFormData(p => ({...p, invoice_date: e.target.value}));
                if(!invoice){
                    generateInvoiceNo(formData.customer_type === 'registered', new Date(e.target.value));
                }
              }} /></div>
              <div className="relative">
                <Label>Party Name *</Label>
                <div className="flex gap-2">
                    <Input 
                      value={customerSearch} 
                      onChange={handleCustomerSearchChange}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      autoComplete="off"
                      className={errors.customer_name ? 'border-red-500' : ''}
                    />
                    <Button type="button" variant="outline" onClick={() => setShowCustomerForm(true)}><PlusCircle className="w-4 h-4" /></Button>
                </div>
                {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
                {showSuggestions && filteredCustomers.length > 0 && (
                  <motion.ul initial={{opacity: 0}} animate={{opacity: 1}} className="absolute z-10 w-full bg-secondary border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {filteredCustomers.map(c => (
                      <li key={c.id} className="p-2 cursor-pointer hover:bg-accent" onMouseDown={() => handleCustomerSelect(c)}>
                        {c.customer_name} ({c.mobile1})
                      </li>
                    ))}
                  </motion.ul>
                )}
              </div>
            </div>
            
            {selectedCustomer && (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-4 bg-accent/50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-primary-foreground">{selectedCustomer.customer_name}</h4>
                    <p className="text-sm">Mobile: {selectedCustomer.mobile1} | Address: {selectedCustomer.address} | GST: {selectedCustomer.gst || 'N/A'}</p>
                 </motion.div>
            )}

            {selectedCustomer && !selectedCustomer.gst && (
              <Card>
                <CardHeader><CardTitle className="text-base">Additional Details (Non-Registered)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeNonRegFields.includes('adharNo') && (
                    <div>
                      <Label>Aadhar No {nonRegFieldsConfig.adharNo.mandatory && '*'}</Label>
                      <Input value={formData.custom_field_values?.adharNo || ''} onChange={(e) => handleCustomFieldChange('adharNo', e.target.value)} />
                      {errors.adharNo && <p className="text-red-500 text-sm mt-1">{errors.adharNo}</p>}
                    </div>
                  )}
                  {activeNonRegFields.includes('nomineeName') && (
                    <div>
                      <Label>Nominee Name {nonRegFieldsConfig.nomineeName.mandatory && '*'}</Label>
                      <Input value={formData.custom_field_values?.nomineeName || ''} onChange={(e) => handleCustomFieldChange('nomineeName', e.target.value)} />
                      {errors.nomineeName && <p className="text-red-500 text-sm mt-1">{errors.nomineeName}</p>}
                    </div>
                  )}
                  {activeNonRegFields.includes('hypothecation') && (
                    <div>
                      <Label>Hypothecation {nonRegFieldsConfig.hypothecation.mandatory && '*'}</Label>
                      <Input value={formData.custom_field_values?.hypothecation || ''} onChange={(e) => handleCustomFieldChange('hypothecation', e.target.value)} />
                      {errors.hypothecation && <p className="text-red-500 text-sm mt-1">{errors.hypothecation}</p>}
                    </div>
                  )}
                  {activeNonRegFields.includes('rto') && (
                    <div>
                      <Label>RTO {nonRegFieldsConfig.rto.mandatory && '*'}</Label>
                      <Input value={formData.custom_field_values?.rto || ''} onChange={(e) => handleCustomFieldChange('rto', e.target.value)} />
                      {errors.rto && <p className="text-red-500 text-sm mt-1">{errors.rto}</p>}
                    </div>
                  )}
                  {activeNonRegFields.includes('emailId') && (
                    <div>
                      <Label>Email ID {nonRegFieldsConfig.emailId.mandatory && '*'}</Label>
                      <Input value={formData.custom_field_values?.emailId || ''} onChange={(e) => handleCustomFieldChange('emailId', e.target.value)} />
                      {errors.emailId && <p className="text-red-500 text-sm mt-1">{errors.emailId}</p>}
                    </div>
                  )}
                  {activeNonRegFields.includes('salesPerson') && (
                    <div>
                      <Label>Sales Person {nonRegFieldsConfig.salesPerson.mandatory && '*'}</Label>
                      <Input value={formData.custom_field_values?.salesPerson || ''} onChange={(e) => handleCustomFieldChange('salesPerson', e.target.value)} />
                      {errors.salesPerson && <p className="text-red-500 text-sm mt-1">{errors.salesPerson}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Items</h3>
              <InvoiceItemsTable
                items={formData.items}
                setItems={newItems => setFormData(p => ({ ...p, items: newItems }))}
                stock={stock}
                onItemRemove={handleItemRemove}
              />
              {errors.items && <p className="text-red-500 text-sm mt-1">{errors.items}</p>}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Extra Charges</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Registration</Label>
                  <Input type="number" value={formData.extra_charges?.Registration || 0} onChange={(e) => setFormData(p => ({...p, extra_charges: {...p.extra_charges, Registration: e.target.value}}))} />
                </div>
                <div>
                  <Label>Insurance</Label>
                  <Input type="number" value={formData.extra_charges?.Insurance || 0} onChange={(e) => setFormData(p => ({...p, extra_charges: {...p.extra_charges, Insurance: e.target.value}}))} />
                </div>
                <div>
                  <Label>Accessories</Label>
                  <Input type="number" value={formData.extra_charges?.Accessories || 0} onChange={(e) => setFormData(p => ({...p, extra_charges: {...p.extra_charges, Accessories: e.target.value}}))} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <div className="text-xl font-bold">Total: ₹{formData.total_amount.toFixed(2)}</div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InvoiceForm;
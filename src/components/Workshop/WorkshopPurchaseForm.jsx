import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Plus, Trash2, UserPlus, Building2, Phone, MapPin, Download } from 'lucide-react';
import { getCustomers, saveCustomer } from '@/utils/storage';
import { parseExcelData, exportToExcel } from '@/utils/excel';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CustomerForm from '@/components/Customers/CustomerForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useWorkshopPurchaseStore from '@/stores/workshopPurchaseStore';
import useSettingsStore from '@/stores/settingsStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultWorkshopPurchaseColumns = [
    { id: 'partNo', label: 'Part No.', type: 'default', deletable: false, editable: true },
    { id: 'partName', label: 'Part Name', type: 'default', deletable: false, editable: true },
    { id: 'hsn', label: 'HSN', type: 'default', deletable: false, editable: true },
    { id: 'purchaseRate', label: 'Purchase Rate', type: 'default', deletable: false, editable: true },
    { id: 'qty', label: 'Qty', type: 'default', deletable: false, editable: true },
    { id: 'uom', label: 'UOM', type: 'default', deletable: false, editable: true },
    { id: 'saleRate', label: 'Sale Rate', type: 'default', deletable: false, editable: true },
    { id: 'gst', label: 'GST(%)', type: 'default', deletable: false, editable: true },
    { id: 'total', label: 'Total', type: 'default', deletable: false, editable: false },
    { id: 'category', label: 'Category', type: 'default', deletable: false, editable: true },
];

const WorkshopPurchaseForm = ({ isEditing, onSave, onCancel }) => {
  const formData = useWorkshopPurchaseStore(state => state);
  const { setFormData, addItem, updateItem, removeItem, setItems } = useWorkshopPurchaseStore();
  const { settings } = useSettingsStore();
  const workshopSettings = settings.workshop_settings || {};

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [partySearch, setPartySearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [editablePreview, setEditablePreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);

  const { toast } = useToast();

  const purchaseColumns = useMemo(() => {
    const savedColumns = workshopSettings.workshop_purchase_columns;
    let columns = (savedColumns && Array.isArray(savedColumns) && savedColumns.length > 0)
        ? savedColumns
        : defaultWorkshopPurchaseColumns;
    
    if (!workshopSettings.enable_uom) {
        columns = columns.filter(col => col.id !== 'uom');
    }
    
    return columns;
  }, [workshopSettings.workshop_purchase_columns, workshopSettings.enable_uom]);

  const fetchInitialData = useCallback(async () => {
    try {
      const customerData = await getCustomers({pageSize: 99999});
      setCustomers(Array.isArray(customerData.data) ? customerData.data : []);
    } catch (error) {
        toast({ title: 'Error fetching data', description: error.message, variant: 'destructive'});
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    setPartySearch(formData.partyName || '');
  }, [formData.partyName]);

  const filteredCustomers = useMemo(() => {
    if (!partySearch) return [];
    const term = partySearch.toLowerCase();
    return customers.filter(
      (c) =>
        (c.customer_name && c.customer_name.toLowerCase().includes(term)) ||
        (c.mobile1 && c.mobile1.includes(term))
    );
  }, [partySearch, customers]);

  const handlePartySearch = (e) => {
    const term = e.target.value;
    setPartySearch(term);
    setSelectedCustomer(null);
    setFormData({ partyName: term });
    if (term) setShowCustomerList(true);
    else setShowCustomerList(false);
  };

  const selectParty = (customer) => {
    setSelectedCustomer(customer);
    setPartySearch(customer.customer_name);
    setFormData({ partyName: customer.customer_name });
    setShowCustomerList(false);
  };
  
  const handleSaveNewCustomer = async (newCustomerData) => {
    try {
      const savedCustomer = await saveCustomer(newCustomerData);
      toast({ title: 'Customer Saved!', description: 'New customer has been added successfully.' });
      setIsCustomerFormOpen(false);
      await fetchInitialData();
      selectParty(savedCustomer);
    } catch (error) {
      toast({ title: 'Error', description: `Failed to save customer: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [{}];
    purchaseColumns.forEach(col => {
        if (col.id !== 'total' && col.id !== 'actions') {
            templateData[0][col.label] = '';
        }
    });
    templateData[0]['Part No.'] = 'ExamplePart123';
    templateData[0]['Part Name'] = 'Example Part Name';
    templateData[0]['Qty'] = 10;

    try {
      exportToExcel(templateData, 'Workshop_Purchase_Template');
      toast({ title: 'Template Downloaded', description: 'Please fill the template and import it.' });
    } catch (error) {
      toast({ title: 'Download Error', description: 'Could not download the template.', variant: 'destructive' });
    }
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const importedData = await parseExcelData(file);
      if (importedData.length > 5000) {
        toast({ title: 'Import Limit Exceeded', description: 'You can import a maximum of 5000 rows at a time.', variant: 'destructive' });
        return;
      }
      const previewData = importedData.map((row) => {
        const item = { id: uuidv4() };
        purchaseColumns.forEach(col => {
            if (col.id !== 'total' && col.id !== 'actions') {
                const value = row[col.label] || row[col.id] || '';
                item[col.id] = ['purchaseRate', 'saleRate', 'gst', 'qty'].includes(col.id) ? Number(value) || 0 : value;
            }
        });
        return item;
      });
      setEditablePreview(previewData);
      setShowPreview(true);
    } catch (error) {
      toast({ title: 'Import Error', description: `Failed to parse file. ${error.message}`, variant: 'destructive' });
    }
    event.target.value = '';
  };

  const handlePreviewChange = (id, field, value) => {
    setEditablePreview((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const saveFromPreview = () => {
    setItems([...formData.items, ...editablePreview]);
    setShowPreview(false);
    setEditablePreview([]);
    toast({ title: 'Items Added', description: `${editablePreview.length} items added from Excel.` });
  };
  
  const handleCancelClick = () => {
      onCancel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyName || !formData.invoiceNo || formData.items.length === 0) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields and add at least one item.', variant: 'destructive' });
      return;
    }
    if (workshopSettings.enable_uom && workshopSettings.uom_mandatory) {
      if (formData.items.some(item => !item.uom)) {
        toast({ title: 'Validation Error', description: 'UOM is mandatory for all items. Please fill it.', variant: 'destructive' });
        return;
      }
    }
    const purchaseData = {
      id: formData.id || uuidv4(),
      serial_no: formData.serialNo,
      invoice_no: formData.invoiceNo,
      invoice_date: formData.invoiceDate,
      party_name: formData.partyName,
      items: formData.items.map(({ id, ...rest }) => rest),
    };
    await onSave(purchaseData);
  };

  if (showPreview) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="gradient-text">Editable Preview from Excel</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto responsive-table">
            <Table>
                <TableHeader><TableRow>
                    {purchaseColumns.filter(c => c.id !== 'total' && c.id !== 'actions').map(col => <TableHead key={col.id}>{col.label}</TableHead>)}
                    <TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                    {editablePreview.map((item) => (
                      <TableRow key={item.id}>
                        {purchaseColumns.filter(c => c.id !== 'total' && c.id !== 'actions').map(col => (
                            <TableCell key={col.id}>
                                <Input 
                                    value={item[col.id] || ''} 
                                    onChange={(e) => handlePreviewChange(item.id, col.id, e.target.value)} 
                                    type={['purchaseRate', 'saleRate', 'gst', 'qty'].includes(col.id) ? 'number' : 'text'}
                                />
                            </TableCell>
                        ))}
                        <TableCell><Button type="button" size="icon" variant="ghost" onClick={() => setEditablePreview(p => p.filter(i => i.id !== item.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
            <Button onClick={saveFromPreview} className="button-glow">Add Items to Purchase</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-full mx-auto">
      <Card>
        <CardHeader><CardTitle className="gradient-text">{isEditing ? 'Edit' : 'New'} Workshop Purchase</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>S.No.</Label><Input value={formData.serialNo || ''} onChange={(e) => setFormData({ serialNo: e.target.value })} disabled className="bg-secondary" /></div>
              <div><Label>Invoice No *</Label><Input value={formData.invoiceNo} onChange={(e) => setFormData({ invoiceNo: e.target.value })} required /></div>
              <div><Label>Invoice Date *</Label><Input type="date" value={formData.invoiceDate} onChange={(e) => setFormData({ invoiceDate: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 <div className="relative">
                    <Label>Party Name *</Label>
                    <div className="flex gap-2">
                        <Input value={partySearch} onChange={handlePartySearch} placeholder="Search by name or mobile" required autoComplete="off" />
                         <Dialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen}>
                            <DialogTrigger asChild><Button type="button" variant="outline" className="flex-shrink-0"><UserPlus className="w-4 h-4 mr-2" /> New</Button></DialogTrigger>
                            <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Add New Customer</DialogTitle>
                              </DialogHeader>
                              <CustomerForm onSave={handleSaveNewCustomer} onCancel={() => setIsCustomerFormOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                    {showCustomerList && filteredCustomers.length > 0 && (
                      <ul className="absolute z-10 w-full bg-secondary border border-border rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                        {filteredCustomers.map((c) => (<li key={c.id} onClick={() => selectParty(c)} className="p-3 hover:bg-accent cursor-pointer text-sm"><p className="font-semibold">{c.customer_name}</p><p className="text-muted-foreground">{c.mobile1}</p></li>))}
                      </ul>
                    )}
                </div>
                {selectedCustomer && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}><Card className="bg-secondary/50"><CardHeader><CardTitle className="text-lg text-blue-300">Customer Details</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex items-center"><Building2 className="w-4 h-4 mr-3 text-muted-foreground" /> <strong>{selectedCustomer.customer_name}</strong></div><div className="flex items-center"><Phone className="w-4 h-4 mr-3 text-muted-foreground" /> {selectedCustomer.mobile1}</div><div className="flex items-start"><MapPin className="w-4 h-4 mr-3 mt-1 text-muted-foreground" /> <span>{selectedCustomer.address}, {selectedCustomer.district}, {selectedCustomer.state} - {selectedCustomer.pincode}</span></div></CardContent></Card></motion.div>)}
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-blue-300">Items</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="flex items-center"><Download className="w-4 h-4 mr-2" /> Download Template</Button>
                  <Button type="button" variant="outline" asChild><label htmlFor="excel-upload" className="cursor-pointer flex items-center"><Upload className="w-4 h-4 mr-2" /> Import Excel</label></Button>
                  <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="hidden" />
                </div>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader><TableRow>
                    {purchaseColumns.map(col => <TableHead key={col.id} className="whitespace-nowrap">{col.label}</TableHead>)}
                    <TableHead>Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {formData.items.length === 0 ? (
                      <TableRow><TableCell colSpan={purchaseColumns.length + 1} className="text-center py-8 text-muted-foreground">No items added. Add items manually or import from Excel.</TableCell></TableRow>
                    ) : (
                      formData.items.map((item) => {
                        const total = (item.purchaseRate * item.qty) * (1 + (item.gst || 0) / 100);
                        return (
                          <TableRow key={item.id}>
                            {purchaseColumns.map((col) => {
                              if (col.id === "total") {
                                return <TableCell key={col.id} className="whitespace-nowrap text-right">{isNaN(total) ? "0.00" : total.toFixed(2)}</TableCell>;
                              }

                              if (col.id === "uom") {
                                return (
                                  <TableCell key={col.id} style={{ minWidth: "120px" }}>
                                    <Select onValueChange={(value) => updateItem(item.id, "uom", value)} value={item.uom}>
                                      <SelectTrigger><SelectValue placeholder="UOM" /></SelectTrigger>
                                      <SelectContent>
                                        {(workshopSettings.uom_list || []).map((uom) => (<SelectItem key={uom} value={uom}>{uom}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                );
                              }

                              const isNumeric = ["purchaseRate", "saleRate", "gst", "qty"].includes(col.id);
                              
                              return (
                                <TableCell key={col.id} style={{ minWidth: "150px" }}>
                                  <Input
                                    value={item[col.id] || ""}
                                    onChange={(e) => updateItem(item.id, col.id, isNumeric ? parseFloat(e.target.value) || 0 : e.target.value)}
                                    type={isNumeric ? "number" : "text"}
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(item.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <Button type="button" onClick={() => addItem()} className="mt-2"><Plus className="w-4 h-4 mr-2" /> Add Item Manually</Button>
            </div>
            <div className="flex gap-4 justify-end mt-8">
              <Button type="button" variant="outline" onClick={handleCancelClick}>Cancel</Button>
              <Button type="submit" className="button-glow">{isEditing ? 'Update Purchase' : 'Save Purchase'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WorkshopPurchaseForm;
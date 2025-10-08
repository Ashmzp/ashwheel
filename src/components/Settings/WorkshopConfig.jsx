import React, { useState, useEffect, useMemo } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Save, PlusCircle, Edit, Check, X } from 'lucide-react';
import { saveSettings } from '@/utils/db/settings';
import { v4 as uuidv4 } from 'uuid';

const allJobCardColumns = [
    { id: 'invoice_no', label: 'Invoice No' },
    { id: 'invoice_date', label: 'Date' },
    { id: 'customer_name', label: 'Customer Name' },
    { id: 'reg_no', label: 'Reg. No' },
    { id: 'status', label: 'Status' },
    { id: 'total_amount', label: 'Total Amount' },
    { id: 'actions', label: 'Actions' },
    { id: 'manual_jc_no', label: 'Manual JC No.'},
    { id: 'frame_no', label: 'Frame No'},
    { id: 'model', label: 'Model'},
    { id: 'mechanic', label: 'Mechanic'},
    { id: 'next_due_date', label: 'Next Due Date'},
];


const defaultPartColumns = [
    { id: 'part_no', label: 'Part No.', visible: true },
    { id: 'hsn', label: 'HSN', visible: true },
    { id: 'qty', label: 'Qty', visible: true },
    { id: 'uom', label: 'UOM', visible: false },
    { id: 'rate', label: 'Rate', visible: true },
    { id: 'gst', label: 'GST %', visible: true },
    { id: 'discount', label: 'Disc', visible: true },
    { id: 'amount', label: 'Amount', visible: true },
];

const defaultWorkshopPurchaseColumns = [
    { id: 'partNo', label: 'Part No.', type: 'default', deletable: false, editable: false },
    { id: 'partName', label: 'Part Name', type: 'default', deletable: false, editable: false },
    { id: 'hsn', label: 'HSN', type: 'default', deletable: false, editable: false },
    { id: 'purchaseRate', label: 'Purchase Rate', type: 'default', deletable: false, editable: false },
    { id: 'qty', label: 'Qty', type: 'default', deletable: false, editable: false },
    { id: 'uom', label: 'UOM', type: 'default', deletable: false, editable: false },
    { id: 'saleRate', label: 'Sale Rate', type: 'default', deletable: false, editable: false },
    { id: 'gst', label: 'GST(%)', type: 'default', deletable: false, editable: false },
    { id: 'total', label: 'Total', type: 'default', deletable: false, editable: false },
    { id: 'category', label: 'Category', type: 'default', deletable: false, editable: false },
];

const WorkshopConfig = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { toast } = useToast();
  const { user } = useAuth();

  const workshopSettings = settings.workshop_settings || {};
  const [labourItems, setLabourItems] = useState([]);
  const [newLabourItem, setNewLabourItem] = useState({ item_name: '', hsn_code: '', rate: '', gst_rate: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [newFollowUpName, setNewFollowUpName] = useState('');
  const [newUom, setNewUom] = useState('');
  const [newPurchaseColumn, setNewPurchaseColumn] = useState('');
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState('');
  
  const followUpByList = useMemo(() => workshopSettings.follow_up_by_list || [], [workshopSettings.follow_up_by_list]);
  const uomList = useMemo(() => workshopSettings.uom_list || [], [workshopSettings.uom_list]);
  
  const partColumns = workshopSettings.part_columns || defaultPartColumns;
  
  const workshopPurchaseColumns = useMemo(() => {
    const savedColumns = workshopSettings.workshop_purchase_columns;
    if (savedColumns && Array.isArray(savedColumns) && savedColumns.length > 0) {
        return savedColumns.map(col => ({ ...col, editable: col.editable !== false, deletable: col.deletable !== false }));
    }
    return defaultWorkshopPurchaseColumns;
  }, [workshopSettings.workshop_purchase_columns]);

  const jobCardColumns = useMemo(() => {
    const saved = workshopSettings.job_card_columns;
    if (saved && Array.isArray(saved)) {
      return allJobCardColumns.map(col => ({...col, visible: saved.includes(col.id)}));
    }
    return allJobCardColumns.map(col => ({...col, visible: ['invoice_no', 'invoice_date', 'customer_name', 'reg_no', 'status', 'total_amount', 'actions'].includes(col.id)}));
  }, [workshopSettings.job_card_columns]);

  useEffect(() => {
    const fetchLabourItems = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('workshop_labour_items').select('*').eq('user_id', user.id);
      if (error) {
        toast({ title: 'Error', description: 'Could not fetch labour items.', variant: 'destructive' });
      } else {
        setLabourItems(data);
      }
    };
    fetchLabourItems();
  }, [user, toast]);

  const handleCheckboxChange = (id) => {
    updateSettings({
      workshop_settings: {
        ...workshopSettings,
        [id]: !workshopSettings[id],
      },
    });
  };

  const handlePartColumnChange = (columnId) => {
    const newColumns = partColumns.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    updateSettings({
        workshop_settings: {
            ...workshopSettings,
            part_columns: newColumns,
        },
    });
  };
  
  const handleJobCardColumnChange = (columnId) => {
    const newColumns = jobCardColumns.map(col =>
        col.id === columnId ? {...col, visible: !col.visible} : col
    );
    updateSettings({
        workshop_settings: {
            ...workshopSettings,
            job_card_columns: newColumns.filter(c => c.visible).map(c => c.id),
        },
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    updateSettings({
      workshop_settings: {
        ...workshopSettings,
        [id]: value,
      },
    });
  };

  const handleSelectChange = (id, value) => {
    updateSettings({
        workshop_settings: {
            ...workshopSettings,
            [id]: value,
        },
    });
  };

  const handleNewLabourItemChange = (e) => {
    const { name, value } = e.target;
    setNewLabourItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLabourItem = async () => {
    if (!newLabourItem.item_name || !newLabourItem.rate) {
      toast({ title: 'Validation Error', description: 'Item Name and Rate are required.', variant: 'destructive' });
      return;
    }
    const { data, error } = await supabase
      .from('workshop_labour_items')
      .insert({ ...newLabourItem, user_id: user.id })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to add labour item.', variant: 'destructive' });
    } else {
      setLabourItems(prev => [...prev, data]);
      setNewLabourItem({ item_name: '', hsn_code: '', rate: '', gst_rate: '' });
      toast({ title: 'Success', description: 'Labour item added.' });
    }
  };

  const handleDeleteLabourItem = async (id) => {
    const { error } = await supabase.from('workshop_labour_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete labour item.', variant: 'destructive' });
    } else {
      setLabourItems(prev => prev.filter(item => item.id !== id));
      toast({ title: 'Success', description: 'Labour item deleted.' });
    }
  };

  const handleAddFollowUpName = () => {
    if (!newFollowUpName.trim()) return;
    const newList = [...followUpByList, newFollowUpName.trim()];
    updateSettings({
      workshop_settings: {
        ...workshopSettings,
        follow_up_by_list: newList,
      },
    });
    setNewFollowUpName('');
  };

  const handleDeleteFollowUpName = (nameToDelete) => {
    const newList = followUpByList.filter(name => name !== nameToDelete);
    updateSettings({
      workshop_settings: {
        ...workshopSettings,
        follow_up_by_list: newList,
      },
    });
  };

  const handleAddUom = () => {
    if (!newUom.trim() || uomList.includes(newUom.trim())) {
        toast({ title: 'Invalid UOM', description: 'UOM cannot be empty or a duplicate.', variant: 'destructive' });
        return;
    }
    const newList = [...uomList, newUom.trim()];
    updateSettings({
      workshop_settings: { ...workshopSettings, uom_list: newList },
    });
    setNewUom('');
  };

  const handleDeleteUom = (uomToDelete) => {
    const newList = uomList.filter(uom => uom !== uomToDelete);
    updateSettings({
      workshop_settings: { ...workshopSettings, uom_list: newList },
    });
  };

  const handleAddPurchaseColumn = () => {
    if (!newPurchaseColumn.trim()) {
        toast({ title: 'Invalid Name', description: 'Column name cannot be empty.', variant: 'destructive' });
        return;
    }
    const columnId = `custom_${newPurchaseColumn.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uuidv4().slice(0, 4)}`;
    if (workshopPurchaseColumns.some(c => c.id === columnId)) {
        toast({ title: 'Duplicate Column', description: 'A column with this name already exists.', variant: 'destructive' });
        return;
    }
    const newColumn = { id: columnId, label: newPurchaseColumn.trim(), type: 'custom', deletable: true, editable: true };
    const newColumns = [...workshopPurchaseColumns, newColumn];
    updateSettings({
        workshop_settings: { ...workshopSettings, workshop_purchase_columns: newColumns },
    });
    setNewPurchaseColumn('');
  };

  const handleDeletePurchaseColumn = (columnId) => {
    const newColumns = workshopPurchaseColumns.filter(c => c.id !== columnId);
    updateSettings({
        workshop_settings: { ...workshopSettings, workshop_purchase_columns: newColumns },
    });
  };

  const handleEditPurchaseColumn = (col) => {
    setEditingColumnId(col.id);
    setEditingColumnLabel(col.label);
  };

  const handleSavePurchaseColumn = (columnId) => {
    if (!editingColumnLabel.trim()) {
        toast({ title: 'Invalid Name', description: 'Column name cannot be empty.', variant: 'destructive' });
        return;
    }
    const newColumns = workshopPurchaseColumns.map(c => 
        c.id === columnId ? { ...c, label: editingColumnLabel.trim() } : c
    );
    updateSettings({
        workshop_settings: { ...workshopSettings, workshop_purchase_columns: newColumns },
    });
    setEditingColumnId(null);
    setEditingColumnLabel('');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      toast({ title: "Success", description: "Workshop settings saved successfully." });
    } catch (error) {
       toast({ title: "Error", description: "Failed to save workshop settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory & Job Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="prevent_negative_stock" checked={!!workshopSettings.prevent_negative_stock} onCheckedChange={() => handleCheckboxChange('prevent_negative_stock')} />
            <Label htmlFor="prevent_negative_stock">Prevent Negative Stock in Job Card</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show_service_labour_invoice_title" checked={workshopSettings.show_service_labour_invoice_title !== false} onCheckedChange={() => handleCheckboxChange('show_service_labour_invoice_title')} />
            <Label htmlFor="show_service_labour_invoice_title">Show "Service Labour Invoice" title on Job Card Print</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_card_prefix">Job Card Invoice Prefix</Label>
            <Input id="job_card_prefix" value={workshopSettings.job_card_prefix || 'JC-'} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_due_date_days">Next Due Date (in days)</Label>
            <Input type="number" id="next_due_date_days" value={workshopSettings.next_due_date_days || ''} onChange={handleInputChange} />
            <p className="text-sm text-muted-foreground">Set default days for Next Due Date from invoice date.</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Job Card List Columns</CardTitle>
              <CardDescription>Select which columns to display in the job card list and export.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {jobCardColumns.map(col => (
                  <div key={col.id} className="flex items-center space-x-2">
                      <Checkbox 
                          id={`jc-col-${col.id}`} 
                          checked={col.visible} 
                          onCheckedChange={() => handleJobCardColumnChange(col.id)}
                      />
                      <Label htmlFor={`jc-col-${col.id}`}>{col.label}</Label>
                  </div>
              ))}
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Follow-up Configuration</CardTitle>
              <CardDescription>Settings for vehicle invoice and job card follow-ups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="vehicle_invoice_follow_up_days">Follow-up After (Days)</Label>
                  <Input 
                      type="number" 
                      id="vehicle_invoice_follow_up_days" 
                      value={workshopSettings.vehicle_invoice_follow_up_days || ''} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 30"
                  />
                  <p className="text-sm text-muted-foreground">
                      Automatically create a follow-up for non-registered vehicle invoices after this many days.
                  </p>
              </div>
              <div className="space-y-4">
                <Label>Manage "Followed By" Staff List</Label>
                 <div className="space-y-2">
                  {followUpByList.map((name, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                      <span>{name}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFollowUpName(name)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Add new staff name"
                    value={newFollowUpName}
                    onChange={(e) => setNewFollowUpName(e.target.value)}
                  />
                  <Button onClick={handleAddFollowUpName}>Add</Button>
                </div>
              </div>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Job Card Parts Table Columns</CardTitle>
              <CardDescription>Select which columns to display in the parts items table on the job card form.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {partColumns.map(col => (
                  <div key={col.id} className="flex items-center space-x-2">
                      <Checkbox 
                          id={`col-${col.id}`} 
                          checked={col.visible} 
                          onCheckedChange={() => handlePartColumnChange(col.id)}
                      />
                      <Label htmlFor={`col-${col.id}`}>{col.label}</Label>
                  </div>
              ))}
          </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Manage Labour Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {labourItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
                <span className="flex-1">{item.item_name}</span>
                <span className="text-sm text-muted-foreground">Rate: {item.rate}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteLabourItem(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2 mt-4 p-2 border rounded-md">
            <div className="flex-1 space-y-1"><Label>Item Name</Label><Input name="item_name" value={newLabourItem.item_name} onChange={handleNewLabourItemChange} /></div>
            <div className="space-y-1"><Label>HSN</Label><Input name="hsn_code" value={newLabourItem.hsn_code} onChange={handleNewLabourItemChange} /></div>
            <div className="space-y-1"><Label>Rate</Label><Input type="number" name="rate" value={newLabourItem.rate} onChange={handleNewLabourItemChange} /></div>
            <div className="space-y-1"><Label>GST(%)</Label><Input type="number" name="gst_rate" value={newLabourItem.gst_rate} onChange={handleNewLabourItemChange} /></div>
            <Button onClick={handleAddLabourItem}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Job Card Form Sections</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="show_customer_details_mandatory" checked={!!workshopSettings.show_customer_details_mandatory} onCheckedChange={() => handleCheckboxChange('show_customer_details_mandatory')} />
            <Label htmlFor="show_customer_details_mandatory">Make Customer Details Mandatory</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show_vehicle_details" checked={!!workshopSettings.show_vehicle_details} onCheckedChange={() => handleCheckboxChange('show_vehicle_details')} />
            <Label htmlFor="show_vehicle_details">Show Vehicle Details Section</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show_labour_items" checked={!!workshopSettings.show_labour_items} onCheckedChange={() => handleCheckboxChange('show_labour_items')} />
            <Label htmlFor="show_labour_items">Show Labour Items Section</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show_job_details" checked={!!workshopSettings.show_job_details} onCheckedChange={() => handleCheckboxChange('show_job_details')} />
            <Label htmlFor="show_job_details">Show Job Details Section</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Manual Job Card Number</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual_jc_no_label">Label for Manual Job Card No.</Label>
            <Input id="manual_jc_no_label" value={workshopSettings.manual_jc_no_label || ''} onChange={handleInputChange} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="manual_jc_no_mandatory" checked={!!workshopSettings.manual_jc_no_mandatory} onCheckedChange={() => handleCheckboxChange('manual_jc_no_mandatory')} />
            <Label htmlFor="manual_jc_no_mandatory">Make Manual Job Card No. Mandatory</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Unit of Measurement (UOM)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="enable_uom" checked={!!workshopSettings.enable_uom} onCheckedChange={() => handleCheckboxChange('enable_uom')} />
            <Label htmlFor="enable_uom">Enable UOM for Workshop Items</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="uom_mandatory" checked={!!workshopSettings.uom_mandatory} onCheckedChange={() => handleCheckboxChange('uom_mandatory')} />
            <Label htmlFor="uom_mandatory">Make UOM Mandatory</Label>
          </div>
          <div className="space-y-2">
            <Label>UOM List</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {uomList.map((uom, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <span>{uom}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUom(uom)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
                <Input value={newUom} onChange={(e) => setNewUom(e.target.value)} placeholder="Add new UOM" />
                <Button onClick={handleAddUom}><PlusCircle className="w-4 h-4 mr-2" /> Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Workshop Purchase Columns</CardTitle>
            <CardDescription>Customize the columns for the workshop purchase items table. Changes will reflect in the purchase form and Excel templates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                {workshopPurchaseColumns.map((col) => (
                    <div key={col.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                        {editingColumnId === col.id ? (
                            <Input 
                                value={editingColumnLabel}
                                onChange={(e) => setEditingColumnLabel(e.target.value)}
                                className="flex-grow"
                            />
                        ) : (
                            <span className="flex-grow">{col.label}</span>
                        )}
                        <div className="flex items-center gap-1">
                            {editingColumnId === col.id ? (
                                <>
                                    <Button variant="ghost" size="icon" onClick={() => handleSavePurchaseColumn(col.id)}><Check className="w-4 h-4 text-green-500" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingColumnId(null)}><X className="w-4 h-4 text-red-500" /></Button>
                                </>
                            ) : (
                                <>
                                    {col.editable && <Button variant="ghost" size="icon" onClick={() => handleEditPurchaseColumn(col)}><Edit className="w-4 h-4" /></Button>}
                                    {col.deletable && <Button variant="ghost" size="icon" onClick={() => handleDeletePurchaseColumn(col.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <Input 
                    value={newPurchaseColumn}
                    onChange={(e) => setNewPurchaseColumn(e.target.value)}
                    placeholder="New column name"
                />
                <Button onClick={handleAddPurchaseColumn}><PlusCircle className="w-4 h-4 mr-2" /> Add Column</Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tax Calculation</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tax_calculation">Rate Calculation</Label>
            <Select onValueChange={(value) => handleSelectChange('tax_calculation', value)} value={workshopSettings.tax_calculation || 'exclusive'}>
              <SelectTrigger id="tax_calculation"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Exclusive of GST</SelectItem>
                <SelectItem value="inclusive">Inclusive of GST</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select if entered item rates are inclusive or exclusive of GST.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Workshop Config'}
        </Button>
      </div>
    </div>
  );
};

export default WorkshopConfig;
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getPriceList, savePriceListItem, deletePriceListItem, bulkInsertPriceList } from '@/utils/db/priceList';
import { Loader2, PlusCircle, Trash2, Edit, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const PriceListForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState(item || { model_name: '', price: '', gst: '', category: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.model_name || !formData.price) {
      toast({ variant: 'destructive', title: 'Model Name and Price are required.' });
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
      toast({ title: 'Success', description: 'Price list item saved.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item?.id ? 'Edit' : 'Add'} Price List Item</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="model_name">Model Name *</Label>
          <Input id="model_name" value={formData.model_name} onChange={e => handleInputChange('model_name', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input id="price" type="number" value={formData.price} onChange={e => handleInputChange('price', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="gst">GST (%)</Label>
          <Input id="gst" type="number" value={formData.gst} onChange={e => handleInputChange('gst', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={value => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Scooter">Scooter</SelectItem>
              <SelectItem value="Motorcycle">Motorcycle</SelectItem>
              <SelectItem value="Car">Car</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
};

const PriceList = () => {
  const [priceList, setPriceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { toast } = useToast();

  const fetchPriceList = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPriceList();
      setPriceList(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching price list', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPriceList();
  }, [fetchPriceList]);

  const handleSave = async (itemData) => {
    await savePriceListItem(itemData);
    setIsFormOpen(false);
    setEditingItem(null);
    fetchPriceList();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deletePriceListItem(id);
        toast({ title: 'Success', description: 'Item deleted.' });
        fetchPriceList();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
            toast({ variant: 'destructive', title: 'Empty File', description: 'The Excel file is empty or in the wrong format.' });
            return;
        }

        await bulkInsertPriceList(json);
        toast({ title: 'Success', description: 'Price list imported successfully.' });
        fetchPriceList();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Import Error', description: error.message });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Price List Management</CardTitle>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <label htmlFor="excel-upload">
              <Upload className="mr-2 h-4 w-4" /> Import Excel
              <input id="excel-upload" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </label>
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent>
              <PriceListForm
                item={editingItem}
                onSave={handleSave}
                onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>GST (%)</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
              ) : priceList.length > 0 ? (
                priceList.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.model_name}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{item.gst}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsFormOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center">No price list items found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceList;
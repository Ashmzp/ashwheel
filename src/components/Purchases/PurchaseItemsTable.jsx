import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { validateRequired, validateChassisNo, validateEngineNo } from '@/utils/validation';
import { checkStockExistence } from '@/utils/db/stock';
import usePurchaseStore from '@/stores/purchaseStore';

const PurchaseItemsTable = () => {
  const { items, addItem, updateItem, removeItem } = usePurchaseStore((state) => ({
    items: state.items,
    addItem: state.addItem,
    updateItem: state.updateItem,
    removeItem: state.removeItem,
  }));
  
  const [newItem, setNewItem] = useState({
    modelName: '', chassisNo: '', engineNo: '', colour: '', category: '', hsn: '', gst: '', price: '0'
  });
  const { toast } = useToast();

  const handleAddItem = async () => {
    const errors = {};
    if (!validateRequired(newItem.modelName)) errors.modelName = true;
    if (!validateChassisNo(newItem.chassisNo)) errors.chassisNo = true;
    if (!validateEngineNo(newItem.engineNo)) errors.engineNo = true;
    if (!validateRequired(newItem.colour)) errors.colour = true;

    if (Object.keys(errors).length > 0) {
      toast({ title: "Validation Error", description: "Please fill Model, Chassis, Engine, and Colour fields correctly.", variant: "destructive" });
      return;
    }

    if (items.some(i => i.chassisNo === newItem.chassisNo.toUpperCase())) {
      toast({ title: "Duplicate Chassis No", description: "This chassis number is already in the current purchase list.", variant: "destructive" });
      return;
    }

    const { exists, message } = await checkStockExistence(newItem.chassisNo.toUpperCase(), newItem.engineNo.toUpperCase());
    if (exists) {
      toast({ title: "Stock Alert", description: message, variant: "destructive" });
      return;
    }

    addItem({ ...newItem, id: Date.now().toString(), chassisNo: newItem.chassisNo.toUpperCase(), engineNo: newItem.engineNo.toUpperCase() });
    setNewItem({ modelName: '', chassisNo: '', engineNo: '', colour: '', category: '', hsn: '', gst: '', price: '0' });
  };

  const handleRemoveItem = (itemId) => {
    removeItem(itemId);
  };
  
  const handleItemInputChange = (e, id, field) => {
    let value = e.target.value;
    if (field === 'chassisNo' || field === 'engineNo') {
      value = value.toUpperCase();
    }
    updateItem(id, { [field]: value });
  };

  const handleNewItemInputChange = (e, field) => {
    let value = e.target.value;
    if (field === 'chassisNo' || field === 'engineNo') {
      value = value.toUpperCase();
    }
    setNewItem(p => ({ ...p, [field]: value }));
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model Name</TableHead>
            <TableHead>Chassis No</TableHead>
            <TableHead>Engine No</TableHead>
            <TableHead>Colour</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>HSN</TableHead>
            <TableHead>GST%</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell><Input value={item.modelName} onChange={(e) => handleItemInputChange(e, item.id, 'modelName')} placeholder="Model" /></TableCell>
              <TableCell><Input value={item.chassisNo} onChange={(e) => handleItemInputChange(e, item.id, 'chassisNo')} placeholder="Chassis" /></TableCell>
              <TableCell><Input value={item.engineNo} onChange={(e) => handleItemInputChange(e, item.id, 'engineNo')} placeholder="Engine" /></TableCell>
              <TableCell><Input value={item.colour} onChange={(e) => handleItemInputChange(e, item.id, 'colour')} placeholder="Colour" /></TableCell>
              <TableCell><Input value={item.category || ''} onChange={(e) => handleItemInputChange(e, item.id, 'category')} placeholder="Category" /></TableCell>
              <TableCell><Input type="number" value={item.price} onChange={(e) => handleItemInputChange(e, item.id, 'price')} placeholder="0" /></TableCell>
              <TableCell><Input value={item.hsn || ''} onChange={(e) => handleItemInputChange(e, item.id, 'hsn')} placeholder="HSN Code" /></TableCell>
              <TableCell><Input value={item.gst || ''} onChange={(e) => handleItemInputChange(e, item.id, 'gst')} placeholder="GST %" /></TableCell>
              <TableCell>
                <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell><Input value={newItem.modelName} onChange={(e) => handleNewItemInputChange(e, 'modelName')} placeholder="Model" /></TableCell>
            <TableCell><Input value={newItem.chassisNo} onChange={(e) => handleNewItemInputChange(e, 'chassisNo')} placeholder="Chassis" /></TableCell>
            <TableCell><Input value={newItem.engineNo} onChange={(e) => handleNewItemInputChange(e, 'engineNo')} placeholder="Engine" /></TableCell>
            <TableCell><Input value={newItem.colour} onChange={(e) => handleNewItemInputChange(e, 'colour')} placeholder="Colour" /></TableCell>
            <TableCell><Input value={newItem.category} onChange={(e) => handleNewItemInputChange(e, 'category')} placeholder="Category" /></TableCell>
            <TableCell><Input type="number" value={newItem.price} onChange={(e) => handleNewItemInputChange(e, 'price')} placeholder="0" /></TableCell>
            <TableCell><Input value={newItem.hsn} onChange={(e) => handleNewItemInputChange(e, 'hsn')} placeholder="HSN Code" /></TableCell>
            <TableCell><Input value={newItem.gst} onChange={(e) => handleNewItemInputChange(e, 'gst')} placeholder="GST %" /></TableCell>
            <TableCell>
              <Button type="button" size="icon" onClick={handleAddItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default PurchaseItemsTable;
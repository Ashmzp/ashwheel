import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, PlusCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';

const PartSearchDialog = ({ onSelectPart }) => {
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            setLoading(true);
            const { data } = await supabase.from('workshop_inventory').select('*');
            setInventory(data || []);
            setLoading(false);
        };
        fetchInventory();
    }, []);

    const filteredInventory = useMemo(() => {
        if (!searchTerm) return inventory;
        const term = searchTerm.toLowerCase();
        return inventory.filter(
            (item) =>
                item.part_name?.toLowerCase().includes(term) ||
                item.part_no?.toLowerCase().includes(term)
        );
    }, [searchTerm, inventory]);

    const handleAddPart = (part) => {
        onSelectPart(part);
    };

    return (
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Search and Add Part</DialogTitle>
            </DialogHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Part Name or Part No."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="flex-grow overflow-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Part No.</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : filteredInventory.length > 0 ? (
                            filteredInventory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.part_name}</TableCell>
                                    <TableCell>{item.part_no}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>₹{item.sale_rate}</TableCell>
                                    <TableCell>
                                        <Button size="sm" onClick={() => handleAddPart(item)}>Add</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No parts found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
    );
};


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

const ItemTableRow = ({ item, type, onItemChange, onRemoveItem, error, columns }) => {
  const { settings } = useSettingsStore();
  const taxCalculationType = settings?.workshop_settings?.tax_calculation || 'exclusive';

  const calculateTaxableValue = (rate, gst) => {
    if (taxCalculationType === 'inclusive') {
      return (rate * 100) / (100 + gst);
    }
    return rate;
  };

  const calculateTax = (taxableValue, gst) => {
    return taxableValue * (gst / 100);
  };

  const rate = parseFloat(item.rate) || 0;
  const qty = parseFloat(item.qty) || 0;
  const gst = parseFloat(item.gst_rate) || 0;
  const discount = parseFloat(item.discount) || 0;

  const taxableValue = calculateTaxableValue(rate, gst);
  const totalTaxableValue = taxableValue * qty;
  const totalDiscount = discount;
  const netTaxable = totalTaxableValue - totalDiscount;
  const taxAmount = calculateTax(netTaxable, gst);
  const netAmount = netTaxable + taxAmount;

  const isColumnVisible = (id) => columns.find(c => c.id === id)?.visible;

  return (
    <TableRow>
      <TableCell style={{ minWidth: '250px' }}>
        <Input
            value={item.item_name || ''}
            onChange={(e) => onItemChange(type, item.id, 'item_name', e.target.value)}
            placeholder="Type item name"
            className={cn(error?.field === 'item_name' && 'border-destructive')}
        />
        {error?.field === 'item_name' && <p className="text-xs text-destructive mt-1">{error.message}</p>}
      </TableCell>
      {type === 'parts' && isColumnVisible('part_no') && (
        <TableCell>
          <Input value={item.part_no || ''} onChange={(e) => onItemChange(type, item.id, 'part_no', e.target.value)} placeholder="Part No." />
        </TableCell>
      )}
      {isColumnVisible('hsn') && (
        <TableCell>
          <Input value={item.hsn_code || ''} onChange={(e) => onItemChange(type, item.id, 'hsn_code', e.target.value)} placeholder="HSN" />
        </TableCell>
      )}
      {isColumnVisible('qty') && (
        <TableCell>
          <Input type="number" value={item.qty || ''} onChange={(e) => onItemChange(type, item.id, 'qty', e.target.value)} placeholder="Qty" className={cn(error?.field === 'qty' && 'border-destructive')} />
          {error?.field === 'qty' && <p className="text-xs text-destructive mt-1">{error.message}</p>}
        </TableCell>
      )}
      {type === 'parts' && isColumnVisible('uom') && (
        <TableCell>
          <Input value={item.uom || ''} onChange={(e) => onItemChange(type, item.id, 'uom', e.target.value)} placeholder="UOM" />
        </TableCell>
      )}
      {isColumnVisible('rate') && (
        <TableCell>
          <Input type="number" value={item.rate || ''} onChange={(e) => onItemChange(type, item.id, 'rate', e.target.value)} placeholder="Rate" />
        </TableCell>
      )}
      {isColumnVisible('gst') && (
        <TableCell>
          <Input type="number" value={item.gst_rate || ''} onChange={(e) => onItemChange(type, item.id, 'gst_rate', e.target.value)} placeholder="GST %" />
        </TableCell>
      )}
      {isColumnVisible('discount') && (
        <TableCell>
          <Input type="number" value={item.discount || ''} onChange={(e) => onItemChange(type, item.id, 'discount', e.target.value)} placeholder="Disc" />
        </TableCell>
      )}
      {isColumnVisible('amount') && (
        <TableCell className="text-right">{netAmount.toFixed(2)}</TableCell>
      )}
      <TableCell>
        <Button variant="ghost" size="icon" onClick={() => onRemoveItem(type, item.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const JobItemsSection = ({ items, type, onAddItem, onItemChange, onItemsUpdate, onRemoveItem, errors = [], workshopSettings }) => {
  const partColumns = workshopSettings.part_columns || defaultPartColumns;
  const columns = type === 'parts' ? partColumns : defaultPartColumns.filter(c => c.id !== 'part_no' && c.id !== 'uom');
  const [isPartSearchOpen, setIsPartSearchOpen] = useState(false);

  const isColumnVisible = (id) => columns.find(c => c.id === id)?.visible;

  const getErrorForItem = (itemId) => {
    const itemErrors = errors || [];
    return itemErrors.find(e => e.id === itemId);
  };

  const handleSelectPart = (part) => {
    const newItem = {
        id: uuidv4(),
        item_name: part.part_name,
        part_no: part.part_no,
        hsn_code: part.hsn_code,
        qty: 1,
        uom: part.uom,
        rate: part.sale_rate,
        gst_rate: part.gst,
        discount: 0,
    };
    onAddItem(type, newItem);
    setIsPartSearchOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{type === 'parts' ? 'Part Name' : 'Labour Description'}</TableHead>
              {type === 'parts' && isColumnVisible('part_no') && <TableHead>Part No.</TableHead>}
              {isColumnVisible('hsn') && <TableHead>HSN</TableHead>}
              {isColumnVisible('qty') && <TableHead>Qty</TableHead>}
              {type === 'parts' && isColumnVisible('uom') && <TableHead>UOM</TableHead>}
              {isColumnVisible('rate') && <TableHead>Rate</TableHead>}
              {isColumnVisible('gst') && <TableHead>GST %</TableHead>}
              {isColumnVisible('discount') && <TableHead>Disc</TableHead>}
              {isColumnVisible('amount') && <TableHead className="text-right">Amount</TableHead>}
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items || []).map((item) => (
              <ItemTableRow
                key={item.id}
                item={item}
                type={type}
                onItemChange={onItemChange}
                onRemoveItem={onRemoveItem}
                error={getErrorForItem(item.id)}
                columns={columns}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex gap-2">
        {type === 'parts' ? (
            <Dialog open={isPartSearchOpen} onOpenChange={setIsPartSearchOpen}>
                <DialogTrigger asChild>
                    <Button type="button">
                        <Search className="mr-2 h-4 w-4" /> Add Part from Inventory
                    </Button>
                </DialogTrigger>
                <PartSearchDialog onSelectPart={handleSelectPart} />
            </Dialog>
        ) : (
          <Button type="button" onClick={() => onAddItem(type)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Labour
          </Button>
        )}
      </div>
    </div>
  );
};

const JobItems = ({ formData, onAddItem, onItemChange, onItemsUpdate, onRemoveItem, workshopSettings, errors = {} }) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-blue-300">Parts Items</h3>
        <JobItemsSection
          items={formData.parts_items || []}
          type="parts"
          onAddItem={onAddItem}
          onItemChange={onItemChange}
          onItemsUpdate={onItemsUpdate}
          onRemoveItem={onRemoveItem}
          errors={errors.parts_items}
          workshopSettings={workshopSettings}
        />
      </div>
      {workshopSettings.show_labour_items && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-300">Labour Items</h3>
          <JobItemsSection
            items={formData.labour_items || []}
            type="labour"
            onAddItem={onAddItem}
            onItemChange={onItemChange}
            onItemsUpdate={onItemsUpdate}
            onRemoveItem={onRemoveItem}
            errors={errors.labour_items}
            workshopSettings={workshopSettings}
          />
        </div>
      )}
    </div>
  );
};

export default JobItems;
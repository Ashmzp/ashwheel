import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InvoiceItemsTable = ({ items, setItems, stock, onItemRemove }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const availableStock = stock.filter(stockItem => 
    !items.some(invItem => invItem.chassis_no === stockItem.chassis_no)
  );
  
  const filteredStock = searchTerm
    ? availableStock.filter(item => 
        (item.chassis_no && item.chassis_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.engine_no && item.engine_no.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleAddItem = (stockItem) => {
    const newItem = {
      ...stockItem,
      hsn: '8711',
      gst: '28'
    };
    setItems([...items, newItem]);
    setSearchTerm('');
    toast({ title: "Item Added", description: `${stockItem.model_name} added to invoice.` });
  };

  const handleRemoveItem = (itemToRemove) => {
    if (onItemRemove) {
      onItemRemove(itemToRemove);
    } else {
      setItems(items.filter(item => item.chassis_no !== itemToRemove.chassis_no));
    }
  };
  
  const handlePriceChange = (chassis_no, newPrice) => {
      setItems(items.map(item => item.chassis_no === chassis_no ? {...item, price: newPrice} : item));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input 
          placeholder="Search stock by Chassis No or Engine No..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute z-10 w-full border rounded-md mt-1 bg-secondary shadow-lg max-h-60 overflow-y-auto">
            {filteredStock.length > 0 ? filteredStock.map(item => (
              <div key={item.id} className="p-2 border-b flex justify-between items-center hover:bg-accent">
                <div>
                  <p>{item.model_name} ({item.colour})</p>
                  <p className="text-sm text-muted-foreground">Chassis: {item.chassis_no}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAddItem(item)}><Plus className="w-4 h-4" /></Button>
              </div>
            )) : <div className="p-2 text-center text-sm">No matching stock found.</div>}
          </motion.div>
        )}
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model Name</TableHead>
              <TableHead>Chassis No</TableHead>
              <TableHead>Engine No</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {items.length > 0 ? items.map(item => (
                <motion.tr 
                  key={item.chassis_no}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell>{item.model_name}</TableCell>
                  <TableCell>{item.chassis_no}</TableCell>
                  <TableCell>{item.engine_no}</TableCell>
                  <TableCell>
                      <Input 
                        type="number"
                        value={item.price}
                        onChange={(e) => handlePriceChange(item.chassis_no, e.target.value)}
                        className="w-32"
                      />
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItem(item)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No items added.</TableCell></TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';

const StockSearch = ({ stock, onAddItem }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStock = stock.filter(item =>
    item.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.chassis_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.engine_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item) => {
    onAddItem(item);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Item from Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Vehicle from Stock</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            placeholder="Search by Model, Chassis, or Engine No."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Chassis No.</TableHead>
                  <TableHead>Engine No.</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.model_name}</TableCell>
                    <TableCell>{item.chassis_no}</TableCell>
                    <TableCell>{item.engine_no}</TableCell>
                    <TableCell>₹{item.price}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleSelect(item)}>
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockSearch;
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import useJournalEntryStore from '@/stores/journalEntryStore';
import { useToast } from '@/components/ui/use-toast';
import { saveJournalEntry, searchChassisForJournal } from '@/utils/db/journalEntries';
import { getCustomers } from '@/utils/db/customers';
import { getPriceList } from '@/utils/db/priceList';
import { useDebounce } from '@/hooks/useDebounce';

const AutocompleteInput = ({ value, onChange, onSelect, searchFunction, placeholder, displayField, valueField }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true);
      searchFunction(debouncedSearchTerm)
        .then(data => {
          setResults(data);
          setIsLoading(false);
          setIsOpen(true);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm, searchFunction]);

  const handleSelect = (item) => {
    setSearchTerm(item[displayField]);
    onSelect(item);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setIsOpen(results.length > 0)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && (
        <div className="absolute z-10 w-full bg-card border rounded-md mt-1 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-center">Loading...</div>
          ) : results.length > 0 ? (
            results.map((item, index) => (
              <div
                key={item[valueField] || index}
                className="p-2 hover:bg-accent cursor-pointer"
                onClick={() => handleSelect(item)}
              >
                {item[displayField]} {item.model_name ? `(${item.model_name})` : ''}
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-muted-foreground">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

const JournalEntryForm = () => {
  const { formData, setFormData, resetForm, isEditing, setActiveTab } = useJournalEntryStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [priceList, setPriceList] = useState([]);

  useEffect(() => {
    getPriceList().then(setPriceList).catch(console.error);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDateChange = (date) => {
    handleInputChange('entry_date', format(date, 'yyyy-MM-dd'));
  };

  const handleCustomerSelect = (customer) => {
    setFormData({
      ...formData,
      party_id: customer.id,
      party_name: customer.customer_name,
    });
  };

  const handleChassisSelect = (vehicle) => {
    const priceFromList = priceList.find(p => p.model_name === vehicle.model_name)?.price || '';
    setFormData({
      ...formData,
      chassis_no: vehicle.chassis_no,
      model_name: vehicle.model_name,
      invoice_no: vehicle.invoice_no,
      price: vehicle.price || priceFromList,
    });
  };

  const searchCustomers = async (term) => {
    const { data } = await getCustomers({ searchTerm: term, pageSize: 10 });
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.entry_type || !formData.entry_date || !formData.party_name) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Entry Type, Date, and Party Name are required.',
      });
      return;
    }
    if (isEditing && (!formData.remark || formData.remark.trim() === '')) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Remark is mandatory when editing an entry.',
      });
      return;
    }
    setIsSaving(true);
    try {
      await saveJournalEntry(formData);
      toast({
        title: 'Success',
        description: `Journal entry ${isEditing ? 'updated' : 'saved'} successfully.`,
      });
      resetForm();
      setActiveTab('list');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save journal entry: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit' : 'New'} Journal Entry</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry_type">Entry Type *</Label>
              <Select
                name="entry_type"
                value={formData.entry_type || ''}
                onValueChange={(value) => handleInputChange('entry_type', value)}
                required
              >
                <SelectTrigger id="entry_type">
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Debit">Debit</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entry_date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn('w-full justify-start text-left font-normal', !formData.entry_date && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.entry_date ? format(new Date(formData.entry_date), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.entry_date ? new Date(formData.entry_date) : null}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label htmlFor="party_name">Party Name *</Label>
            <AutocompleteInput
              value={formData.party_name || ''}
              onChange={(value) => handleInputChange('party_name', value)}
              onSelect={handleCustomerSelect}
              searchFunction={searchCustomers}
              placeholder="Search by name or mobile..."
              displayField="customer_name"
              valueField="id"
            />
          </div>
          <div>
            <Label htmlFor="chassis_search">Search Vehicle</Label>
            <AutocompleteInput
              value={formData.chassis_no || ''}
              onChange={(value) => handleInputChange('chassis_no', value)}
              onSelect={handleChassisSelect}
              searchFunction={searchChassisForJournal}
              placeholder="Search by chassis, engine, or invoice no..."
              displayField="chassis_no"
              valueField="chassis_no"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="chassis_no">Chassis No</Label>
              <Input id="chassis_no" name="chassis_no" value={formData.chassis_no || ''} onChange={(e) => handleInputChange('chassis_no', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="model_name">Model Name</Label>
              <Input id="model_name" name="model_name" value={formData.model_name || ''} onChange={(e) => handleInputChange('model_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="invoice_no">Invoice No</Label>
              <Input id="invoice_no" name="invoice_no" value={formData.invoice_no || ''} onChange={(e) => handleInputChange('invoice_no', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="particulars">Particulars</Label>
            <Input
              id="particulars"
              name="particulars"
              value={formData.particulars || ''}
              onChange={(e) => handleInputChange('particulars', e.target.value)}
              placeholder="Enter transaction details manually"
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="narration">Narration</Label>
            <Textarea
              id="narration"
              name="narration"
              value={formData.narration || ''}
              onChange={(e) => handleInputChange('narration', e.target.value)}
            />
          </div>
          {isEditing && (
            <div>
              <Label htmlFor="remark">Remark (Mandatory for edit)</Label>
              <Textarea
                id="remark"
                name="remark"
                value={formData.remark || ''}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                required={isEditing}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => { resetForm(); setActiveTab('list'); }}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Entry' : 'Save Entry'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JournalEntryForm;

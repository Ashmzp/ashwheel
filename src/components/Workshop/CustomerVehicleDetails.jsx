import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, User, Phone, MapPin, Building } from 'lucide-react';
import { getCustomers, saveCustomer } from '@/utils/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CustomerForm from '@/components/Customers/CustomerForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CustomerVehicleDetails = ({ formData, setFormData, errors, workshopSettings }) => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await getCustomers({ pageSize: 99999 });
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (error) {
      toast({ title: 'Error fetching customers', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    const term = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        (c.customer_name && c.customer_name.toLowerCase().includes(term)) ||
        (c.mobile1 && c.mobile1.includes(term))
    );
  }, [customerSearch, customers]);

  const handleCustomerSearch = (e) => {
    const term = e.target.value;
    setCustomerSearch(term);
    setShowCustomerList(!!term);
    if (!term) {
      setSelectedCustomerDetails(null);
      setFormData({
        customer_id: null,
        customer_name: '',
        customer_mobile: '',
        customer_address: '',
        customer_state: '',
      });
    }
  };

  const selectCustomer = (customer) => {
    setFormData({
      customer_id: customer.id,
      customer_name: customer.customer_name,
      customer_mobile: customer.mobile1,
      customer_address: `${customer.address}, ${customer.district}, ${customer.state} - ${customer.pincode}`,
      customer_state: customer.state,
    });
    setSelectedCustomerDetails(customer);
    setCustomerSearch(customer.customer_name);
    setShowCustomerList(false);
  };

  const handleSaveNewCustomer = async (newCustomerData) => {
    try {
      const savedCustomer = await saveCustomer(newCustomerData);
      toast({ title: 'Customer Saved!', description: 'New customer has been added successfully.' });
      setIsCustomerFormOpen(false);
      await fetchCustomers();
      selectCustomer(savedCustomer);
    } catch (error) {
      toast({ title: 'Error', description: `Failed to save customer: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ [id]: value });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="form-section">
        <h3 className="text-lg font-semibold mb-4 text-blue-300">Customer & Vehicle Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
             <div className="relative">
              <Label htmlFor="customer_search">Search Customer {workshopSettings.show_customer_details_mandatory && '*'}</Label>
               <div className="flex gap-2">
                <Input
                    id="customer_search"
                    placeholder="Search by name or mobile..."
                    value={customerSearch}
                    onChange={handleCustomerSearch}
                    className={errors.customer_name ? 'border-red-500' : ''}
                    autoComplete="off"
                />
                <Dialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="flex-shrink-0"><UserPlus className="w-4 h-4 mr-2" /> New</Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <CustomerForm onSave={handleSaveNewCustomer} onCancel={() => setIsCustomerFormOpen(false)} />
                    </DialogContent>
                </Dialog>
               </div>
              {errors.customer_name && <p className="text-red-400 text-sm mt-1">{errors.customer_name}</p>}
              {showCustomerList && filteredCustomers.length > 0 && (
                <ul className="absolute z-10 w-full bg-secondary border border-border rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                  {filteredCustomers.map((c) => (
                    <li key={c.id} onClick={() => selectCustomer(c)} className="p-3 hover:bg-accent cursor-pointer text-sm">
                      <p className="font-semibold">{c.customer_name}</p>
                      <p className="text-muted-foreground">{c.mobile1}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedCustomerDetails && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-secondary/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-300">
                      <User className="w-5 h-5"/>
                      Selected Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-lg font-bold">{selectedCustomerDetails.customer_name}</p>
                    <div className="flex items-center text-muted-foreground">
                      <User className="w-4 h-4 mr-3" />
                      {selectedCustomerDetails.guardian_name || 'N/A'}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="w-4 h-4 mr-3" />
                      {selectedCustomerDetails.mobile1}
                    </div>
                     <div className="flex items-center text-muted-foreground">
                      <Building className="w-4 h-4 mr-3" />
                      GST: {selectedCustomerDetails.gst || 'N/A'}
                    </div>
                    <div className="flex items-start text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-3 mt-1 flex-shrink-0" />
                      <span>{selectedCustomerDetails.address}, {selectedCustomerDetails.district}, {selectedCustomerDetails.state} - {selectedCustomerDetails.pincode}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
              <div>
                <Label htmlFor="invoice_no">Invoice No</Label>
                <Input id="invoice_no" value={formData.invoice_no || ''} disabled className="bg-secondary/50" />
              </div>
              <div>
                <Label htmlFor="invoice_date">Invoice Date</Label>
                <DateInput id="invoice_date" value={formData.invoice_date || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="manual_jc_no">{workshopSettings.manual_jc_no_label || 'Job Card No.'} {workshopSettings.manual_jc_no_mandatory && '*'}</Label>
                <Input id="manual_jc_no" value={formData.manual_jc_no || ''} onChange={handleInputChange} className={errors.manual_jc_no ? 'border-red-500' : ''}/>
                {errors.manual_jc_no && <p className="text-red-400 text-sm mt-1">{errors.manual_jc_no}</p>}
              </div>
          </div>
        </div>

      </div>

      <div className="form-section">
        <div className="form-grid">
          <div>
            <Label htmlFor="reg_no">Reg. No *</Label>
            <Input id="reg_no" value={formData.reg_no || ''} onChange={handleInputChange} className={errors.reg_no ? 'border-red-500' : ''} />
             {errors.reg_no && <p className="text-red-400 text-sm mt-1">{errors.reg_no}</p>}
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Input id="model" value={formData.model || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="frame_no">Frame No (Chassis)</Label>
            <Input id="frame_no" value={formData.frame_no || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="kms">KMS Reading</Label>
            <Input id="kms" value={formData.kms || ''} onChange={handleInputChange} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerVehicleDetails;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { validateMobile, validatePinCode, validateRequired, validateGST } from '@/utils/validation';
import { getSettings } from '@/utils/db/settings';
import useCustomerStore from '@/stores/customerStore';

const CustomerForm = ({ customer, onSave, onCancel }) => {
  const { toast } = useToast();
  const formData = useCustomerStore(state => state);
  const { setFormData, resetForm } = useCustomerStore();
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchAndSetData = async () => {
        const settings = await getSettings();
        const defaults = {
            state: settings.state || '',
            district: settings.district || '',
            pincode: settings.pin_code || ''
        };

        if (customer) {
            // Edit mode - load customer data
            setFormData({
                customer_name: customer.customer_name || '',
                guardian_name: customer.guardian_name || '',
                mobile1: customer.mobile1 || '',
                mobile2: customer.mobile2 || '',
                dob: customer.dob || '',
                address: customer.address || '',
                state: customer.state || defaults.state,
                district: customer.district || defaults.district,
                pincode: customer.pincode || defaults.pincode,
                gst: customer.gst || ''
            });
        } else {
            // Add mode - reset form with defaults only
            resetForm();
            setFormData({
                state: defaults.state,
                district: defaults.district,
                pincode: defaults.pincode,
            });
        }
    };

    fetchAndSetData();
    
  }, [customer, setFormData, resetForm]);

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.customer_name)) newErrors.customer_name = 'Customer name is required';
    if (!validateMobile(formData.mobile1)) newErrors.mobile1 = 'Please enter a valid 10-digit mobile number';
    if (formData.mobile2 && !validateMobile(formData.mobile2)) newErrors.mobile2 = 'Please enter a valid 10-digit mobile number';
    if (!validateRequired(formData.address)) newErrors.address = 'Address is required';
    if (!validateRequired(formData.state)) newErrors.state = 'State is required';
    if (!validateRequired(formData.district)) newErrors.district = 'District is required';
    if (!validatePinCode(formData.pincode)) newErrors.pincode = 'Please enter a valid 6-digit PIN code';
    if (formData.gst && !validateGST(formData.gst)) newErrors.gst = 'Please enter a valid GST number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fix the errors in the form", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({ id: customer?.id || uuidv4(), ...formData });
      
    } catch (error) {
      toast({ title: "Error", description: "Failed to save customer. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelClick = () => {
      onCancel();
  };

  const handleInputChange = (field, value) => {
    setFormData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="gradient-text">{customer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-section">
              <h3 className="text-lg font-semibold mb-4 text-blue-300">Basic Information</h3>
              <div className="form-grid">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input id="customer_name" value={formData.customer_name || ''} onChange={(e) => handleInputChange('customer_name', e.target.value)} className={errors.customer_name ? 'border-red-500' : ''} placeholder="Enter customer name" />
                  {errors.customer_name && <p className="text-red-400 text-sm mt-1">{errors.customer_name}</p>}
                </div>
                <div>
                  <Label htmlFor="guardian_name">Guardian Name (s/o, w/o, d/o)</Label>
                  <Input id="guardian_name" value={formData.guardian_name || ''} onChange={(e) => handleInputChange('guardian_name', e.target.value)} placeholder="e.g., S/O John Doe" />
                </div>
                <div>
                  <Label htmlFor="mobile1">Mobile Number *</Label>
                  <Input id="mobile1" value={formData.mobile1 || ''} onChange={(e) => handleInputChange('mobile1', e.target.value)} className={errors.mobile1 ? 'border-red-500' : ''} placeholder="10-digit mobile number" maxLength={10} />
                  {errors.mobile1 && <p className="text-red-400 text-sm mt-1">{errors.mobile1}</p>}
                </div>
                <div>
                  <Label htmlFor="mobile2">Optional Mobile No.</Label>
                  <Input id="mobile2" value={formData.mobile2 || ''} onChange={(e) => handleInputChange('mobile2', e.target.value)} className={errors.mobile2 ? 'border-red-500' : ''} placeholder="10-digit mobile number" maxLength={10} />
                  {errors.mobile2 && <p className="text-red-400 text-sm mt-1">{errors.mobile2}</p>}
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={formData.dob || ''} onChange={(e) => handleInputChange('dob', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="gst">GST Number</Label>
                  <Input id="gst" value={formData.gst || ''} onChange={(e) => handleInputChange('gst', e.target.value.toUpperCase())} className={errors.gst ? 'border-red-500' : ''} placeholder="15-digit GST number (optional)" maxLength={15} />
                  {errors.gst && <p className="text-red-400 text-sm mt-1">{errors.gst}</p>}
                  <p className="text-sm text-gray-400 mt-1">Leave empty for non-registered customer</p>
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3 className="text-lg font-semibold mb-4 text-blue-300">Address Information</h3>
              <div className="form-grid">
                <div className="md:col-span-2 lg:col-span-3">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} className={errors.address ? 'border-red-500' : ''} placeholder="Enter complete address" />
                  {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" value={formData.state || ''} onChange={(e) => handleInputChange('state', e.target.value)} className={errors.state ? 'border-red-500' : ''} placeholder="Enter state" />
                  {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
                </div>
                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input id="district" value={formData.district || ''} onChange={(e) => handleInputChange('district', e.target.value)} className={errors.district ? 'border-red-500' : ''} placeholder="Enter district" />
                  {errors.district && <p className="text-red-400 text-sm mt-1">{errors.district}</p>}
                </div>
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input id="pincode" value={formData.pincode || ''} onChange={(e) => handleInputChange('pincode', e.target.value)} className={errors.pincode ? 'border-red-500' : ''} placeholder="6-digit PIN code" maxLength={6} />
                  {errors.pincode && <p className="text-red-400 text-sm mt-1">{errors.pincode}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" className="button-glow" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (customer ? 'Update Customer' : 'Save Customer')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
export default CustomerForm;
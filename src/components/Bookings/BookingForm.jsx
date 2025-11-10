import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { validateMobile, validateRequired } from '@/utils/validation';
import { getCurrentDate } from '@/utils/dateUtils';
import useBookingStore from '@/stores/bookingStore';
import { getSettings } from '@/utils/db/settings';

const BookingForm = ({ booking, isEditing, onSave, onCancel, isSaving, isLoading }) => {
  const { toast } = useToast();
  const { formData, setFormData, customFields, setCustomFields } = useBookingStore();
  const [errors, setErrors] = useState({});

  const initializeForm = useCallback(async () => {
    try {
      const settings = await getSettings();
      const bookingSettings = settings?.booking_settings || {};
      const newCustomFields = bookingSettings.customFields || [];
      setCustomFields(newCustomFields);

      if (isEditing && booking) {
        setFormData({
          ...booking,
          booking_date: booking.booking_date || getCurrentDate(),
          custom_fields: booking.custom_fields || {},
        });
      } else if (!isEditing) {
        if (!formData.booking_date) {
            setFormData({
              booking_date: getCurrentDate(),
              status: 'Open',
              custom_fields: {},
            });
        }
      }
    } catch (error) {
      toast({
        title: 'Error initializing form',
        description: 'Could not load booking settings.',
        variant: 'destructive',
      });
    }
  }, [isEditing, booking, toast, setCustomFields, setFormData, formData.booking_date]);

  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  const handleInputChange = (field, value) => {
    setFormData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData({
      custom_fields: {
        ...formData.custom_fields,
        [fieldName]: value,
      },
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!validateRequired(formData.customer_name)) newErrors.customer_name = 'Customer name is required';
    if (!validateMobile(formData.mobile_no)) newErrors.mobile_no = 'Valid mobile number is required';
    if (!validateRequired(formData.booking_date)) newErrors.booking_date = 'Booking date is required';
    if (!validateRequired(formData.model_name)) newErrors.model_name = 'Model name is required';
    
    customFields.forEach(field => {
      if (field.required && !validateRequired(formData.custom_fields?.[field.name])) {
        newErrors[`custom_${field.name}`] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields correctly.', variant: 'destructive' });
      return;
    }
    await onSave(formData, isEditing);
  };

  if (isLoading) return <p>Loading form...</p>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="gradient-text">{isEditing ? 'Edit Booking' : 'Create New Booking'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="booking_date">Booking Date *</Label>
                <Input id="booking_date" name="booking_date" type="date" value={formData.booking_date || ''} onChange={e => handleInputChange('booking_date', e.target.value)} />
                {errors.booking_date && <p className="text-red-500 text-sm">{errors.booking_date}</p>}
              </div>
              <div>
                <Label htmlFor="receipt_no">Receipt No.</Label>
                <Input id="receipt_no" name="receipt_no" value={formData.receipt_no || ''} onChange={e => handleInputChange('receipt_no', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input id="customer_name" name="customer_name" value={formData.customer_name || ''} onChange={e => handleInputChange('customer_name', e.target.value)} />
                {errors.customer_name && <p className="text-red-500 text-sm">{errors.customer_name}</p>}
              </div>
              <div>
                <Label htmlFor="mobile_no">Mobile No. *</Label>
                <Input id="mobile_no" name="mobile_no" value={formData.mobile_no || ''} onChange={e => handleInputChange('mobile_no', e.target.value)} />
                {errors.mobile_no && <p className="text-red-500 text-sm">{errors.mobile_no}</p>}
              </div>
              <div>
                <Label htmlFor="model_name">Model Name *</Label>
                <Input id="model_name" name="model_name" value={formData.model_name || ''} onChange={e => handleInputChange('model_name', e.target.value)} />
                {errors.model_name && <p className="text-red-500 text-sm">{errors.model_name}</p>}
              </div>
              <div>
                <Label htmlFor="colour">Colour</Label>
                <Input id="colour" name="colour" value={formData.colour || ''} onChange={e => handleInputChange('colour', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="booking_amount">Booking Amount</Label>
                <Input id="booking_amount" name="booking_amount" type="number" value={formData.booking_amount || ''} onChange={e => handleInputChange('booking_amount', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="payment_mode">Payment Mode</Label>
                <Select name="payment_mode" value={formData.payment_mode || ''} onValueChange={value => handleInputChange('payment_mode', value)}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delivery_date">Expected Delivery Date</Label>
                <Input id="delivery_date" name="delivery_date" type="date" value={formData.delivery_date || ''} onChange={e => handleInputChange('delivery_date', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={formData.status || 'Open'} onValueChange={value => handleInputChange('status', value)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Postpone">Postpone</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {customFields.map(field => (
                <div key={field.name}>
                  <Label htmlFor={`custom_${field.name}`}>{field.label} {field.required && '*'}</Label>
                  <Input
                    id={`custom_${field.name}`}
                    name={`custom_${field.name}`}
                    value={formData.custom_fields?.[field.name] || ''}
                    onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                  />
                  {errors[`custom_${field.name}`] && <p className="text-red-500 text-sm">{errors[`custom_${field.name}`]}</p>}
                </div>
              ))}
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="remark">Remark</Label>
                <Textarea id="remark" name="remark" value={formData.remark || ''} onChange={e => handleInputChange('remark', e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Booking'}</Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default BookingForm;
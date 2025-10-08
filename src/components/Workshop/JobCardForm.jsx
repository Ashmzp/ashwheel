import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { validateRequired } from '@/utils/validation';
import { getNextJobCardInvoiceNo } from '@/utils/db/jobCards';
import { addDaysToDate, getCurrentDate } from '@/utils/dateUtils';
import CustomerVehicleDetails from '@/components/Workshop/CustomerVehicleDetails';
import JobItems from '@/components/Workshop/JobItems';
import JobSummary from '@/components/Workshop/JobSummary';
import useWorkshopStore from '@/stores/workshopStore';
import { useSettingsStore } from '@/stores/settingsStore';

const JobCardForm = ({ onSave, onCancel, jobCard, isEditing, isSaving, isLoading }) => {
  const { toast } = useToast();
  const formData = useWorkshopStore(state => state);
  const { setFormData, addItem, removeItem, updateItem, resetForm } = useWorkshopStore();
  
  const [errors, setErrors] = useState({});
  const { settings, loading: settingsLoading } = useSettingsStore();
  const workshopSettings = settings.workshop_settings || {};

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ [id]: value });
  };
  
  const initializeForm = useCallback(async () => {
    const nextDueDateDays = parseInt(workshopSettings?.next_due_date_days, 10) || 90;
    if (isEditing) {
      if (jobCard) {
        setFormData(jobCard);
        if (!jobCard.next_due_date) {
          setFormData({ next_due_date: addDaysToDate(new Date(jobCard.invoice_date), nextDueDateDays) });
        }
      }
    } else {
      if (!formData.invoice_no) {
        try {
          const nextInvoiceNo = await getNextJobCardInvoiceNo(new Date());
          setFormData({
            invoice_no: nextInvoiceNo,
            invoice_date: getCurrentDate(),
            next_due_date: addDaysToDate(new Date(), nextDueDateDays),
          });
        } catch (error) {
          toast({ title: 'Error', description: `Failed to get next invoice number: ${error.message}`, variant: 'destructive' });
        }
      } else if (!formData.next_due_date) {
         setFormData({
            next_due_date: addDaysToDate(new Date(), nextDueDateDays),
          });
      }
    }
  }, [isEditing, jobCard, setFormData, toast, workshopSettings, formData.invoice_no, formData.next_due_date]);

  useEffect(() => {
    if(!settingsLoading && workshopSettings){
      initializeForm();
    }
  }, [initializeForm, settingsLoading, workshopSettings]);

  const validateForm = () => {
    const newErrors = {};
    if (workshopSettings.show_customer_details_mandatory && !formData.customer_id) {
      newErrors.customer_name = 'Customer selection is mandatory.';
    }
    if (workshopSettings.manual_jc_no_mandatory && !validateRequired(formData.manual_jc_no)) {
      newErrors.manual_jc_no = `${workshopSettings.manual_jc_no_label} is required.`;
    }
    if (!validateRequired(formData.reg_no)) newErrors.reg_no = 'Vehicle registration number is required.';

    const partsItems = formData.parts_items || [];
    const labourItems = formData.labour_items || [];

    if (partsItems.length === 0 && (!workshopSettings.show_labour_items || labourItems.length === 0)) {
      newErrors.items = 'At least one part or labour item must be added.';
    }

    if (workshopSettings.enable_uom && workshopSettings.uom_mandatory) {
      partsItems.forEach((item, index) => {
        if (!item.uom) {
          newErrors[`part_uom_${index}`] = 'UOM is required.';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    
    const dataToSave = { ...formData, id: isEditing ? jobCard.id : uuidv4() };
    await onSave(dataToSave, !isEditing);
  };
  
  const handleCancelClick = () => {
    onCancel();
  };

  const handleAddItem = (type, item) => {
    const newItem = item || { id: uuidv4(), item_name: '', part_no: '', hsn_code: '', qty: 1, uom: '', rate: 0, discount: 0, gst_rate: 0 };
    addItem(type, newItem);
  };

  const handleItemChange = (type, id, field, value) => {
    updateItem(type, id, field, value);
  };
  
  const handleItemsUpdate = (type, updatedItems) => {
    setFormData({ [`${type}_items`]: updatedItems });
  };


  const handleRemoveItem = (type, id) => {
    removeItem(type, id);
  };

  if (settingsLoading || (isEditing && isLoading)) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <CustomerVehicleDetails 
          formData={formData} 
          setFormData={setFormData} 
          errors={errors} 
          workshopSettings={workshopSettings} 
        />
        <JobItems 
          formData={formData} 
          onAddItem={handleAddItem} 
          onItemChange={handleItemChange} 
          onItemsUpdate={handleItemsUpdate}
          onRemoveItem={handleRemoveItem} 
          workshopSettings={workshopSettings} 
          errors={errors} 
        />
        {errors.items && <p className="text-red-500 text-center">{errors.items}</p>}
        
        {workshopSettings.show_job_details && (
          <JobSummary formData={formData} setFormData={setFormData} />
        )}

        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isSaving}>Cancel</Button>
          <Button type="submit" className="button-glow" disabled={isSaving}>{isSaving ? 'Saving...' : (isEditing ? 'Update Job Card' : 'Create Job Card')}</Button>
        </div>
      </form>
    </motion.div>
  );
};

export default JobCardForm;
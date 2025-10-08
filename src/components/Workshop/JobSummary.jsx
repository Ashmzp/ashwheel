import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea.jsx';
import { useSettingsStore } from '@/stores/settingsStore';

const JobSummary = ({ formData, setFormData }) => {
    const { settings } = useSettingsStore();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ [id]: value });
  };

  const handleSelectChange = (value) => {
    setFormData({ job_type: value });
  };

  const handleDeniedItemsChange = (e) => {
    const items = e.target.value.split('\n');
    setFormData({ denied_items: items });
  };

  const isInterState = useMemo(() => {
    return settings.state && formData.customer_state && settings.state.toLowerCase() !== formData.customer_state.toLowerCase();
  }, [settings.state, formData.customer_state]);

  const { partsTotal, labourTotal, subTotal, cgst, sgst, igst, grandTotal } = useMemo(() => {
    const allItems = [...(formData.parts_items || []), ...(formData.labour_items || [])];
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const partsTotal = (formData.parts_items || []).reduce((acc, item) => {
      const taxable = (item.qty * item.rate) - (item.discount || 0);
      return acc + taxable;
    }, 0);

    const labourTotal = (formData.labour_items || []).reduce((acc, item) => {
      const taxable = (item.qty * item.rate) - (item.discount || 0);
      return acc + taxable;
    }, 0);
    
    const subTotal = partsTotal + labourTotal;

    allItems.forEach(item => {
      const taxableValue = (item.qty * item.rate) - (item.discount || 0);
      const gstRate = parseFloat(item.gst_rate) || 0;
      
      if (isInterState) {
        totalIgst += taxableValue * (gstRate / 100);
      } else {
        totalCgst += taxableValue * (gstRate / 2 / 100);
        totalSgst += taxableValue * (gstRate / 2 / 100);
      }
    });

    const grandTotal = subTotal + totalCgst + totalSgst + totalIgst;
    
    if (formData.total_amount !== grandTotal) {
        setFormData({ total_amount: grandTotal });
    }

    return { partsTotal, labourTotal, subTotal, cgst: totalCgst, sgst: totalSgst, igst: totalIgst, grandTotal };
  }, [formData.parts_items, formData.labour_items, isInterState, formData.total_amount, setFormData]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 form-section">
        <h3 className="text-lg font-semibold mb-4 text-blue-300">Job Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="job_type">Job Type</Label>
              <Select value={formData.job_type || 'Paid Service'} onValueChange={handleSelectChange}>
                <SelectTrigger id="job_type">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid Service">Paid Service</SelectItem>
                  <SelectItem value="Free Service">Free Service</SelectItem>
                  <SelectItem value="Warranty">Warranty</SelectItem>
                  <SelectItem value="Accidental">Accidental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mechanic">Mechanic Name</Label>
              <Input id="mechanic" value={formData.mechanic || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="next_due_date">Next Due Date</Label>
              <Input type="date" id="next_due_date" value={formData.next_due_date || ''} onChange={handleInputChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="denied_items">Denied Jobs / Customer Remarks</Label>
            <Textarea
              id="denied_items"
              placeholder="Enter each denied job or remark on a new line..."
              value={Array.isArray(formData.denied_items) ? formData.denied_items.join('\n') : (formData.denied_items || '')}
              onChange={handleDeniedItemsChange}
              rows={5}
              className="bg-secondary/30"
            />
          </div>
        </div>
      </div>

      <div className="form-section p-6 bg-card rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-primary">Invoice Summary</h3>
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm"><span>Parts Total:</span> <span className="font-semibold">₹{partsTotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-sm"><span>Labour Total:</span> <span className="font-semibold">₹{labourTotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-sm font-bold border-t pt-2"><span>Sub Total:</span> <span>₹{subTotal.toFixed(2)}</span></div>
            {isInterState ? (
                <div className="flex justify-between items-center text-sm"><span>IGST:</span> <span>₹{igst.toFixed(2)}</span></div>
            ) : (
                <>
                    <div className="flex justify-between items-center text-sm"><span>CGST:</span> <span>₹{cgst.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-sm"><span>SGST:</span> <span>₹{sgst.toFixed(2)}</span></div>
                </>
            )}
            <div className="flex justify-between items-center text-xl font-extrabold text-primary border-t-2 border-primary pt-3 mt-3">
                <span>Grand Total:</span>
                <span>₹{Math.round(grandTotal).toFixed(2)}</span>
            </div>
        </div>
      </div>

    </motion.div>
  );
};

export default JobSummary;
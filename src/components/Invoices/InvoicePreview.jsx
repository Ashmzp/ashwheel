import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import DeliveryChallan from './DeliveryChallan';
import TaxInvoice from './TaxInvoice';
import { getCustomers } from '@/utils/db/customers';
import { getSettings } from '@/utils/db/settings';

const InvoicePreview = ({ invoice, formData: initialFormData, customer: initialCustomer, settings: initialSettings, onBack, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ 
    formData: initialFormData, 
    customer: initialCustomer, 
    settings: initialSettings 
  });
  
  const challanRef = useRef();
  const invoiceRef = useRef();

  useEffect(() => {
    const fetchDataForPreview = async () => {
      if (invoice) {
        setLoading(true);
        try {
          const allCustomers = await getCustomers();
          const customerData = allCustomers.find(c => c.id === invoice.customer_id);
          const settingsData = await getSettings();
          setData({
            formData: invoice,
            customer: customerData,
            settings: settingsData,
          });
        } catch (error) {
          console.error("Error fetching data for preview:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setData({
          formData: initialFormData,
          customer: initialCustomer,
          settings: initialSettings,
        });
        setLoading(false);
      }
    };

    fetchDataForPreview();
  }, [invoice, initialFormData, initialCustomer, initialSettings]);


  const handlePrintChallan = useReactToPrint({
    content: () => challanRef.current,
  });

  const handlePrintInvoice = useReactToPrint({
    content: () => invoiceRef.current,
  });

  if (loading) {
    return <div className="p-8 text-center">Loading preview...</div>;
  }
  
  if (!data.formData || !data.customer || !data.settings) {
    return (
       <div className="p-8 text-center">
        <p className="mb-4">Could not load preview data.</p>
        <Button onClick={onClose || onBack} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>
    );
  }

  const handleBackClick = () => {
    if (onClose) {
      onClose(); // From InvoiceList
    } else if (onBack) {
      onBack(); // From InvoiceForm
    }
  };
  
  return (
    <div className="p-4 md:p-8 bg-background text-foreground rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <Button onClick={handleBackClick} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-2">
          <Button onClick={handlePrintChallan} variant="secondary"><Printer className="w-4 h-4 mr-2" /> Print Delivery Challan</Button>
          <Button onClick={handlePrintInvoice}><Printer className="w-4 h-4 mr-2" /> Print Tax Invoice</Button>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-white text-black">
        <h3 className="text-center font-bold text-xl mb-4">Tax Invoice Preview</h3>
        <TaxInvoice ref={invoiceRef} formData={data.formData} customer={data.customer} settings={data.settings} />
      </div>

      <div className="border rounded-lg p-4 bg-white text-black mt-8">
        <h3 className="text-center font-bold text-xl mb-4">Delivery Challan Preview</h3>
        <DeliveryChallan ref={challanRef} formData={data.formData} customer={data.customer} settings={data.settings} />
      </div>

    </div>
  );
};

export default InvoicePreview;
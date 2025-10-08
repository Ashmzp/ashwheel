import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  getVehicleInvoices,
  saveVehicleInvoice, 
  deleteVehicleInvoice as deleteInvoiceFromDb,
  deleteStockByChassis,
  addStock,
  getVehicleInvoiceItems
} from '@/utils/db/index';
import InvoiceList from '@/components/Invoices/InvoiceList';
import InvoiceForm from '@/components/Invoices/InvoiceForm';
import InvoicePreview from '@/components/Invoices/InvoicePreview';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const InvoicesPage = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceToPreview, setInvoiceToPreview] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getVehicleInvoices();
    setInvoices(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleAddInvoice = () => {
    setSelectedInvoice(null);
    setCurrentView('form');
  };

  const handleEditInvoice = async (invoice) => {
    const items = await getVehicleInvoiceItems(invoice.id);
    const invoiceForForm = {
      ...invoice,
      items: items || [],
      custom_field_values: invoice.customer_details || {},
    };
    setSelectedInvoice(invoiceForForm);
    setCurrentView('form');
  };

  const handlePrintInvoice = (invoice) => {
    setInvoiceToPreview(invoice);
  };

  const handleClosePreview = () => {
    setInvoiceToPreview(null);
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      const { itemsToRemoveFromStock, itemsToRestoreToStock } = await saveVehicleInvoice(invoiceData);
      
      if(itemsToRemoveFromStock && itemsToRemoveFromStock.length > 0) {
        await deleteStockByChassis(itemsToRemoveFromStock.map(i => i.chassis_no));
      }

      if(itemsToRestoreToStock && itemsToRestoreToStock.length > 0) {
        await addStock(itemsToRestoreToStock);
      }
      
      toast({
        title: "Success",
        description: `Invoice ${invoiceData.id ? 'updated' : 'created'} successfully!`
      });

      await fetchInvoices();
      setCurrentView('list');
      setSelectedInvoice(null);
    } catch (error) {
       toast({
        title: "Error",
        description: `Failed to save invoice: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const itemsToRestore = await getVehicleInvoiceItems(invoiceId);
    
    if (itemsToRestore && itemsToRestore.length > 0) {
        try {
            await addStock(itemsToRestore);
        } catch (error) {
            toast({
                title: "Stock Restore Error",
                description: `Could not restore items to stock: ${error.message}. Please do it manually.`,
                variant: "destructive"
            });
        }
    }

    await deleteInvoiceFromDb(invoiceId);
    await fetchInvoices();
    toast({
        title: "Invoice Deleted",
        description: "Items from the invoice have been restored to stock.",
    });
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedInvoice(null);
  };

  const renderContent = () => {
    if (invoiceToPreview) {
      return <InvoicePreview invoice={invoiceToPreview} onClose={handleClosePreview} />;
    }

    switch (currentView) {
      case 'form':
        return (
          <InvoiceForm
            invoice={selectedInvoice}
            onSave={handleSaveInvoice}
            onCancel={handleCancel}
          />
        );
      case 'list':
      default:
        return (
          <InvoiceList
            invoices={invoices.map(i => ({...i, items: i.vehicle_invoice_items, total_amount: i.total_amount, customer_type: i.customer_details?.gst ? 'registered' : 'non-registered'}))}
            onAddInvoice={handleAddInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onPrintInvoice={handlePrintInvoice}
            loading={loading}
          />
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Invoices - Showroom Pro</title>
        <meta name="description" content="Create and manage customer invoices." />
      </Helmet>
      <div className="p-4 md:p-8">
        {renderContent()}
      </div>
    </>
  );
};

export default InvoicesPage;
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { getInvoices, saveInvoice, deleteInvoice, getCustomers, getSettings } from '@/utils/storage';
import InvoiceList from '@/components/Invoices/InvoiceList';
import InvoiceForm from '@/components/Invoices/InvoiceForm';
import InvoicePreview from '@/components/Invoices/InvoicePreview';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const PartsInvoicesPage = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [invoicesData, customersData, settingsData] = await Promise.all([
        getInvoices(),
        getCustomers(),
        getSettings()
      ]);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setSettings(settingsData || {});
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddInvoice = () => {
    setSelectedInvoice(null);
    setCurrentView('form');
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('form');
  };

  const handlePreviewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('preview');
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      await saveInvoice(invoiceData);
      toast({
        title: "Success",
        description: `Invoice ${invoiceData.invoice_no} has been saved.`
      });
      await fetchData();
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
    try {
      await deleteInvoice(invoiceId);
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      });
      await fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete invoice.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedInvoice(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'form':
        return (
          <InvoiceForm
            invoice={selectedInvoice}
            onSave={handleSaveInvoice}
            onCancel={handleCancel}
            customers={customers}
            settings={settings}
          />
        );
      case 'preview':
        return (
          <InvoicePreview
            invoice={selectedInvoice}
            settings={settings}
            onBack={handleCancel}
          />
        );
      case 'list':
      default:
        return (
          <InvoiceList
            invoices={invoices}
            onAddInvoice={handleAddInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onPreviewInvoice={handlePreviewInvoice}
            loading={loading}
          />
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Parts Invoices - Showroom Pro</title>
        <meta name="description" content="Manage your parts invoices efficiently." />
      </Helmet>
      <div className="p-4 md:p-8">
        {renderContent()}
      </div>
    </>
  );
};

export default PartsInvoicesPage;
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import { getInvoices, saveInvoices, getStock, saveStock } from '@/utils/storage';

const Invoices = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleAddInvoice = () => {
    setSelectedInvoice(null);
    setCurrentView('form');
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('form');
  };

  const handleSaveInvoice = async (invoiceData) => {
    const invoices = getInvoices();
    const stock = getStock();
    
    if (selectedInvoice) {
      // Update existing invoice
      const oldInvoice = invoices.find(inv => inv.id === selectedInvoice.id);
      
      // Restore old items to stock
      if (oldInvoice && oldInvoice.items) {
        const restoredItems = oldInvoice.items.map(item => ({
          ...item,
          purchaseDate: oldInvoice.invoiceDate,
          purchaseId: `restored-${oldInvoice.id}`,
          id: `restored-${oldInvoice.id}-${item.chassisNo}`
        }));
        
        const stockWithRestored = [...stock, ...restoredItems];
        
        // Remove new items from stock
        const updatedStock = stockWithRestored.filter(stockItem => 
          !invoiceData.items.some(newItem => newItem.chassisNo === stockItem.chassisNo)
        );
        
        saveStock(updatedStock);
      }
      
      // Update invoice
      const updatedInvoices = invoices.map(inv => 
        inv.id === selectedInvoice.id ? invoiceData : inv
      );
      saveInvoices(updatedInvoices);
    } else {
      // Add new invoice
      invoices.push(invoiceData);
      saveInvoices(invoices);
      
      // Remove items from stock
      if (invoiceData.items) {
        const updatedStock = stock.filter(stockItem => 
          !invoiceData.items.some(invoiceItem => invoiceItem.chassisNo === stockItem.chassisNo)
        );
        saveStock(updatedStock);
      }
    }
    
    setCurrentView('list');
    setSelectedInvoice(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedInvoice(null);
  };

  return (
    <>
      <Helmet>
        <title>Invoice Management - Showroom Management System</title>
        <meta name="description" content="Create and manage customer invoices with automatic stock deduction, GST calculations, and comprehensive invoice tracking." />
      </Helmet>

      <div className="p-6">
        {currentView === 'list' ? (
          <InvoiceList
            onAddInvoice={handleAddInvoice}
            onEditInvoice={handleEditInvoice}
          />
        ) : (
          <InvoiceForm
            invoice={selectedInvoice}
            onSave={handleSaveInvoice}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  );
};

export default Invoices;
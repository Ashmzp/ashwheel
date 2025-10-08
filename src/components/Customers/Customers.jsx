import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import CustomerList from './CustomerList';
import CustomerForm from './CustomerForm';
import { saveCustomer } from '@/utils/storage';

const Customers = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setCurrentView('form');
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCurrentView('form');
  };

  const handleSaveCustomer = async (customerData) => {
    await saveCustomer(customerData);
    setCurrentView('list');
    setSelectedCustomer(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedCustomer(null);
  };

  return (
    <>
      <Helmet>
        <title>Customer Management - Showroom Management System</title>
        <meta name="description" content="Manage your showroom customers with comprehensive customer management features including registration, GST tracking, and detailed customer information." />
      </Helmet>

      <div className="p-6">
        {currentView === 'list' ? (
          <CustomerList
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
          />
        ) : (
          <CustomerForm
            customer={selectedCustomer}
            onSave={handleSaveCustomer}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  );
};

export default Customers;
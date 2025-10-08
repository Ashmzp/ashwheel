import React from 'react';
import { Helmet } from 'react-helmet-async';
import Receipt from '@/components/Receipt/Receipt';

const ReceiptPage = () => {
  return (
    <>
      <Helmet>
        <title>Receipts - Showroom Pro</title>
        <meta name="description" content="Manage customer payment receipts." />
      </Helmet>
      <Receipt />
    </>
  );
};

export default ReceiptPage;
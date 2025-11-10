import React from 'react';
import { Helmet } from 'react-helmet-async';
import StockList from '@/components/Stock/StockList';

const StockPage = () => {
  return (
    <>
      <Helmet>
        <title>Stock - Showroom Pro</title>
        <meta name="description" content="View and manage your current vehicle stock." />
      </Helmet>
      <div className="p-4 md:p-6">
        <StockList />
      </div>
    </>
  );
};

export default StockPage;
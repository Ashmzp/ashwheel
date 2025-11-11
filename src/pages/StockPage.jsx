import React from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet-async';
import StockList from '@/components/Stock/StockList';

const StockPage = () => {
  return (
    <>
      <Helmet>
        <title>Stock - Showroom Pro</title>
        <meta name="description" content="View and manage your current vehicle stock." />
      </Helmet>
      <div className="container-responsive py-3 md:py-4">
        <StockList />
      </div>
    </>
  );
};

export default StockPage;
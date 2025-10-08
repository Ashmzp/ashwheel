import React from 'react';
import { Helmet } from 'react-helmet';
import StockList from './StockList';

const Stock = () => {
  return (
    <>
      <Helmet>
        <title>Stock Management - Showroom Management System</title>
        <meta name="description" content="Monitor and manage your vehicle inventory with real-time stock tracking, aging analysis, and comprehensive search capabilities." />
      </Helmet>

      <div className="p-6">
        <StockList />
      </div>
    </>
  );
};

export default Stock;
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import StockList from '@/components/Stock/StockList';
import { useRealtimeData } from '@/hooks/useRealtimeData';

const StockPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const filterQuery = useMemo(() => (query) => {
    if (searchTerm) {
      query = query.or(`model_name.ilike.%${searchTerm}%,chassis_no.ilike.%${searchTerm}%,engine_no.ilike.%${searchTerm}%`);
    }
    if (dateRange.start) query = query.gte('purchase_date', dateRange.start);
    if (dateRange.end) query = query.lte('purchase_date', dateRange.end);
    return query;
  }, [searchTerm, dateRange]);

  const { data: stock, loading, count } = useRealtimeData('stock', {
    page: currentPage,
    pageSize: PAGE_SIZE,
    order: 'purchase_date',
    ascending: false,
    filter: filterQuery,
  });

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <Helmet>
        <title>Stock - Showroom Pro</title>
        <meta name="description" content="View and manage your current vehicle stock." />
      </Helmet>
      <div className="p-4 md:p-8">
        <StockList 
          stock={stock}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateRange={dateRange}
          setDateRange={setDateRange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
};

export default StockPage;
import React from 'react';
import { Helmet } from 'react-helmet-async';
import MISReport from '@/components/Reports/MISReport';

const MISReportPage = () => {
  return (
    <>
      <Helmet>
        <title>MIS Report - Showroom Pro</title>
        <meta name="description" content="Management Information System reports with detailed sales analysis and business insights." />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">MIS Report</h1>
        <MISReport />
      </div>
    </>
  );
};

export default MISReportPage;
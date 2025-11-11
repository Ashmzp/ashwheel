import React from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet-async';
import PartyLedger from '@/components/PartyLedger/PartyLedger';

const PartyLedgerPage = () => {
  return (
    <>
      <Helmet>
        <title>Party Ledger - Showroom Pro</title>
        <meta name="description" content="View customer-wise and transaction-wise ledgers." />
      </Helmet>
      <PartyLedger />
    </>
  );
};

export default PartyLedgerPage;
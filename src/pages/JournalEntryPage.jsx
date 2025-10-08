import React from 'react';
import { Helmet } from 'react-helmet-async';
import JournalEntry from '@/components/JournalEntry/JournalEntry';

const JournalEntryPage = () => {
  return (
    <>
      <Helmet>
        <title>Journal Entry - Showroom Pro</title>
        <meta name="description" content="Manage your journal entries for financial transactions." />
      </Helmet>
      <JournalEntry />
    </>
  );
};

export default JournalEntryPage;
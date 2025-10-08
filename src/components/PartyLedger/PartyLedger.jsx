import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LedgerView from './LedgerView';
import LedgerSummary from './LedgerSummary';

const PartyLedger = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Party Ledger</h2>
        <p className="text-muted-foreground">View customer-wise transaction ledgers and summaries.</p>
      </div>
      <Tabs defaultValue="ledger" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="summary">Ledger Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="ledger">
          <LedgerView />
        </TabsContent>
        <TabsContent value="summary">
          <LedgerSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartyLedger;
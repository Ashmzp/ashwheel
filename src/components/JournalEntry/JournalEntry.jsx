import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JournalEntryForm from './JournalEntryForm';
import JournalEntryList from './JournalEntryList';
import useJournalEntryStore from '@/stores/journalEntryStore';

const JournalEntry = () => {
  const { activeTab, setActiveTab } = useJournalEntryStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Journal Entry</h2>
        <p className="text-muted-foreground">
          Record and manage all your financial transactions.
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Transaction List</TabsTrigger>
          <TabsTrigger value="form">New/Edit Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <JournalEntryList />
        </TabsContent>
        <TabsContent value="form">
          <JournalEntryForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JournalEntry;
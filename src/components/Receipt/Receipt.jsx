import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceiptForm from './ReceiptForm';
import ReceiptList from './ReceiptList';
import useReceiptStore from '@/stores/receiptStore';

const Receipt = () => {
  const { activeTab, setActiveTab } = useReceiptStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Receipts</h2>
        <p className="text-muted-foreground">
          Create and manage customer payment receipts.
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Receipt List</TabsTrigger>
          <TabsTrigger value="form">New/Edit Receipt</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ReceiptList />
        </TabsContent>
        <TabsContent value="form">
          <ReceiptForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Receipt;
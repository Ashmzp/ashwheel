import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import PurchaseList from './PurchaseList';
import PurchaseForm from './PurchaseForm';
import { getPurchases, savePurchase as savePurchaseToDb, deletePurchase as deletePurchaseFromDb } from '@/utils/db/purchases';
import { addStock, deleteStockByChassis } from '@/utils/db/stock';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';

const Purchases = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const { user } = useAuth();

  const handleAddPurchase = () => {
    setSelectedPurchase(null);
    setCurrentView('form');
  };

  const handleEditPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setCurrentView('form');
  };

  const handleSavePurchase = async (purchaseData) => {
    const isUpdating = !!selectedPurchase;

    if(isUpdating) {
        // Remove old items from stock
        const oldPurchase = selectedPurchase;
        if (oldPurchase.items) {
          const oldChassisNos = oldPurchase.items.map(item => item.chassisNo);
          await deleteStockByChassis(oldChassisNos);
        }
    }
    
    // Save purchase
    const savedPurchase = await savePurchaseToDb(purchaseData);
    
    // Add new items to stock
    if (purchaseData.items) {
        const newStockItems = purchaseData.items.map(item => ({
          id: uuidv4(),
          purchase_id: savedPurchase.id,
          model_name: item.modelName,
          chassis_no: item.chassisNo,
          engine_no: item.engineNo,
          colour: item.colour,
          hsn: item.hsn,
          gst: item.gst,
          price: item.price,
          purchase_date: savedPurchase.invoice_date,
          user_id: user.id,
        }));
        await addStock(newStockItems);
    }
    
    setCurrentView('list');
    setSelectedPurchase(null);
  };

  const handleDeletePurchase = async (purchaseId) => {
    const purchases = await getPurchases();
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if(purchaseToDelete && purchaseToDelete.items){
        const chassisNosToDelete = purchaseToDelete.items.map(item => item.chassis_no);
        await deleteStockByChassis(chassisNosToDelete);
    }
    await deletePurchaseFromDb(purchaseId);
    setCurrentView('list'); // Refresh list by re-rendering
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedPurchase(null);
  };

  return (
    <>
      <Helmet>
        <title>Purchase Management - Showroom Management System</title>
        <meta name="description" content="Manage vehicle purchases with comprehensive tracking of chassis numbers, engine numbers, and automatic stock management integration." />
      </Helmet>

      <div className="p-6">
        {currentView === 'list' ? (
          <PurchaseList
            onAddPurchase={handleAddPurchase}
            onEditPurchase={handleEditPurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        ) : (
          <PurchaseForm
            purchase={selectedPurchase}
            onSave={handleSavePurchase}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  );
};

export default Purchases;
import React, { useState, useCallback } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { useToast } from '@/components/ui/use-toast';
    import { 
      getWorkshopPurchases, 
      saveWorkshopPurchase, 
      deleteWorkshopPurchase,
      getWorkshopPurchaseById,
    } from '@/utils/db/workshopPurchases';
    import WorkshopPurchaseForm from '@/components/Workshop/WorkshopPurchaseForm';
    import WorkshopPurchaseList from '@/components/Workshop/WorkshopPurchaseList';
    import { Button } from '@/components/ui/button';
    import { PlusCircle } from 'lucide-react';
    import useWorkshopPurchaseStore from '@/stores/workshopPurchaseStore';
    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    import useFormPersistence from '@/hooks/useFormPersistence';
    import { motion, AnimatePresence } from 'framer-motion';
    
    const WorkshopPurchasesPage = () => {
      const [view, setView] = useState('list');
      const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
      const { toast } = useToast();
      const queryClient = useQueryClient();
      const resetWorkshopPurchaseForm = useWorkshopPurchaseStore(state => state.resetForm);
    
      const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
        queryKey: ['workshopPurchases'],
        queryFn: () => getWorkshopPurchases(),
      });
    
      const { data: selectedPurchase, isFetching: isFetchingSelected } = useQuery({
          queryKey: ['workshopPurchase', selectedPurchaseId],
          queryFn: () => getWorkshopPurchaseById(selectedPurchaseId),
          enabled: !!selectedPurchaseId,
      });
    
      const isEditing = !!selectedPurchaseId;
      const isFormVisible = view === 'form';
    
      const getInitialFormData = useCallback(() => {
        if (isEditing && selectedPurchase) {
          return {
            id: selectedPurchase.id,
            serialNo: selectedPurchase.serial_no,
            invoiceDate: selectedPurchase.invoice_date ? selectedPurchase.invoice_date.split('T')[0] : '',
            invoiceNo: selectedPurchase.invoice_no,
            partyName: selectedPurchase.party_name,
            items: selectedPurchase.items || [],
          };
        }
        return null;
      }, [isEditing, selectedPurchase]);
    
      const { clearState: clearPurchaseFormPersistence } = useFormPersistence(
        useWorkshopPurchaseStore,
        isEditing,
        selectedPurchaseId,
        'workshop_purchase',
        getInitialFormData(),
        isFormVisible
      );
    
      const savePurchaseMutation = useMutation({
        mutationFn: async ({ purchaseData }) => {
            await saveWorkshopPurchase(purchaseData);
        },
        onSuccess: (_, { isEditing }) => {
          queryClient.invalidateQueries({ queryKey: ['workshopPurchases'] });
          queryClient.invalidateQueries({ queryKey: ['workshopInventory'] });
          toast({
            title: "Success!",
            description: `Purchase ${isEditing ? 'updated' : 'saved'} successfully. Inventory will be updated.`,
          });
          setView('list');
          setSelectedPurchaseId(null);
          clearPurchaseFormPersistence();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to save purchase: ${error.message}`,
            variant: "destructive",
          });
        },
      });
    
      const deletePurchaseMutation = useMutation({
        mutationFn: async (purchaseToDelete) => {
          await deleteWorkshopPurchase(purchaseToDelete.id);
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['workshopPurchases'] });
          queryClient.invalidateQueries({ queryKey: ['workshopInventory'] });
          toast({ title: "Success!", description: "Purchase deleted. Inventory will be updated." });
        },
        onError: (error) => {
          toast({ title: "Error", description: `Failed to delete purchase: ${error.message}`, variant: "destructive" });
        }
      });
    
      const handleSave = (purchaseData) => {
        savePurchaseMutation.mutate({ purchaseData, isEditing: !!selectedPurchaseId });
      };
    
      const handleEdit = (purchase) => {
        setSelectedPurchaseId(purchase.id);
        setView('form');
      };
      
      const handleAddNew = () => {
        setSelectedPurchaseId(null);
        resetWorkshopPurchaseForm();
        setView('form');
      };
    
      const handleCancel = () => {
        setView('list');
        setSelectedPurchaseId(null);
        clearPurchaseFormPersistence();
      };
    
      return (
        <>
          <Helmet>
            <title>Workshop Purchases - Ashwheel</title>
            <meta name="description" content="Manage workshop part purchases." />
          </Helmet>
          <div className="container mx-auto p-0 md:p-2">
            <AnimatePresence mode="wait">
              {view === 'list' ? (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold gradient-text">Workshop Purchases</h1>
                    <Button onClick={handleAddNew} className="button-glow">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add New Purchase
                    </Button>
                  </div>
                  {isLoadingPurchases ? (
                    <div className="text-center p-8">Loading purchases...</div>
                  ) : (
                    <WorkshopPurchaseList purchases={purchases} onEdit={handleEdit} onDelete={(p) => deletePurchaseMutation.mutate(p)} />
                  )}
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                   { isEditing && isFetchingSelected ? 
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                      </div> :
                      <WorkshopPurchaseForm isEditing={isEditing} onSave={handleSave} onCancel={handleCancel} />
                   }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      );
    };
    
    export default WorkshopPurchasesPage;
import React from 'react';
import '@/styles/responsive.css';
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
    import { motion, AnimatePresence } from 'framer-motion';
    
    const WorkshopPurchasesPage = () => {
      const { toast } = useToast();
      const queryClient = useQueryClient();
      const { 
        view, setView, 
        selectedPurchaseId, setSelectedPurchaseId,
        resetForm
      } = useWorkshopPurchaseStore();
    
      const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
        queryKey: ['workshopPurchases'],
        queryFn: () => getWorkshopPurchases(),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    
      const { data: selectedPurchase, isFetching: isFetchingSelected } = useQuery({
          queryKey: ['workshopPurchase', selectedPurchaseId],
          queryFn: () => getWorkshopPurchaseById(selectedPurchaseId),
          enabled: !!selectedPurchaseId && view === 'form',
      });
    
      const savePurchaseMutation = useMutation({
        mutationFn: ({ purchaseData, isEditing }) => saveWorkshopPurchase(purchaseData, isEditing),
        onSuccess: (_, { isEditing }) => {
          queryClient.invalidateQueries({ queryKey: ['workshopPurchases'] });
          queryClient.invalidateQueries({ queryKey: ['workshopInventory'] });
          toast({
            title: "Success!",
            description: `Purchase ${isEditing ? 'updated' : 'saved'} successfully. Inventory will be updated.`,
          });
          resetForm();
          setSelectedPurchaseId(null);
          setView('list');
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
        mutationFn: (purchaseToDelete) => deleteWorkshopPurchase(purchaseToDelete.id),
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
        resetForm();
        setSelectedPurchaseId(null);
        setView('form');
      };
    
      const handleCancel = () => {
        resetForm();
        setSelectedPurchaseId(null);
        setView('list');
      };

      const isEditing = !!selectedPurchaseId;
    
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
                  <div className="page-header">
                    <h1 className="text-3xl font-bold gradient-text">Workshop Purchases</h1>
                    <Button onClick={handleAddNew} className="button-glow" className="btn-compact"><PlusCircle className="mr-1 h-3.5 w-3.5" /> Add New Purchase
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
                      <WorkshopPurchaseForm 
                        key={selectedPurchaseId || 'new'}
                        initialData={selectedPurchase}
                        isEditing={isEditing}
                        onSave={handleSave} 
                        onCancel={handleCancel} 
                      />
                   }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      );
    };
    
    export default WorkshopPurchasesPage;
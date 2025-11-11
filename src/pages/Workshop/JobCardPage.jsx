import React, { useState, useEffect } from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/components/ui/use-toast';
import { getJobCards, saveJobCard } from '@/utils/db/jobCards';
import JobCardList from '@/components/Workshop/JobCardList';
import JobCardForm from '@/components/Workshop/JobCardForm';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import useWorkshopStore from '@/stores/workshopStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import useFormPersistence from '@/hooks/useFormPersistence';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const JobCardPage = () => {
  const { activeTab, setActiveTab, selectedJobCardId, setSelectedJobCardId } = useWorkshopStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { resetForm: resetWorkshopForm } = useWorkshopStore();

  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: jobCardsData, isLoading: isLoadingJobCards } = useQuery({
    queryKey: ['jobCards', dateRange],
    queryFn: () => getJobCards({ dateRange }),
    enabled: !!user,
  });

  const jobCards = jobCardsData?.data || [];

  const { data: selectedJobCard, isFetching: isFetchingSelected } = useQuery({
    queryKey: ['jobCard', selectedJobCardId],
    queryFn: async () => {
        if (!selectedJobCardId) return null;
        const { data, error } = await supabase.from('job_cards').select('*').eq('id', selectedJobCardId).single();
        if (error) throw new Error(error.message);
        return data;
    },
    enabled: !!selectedJobCardId && activeTab === 'form',
  });

  const isEditing = !!selectedJobCardId;
  const isFormVisible = activeTab === 'form';

  const { clearState: clearJobCardFormPersistence } = useFormPersistence(
    useWorkshopStore,
    isEditing,
    selectedJobCardId,
    'job_card',
    selectedJobCard,
    isFormVisible
  );

  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('workshop_inventory_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workshop_inventory', filter: `user_id=eq.${user.id}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['workshopInventory'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const handleFormClose = () => {
    resetWorkshopForm();
    setSelectedJobCardId(null);
    clearJobCardFormPersistence();
    setActiveTab('list');
  };

  const saveJobCardMutation = useMutation({
    mutationFn: ({ jobCardData, isNew }) => {
      const originalJobCard = isNew ? null : jobCards.find(jc => jc.id === jobCardData.id);
      return saveJobCard(jobCardData, isNew, originalJobCard);
    },
    onSuccess: (savedData) => {
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
      queryClient.invalidateQueries({ queryKey: ['workshopInventory'] });
      toast({
        title: "Success!",
        description: `Job Card ${savedData.invoice_no} has been saved.`,
      });
      handleFormClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save Job Card: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteJobCardMutation = useMutation({
    mutationFn: async (jobCardId) => {
       const jobCardToDelete = jobCards.find(jc => jc.id === jobCardId);
      if (!jobCardToDelete) throw new Error("Job card not found.");

      const { error } = await supabase.functions.invoke('delete-job-card', {
          body: JSON.stringify({ jobCardId: jobCardToDelete.id, itemsToRestore: jobCardToDelete.parts_items }),
      });

      if (error) throw error;
      return jobCardId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
      queryClient.invalidateQueries({ queryKey: ['workshopInventory'] });
      toast({
        title: "Deleted!",
        description: `Job Card has been deleted and stock restored.`,
      });
    },
    onError: (error) => {
        toast({
            title: "Error",
            description: `Failed to delete Job Card: ${error.message}`,
            variant: "destructive",
        });
    },
  });

  const handleSave = (jobCardData, isNew) => {
    saveJobCardMutation.mutate({ jobCardData, isNew });
  };

  const handleEdit = (jobCard) => {
    setSelectedJobCardId(jobCard.id);
    setActiveTab('form');
  };

  const handleDelete = (jobCardId) => {
    if (window.confirm('Are you sure you want to delete this job card? This action will restore the used parts to your inventory.')) {
      deleteJobCardMutation.mutate(jobCardId);
    }
  };

  const handleAddNew = () => {
    setSelectedJobCardId(null);
    resetWorkshopForm();
    setActiveTab('form');
  };

  return (
    <>
      <Helmet>
        <title>Job Cards - Ashwheel</title>
        <meta name="description" content="Manage workshop job cards and invoices." />
      </Helmet>
      <div className="container-responsive py-3 md:py-4">
        <div className="page-header">
          <h1 className="page-title">Job Card Management</h1>
          <Button onClick={handleAddNew} className="btn-compact bg-red-600 hover:bg-red-700 text-white whitespace-nowrap">
            <PlusCircle className="mr-1 h-3.5 w-3.5" /> Create Job Card
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="form">Form</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-0">
            <JobCardList 
              jobCards={jobCards} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
              isLoading={isLoadingJobCards} 
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </TabsContent>
          <TabsContent value="form" className="mt-0">
            {isFormVisible && (
              <JobCardForm 
                key={selectedJobCardId || 'new'}
                jobCard={selectedJobCard} 
                isEditing={isEditing} 
                onSave={handleSave} 
                onCancel={handleFormClose} 
                isSaving={saveJobCardMutation.isPending}
                isLoading={isFetchingSelected}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default JobCardPage;
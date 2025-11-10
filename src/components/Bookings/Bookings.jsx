import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useBookingStore from '@/stores/bookingStore';
import { saveBooking, deleteBooking, getBookingById } from '@/utils/db/bookings';
import BookingList from './BookingList';
import BookingForm from './BookingForm';

const Bookings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    activeTab,
    setActiveTab,
    selectedBookingId,
    setSelectedBookingId,
    isEditing,
    setIsEditing,
    resetForm,
    resetBookingState,
  } = useBookingStore();

  const { data: selectedBooking, isLoading: isFetchingSelected } = useQuery({
    queryKey: ['booking', selectedBookingId],
    queryFn: () => getBookingById(selectedBookingId),
    enabled: !!selectedBookingId,
  });

  const saveBookingMutation = useMutation({
    mutationFn: ({ bookingData, isEditing }) => saveBooking(bookingData, isEditing),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingSummary'] });
      toast({
        title: 'Success!',
        description: `Booking ${isEditing ? 'updated' : 'created'} successfully.`,
      });
      handleCancel();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save booking: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingSummary'] });
      toast({
        title: 'Success!',
        description: 'Booking deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete booking: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleAdd = () => {
    resetBookingState();
    setIsEditing(false);
    setActiveTab('form');
  };

  const handleEdit = (id) => {
    setSelectedBookingId(id);
    setIsEditing(true);
    setActiveTab('form');
  };

  const handleSave = async (bookingData, isEditingFlag) => {
    await saveBookingMutation.mutateAsync({ bookingData, isEditing: isEditingFlag });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      await deleteBookingMutation.mutateAsync(id);
    }
  };

  const handleCancel = () => {
    resetBookingState();
    setActiveTab('list');
  };

  return (
    <div className="p-2 md:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-0">
          <BookingList onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="form" className="mt-0">
          <BookingForm
            key={selectedBookingId || 'new'}
            booking={selectedBooking}
            isEditing={isEditing}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={saveBookingMutation.isPending}
            isLoading={isFetchingSelected}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Bookings;
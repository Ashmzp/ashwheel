import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getSettings, saveSettings } from '@/utils/db/settings';
import { PlusCircle, Trash2 } from 'lucide-react';

const BookingConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      booking_settings: {
        customFields: [],
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'booking_settings.customFields',
  });

  useEffect(() => {
    if (settings) {
      reset({
        booking_settings: settings.booking_settings || { customFields: [] },
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast({
        title: 'Success',
        description: 'Booking settings saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data) => {
    const updatedSettings = {
      ...settings,
      booking_settings: data.booking_settings,
    };
    mutation.mutate(updatedSettings);
  };

  if (isLoading) {
    return <div>Loading booking settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Configuration</CardTitle>
        <CardDescription>Customize fields for the booking form.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Custom Fields</h3>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label>Field Name</Label>
                      <Input
                        {...register(`booking_settings.customFields.${index}.name`, { required: 'Field name is required' })}
                        placeholder="e.g., salesPerson"
                      />
                      {errors.booking_settings?.customFields?.[index]?.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.booking_settings.customFields[index].name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Field Label</Label>
                      <Input
                        {...register(`booking_settings.customFields.${index}.label`, { required: 'Field label is required' })}
                        placeholder="e.g., Sales Person"
                      />
                      {errors.booking_settings?.customFields?.[index]?.label && (
                        <p className="text-red-500 text-sm mt-1">{errors.booking_settings.customFields[index].label.message}</p>
                      )}
                    </div>
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => append({ name: '', label: '', required: false })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Custom Field
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending || !isDirty}>
              {mutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingConfig;
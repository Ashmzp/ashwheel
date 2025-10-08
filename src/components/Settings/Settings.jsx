import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompanyDetails from './CompanyDetails';
import InvoiceConfig from './InvoiceConfig';
import WorkshopConfig from './WorkshopConfig';
import BookingConfig from './BookingConfig';
import DataBackup from './DataBackup';
import PriceList from './PriceList';
import useSettingsStore from '@/stores/settingsStore';
import { useToast } from '@/components/ui/use-toast';
import { validateCompanyDetails } from '@/utils/validation';
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const {
    settings,
    isSaving,
    isLoading,
    error,
    fetchSettings,
    saveSettings,
    updateSettings,
  } = useSettingsStore();
  const { toast } = useToast();
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    updateSettings({ [name]: value });
  };

  const handleCheckboxChange = (name, checked) => {
    updateSettings({ [name]: checked });
  };

  const handleNonRegFieldChange = (key, prop, value) => {
    const newNonRegFields = {
      ...settings.nonRegFields,
      [key]: { ...settings.nonRegFields[key], [prop]: value },
    };
    updateSettings({ nonRegFields: newNonRegFields });
  };

  const handleCustomFieldChange = (id, value) => {
    const newCustomFields = settings.customFields.map(field =>
      field.id === id ? { ...field, name: value } : field
    );
    updateSettings({ customFields: newCustomFields });
  };

  const addCustomField = () => {
    const newCustomFields = [...(settings.customFields || []), { id: uuidv4(), name: '' }];
    updateSettings({ customFields: newCustomFields });
  };

  const removeCustomField = (id) => {
    const newCustomFields = settings.customFields.filter(field => field.id !== id);
    updateSettings({ customFields: newCustomFields });
  };

  const handleWorkshopSettingsChange = (key, value) => {
    const newWorkshopSettings = { ...settings.workshop_settings, [key]: value };
    updateSettings({ workshop_settings: newWorkshopSettings });
  };

  const handleExtraChargeChange = (id, newName) => {
    const newCharges = settings.workshop_settings.extra_charges.map(charge =>
      charge.id === id ? { ...charge, name: newName } : charge
    );
    handleWorkshopSettingsChange('extra_charges', newCharges);
  };

  const addExtraCharge = () => {
    const newCharges = [...(settings.workshop_settings?.extra_charges || []), { id: uuidv4(), name: '' }];
    handleWorkshopSettingsChange('extra_charges', newCharges);
  };

  const removeExtraCharge = (id) => {
    const newCharges = settings.workshop_settings.extra_charges.filter(charge => charge.id !== id);
    handleWorkshopSettingsChange('extra_charges', newCharges);
  };

  const handleSave = async () => {
    const validationErrors = validateCompanyDetails(settings);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors before saving.',
      });
      return;
    }
    setErrors({});
    await saveSettings();
    if (!useSettingsStore.getState().error) {
      toast({ title: 'Success', description: 'Settings saved successfully.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading settings: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Settings</h2>
        <p className="text-muted-foreground">Manage your application settings and configurations.</p>
      </div>
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="company">Company Details</TabsTrigger>
          <TabsTrigger value="invoice">Invoice Config</TabsTrigger>
          <TabsTrigger value="workshop">Workshop Config</TabsTrigger>
          <TabsTrigger value="booking">Booking Config</TabsTrigger>
          <TabsTrigger value="pricelist">Price List</TabsTrigger>
          <TabsTrigger value="backup">Data Backup</TabsTrigger>
        </TabsList>
        <TabsContent value="company">
          <CompanyDetails
            settings={settings}
            errors={errors}
            handleCompanyChange={handleCompanyChange}
            handleSave={handleSave}
            isSaving={isSaving}
            updateSettings={updateSettings}
          />
        </TabsContent>
        <TabsContent value="invoice">
          <InvoiceConfig
            settings={settings}
            handleCompanyChange={handleCompanyChange}
            handleCheckboxChange={handleCheckboxChange}
            handleNonRegFieldChange={handleNonRegFieldChange}
            handleCustomFieldChange={handleCustomFieldChange}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            handleSave={handleSave}
            isSaving={isSaving}
            handleWorkshopSettingsChange={handleWorkshopSettingsChange}
            handleExtraChargeChange={handleExtraChargeChange}
            addExtraCharge={addExtraCharge}
            removeExtraCharge={removeExtraCharge}
          />
        </TabsContent>
        <TabsContent value="workshop">
          <WorkshopConfig />
        </TabsContent>
        <TabsContent value="booking">
          <BookingConfig />
        </TabsContent>
        <TabsContent value="pricelist">
          <PriceList />
        </TabsContent>
        <TabsContent value="backup">
          <DataBackup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
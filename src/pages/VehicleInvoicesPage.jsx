import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useReactToPrint } from 'react-to-print';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteVehicleInvoice as deleteVehicleInvoiceFromDb,
  getSettings,
  saveVehicleInvoice as saveVehicleInvoiceToDb,
} from '@/utils/db';
import { supabase } from '@/lib/customSupabaseClient';
import { addStock } from '@/utils/db/stock';
import VehicleInvoiceList from '@/components/VehicleInvoices/VehicleInvoiceList';
import VehicleInvoiceForm from '@/components/VehicleInvoices/VehicleInvoiceForm';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import DeliveryChallan from '@/components/Invoices/DeliveryChallan';
import TaxInvoice from '@/components/Invoices/TaxInvoice';
import { initializeShowroomStore, clearShowroomStore } from '@/stores/showroomStore';
import useUIStore from '@/stores/uiStore';
import debounce from 'debounce';
import { getCurrentDate } from '@/utils/dateUtils';
import useVehicleInvoiceStore from '@/stores/vehicleInvoiceStore';

const PAGE_SIZE = 50;

const VehicleInvoicesPage = () => {
  const { openForm, setOpenForm, closeForm } = useUIStore();
  const [printData, setPrintData] = useState(null);

  const { user, canAccess } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const showForm = openForm?.type === 'vehicle_invoice';
  const isEditing = openForm?.mode === 'edit';
  const editingId = openForm?.id;
  
  const {
    searchTerm,
    dateRange,
    pagination,
    setSearchTerm,
    setDateRange,
    setPagination,
  } = useVehicleInvoiceStore();

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const challanPrintRef = useRef();
  const invoicePrintRef = useRef();

  const debouncedSetSearch = useCallback(debounce(setDebouncedSearchTerm, 300), []);
  useEffect(() => {
    debouncedSetSearch(searchTerm);
    setPagination({ currentPage: 1 });
  }, [searchTerm, debouncedSetSearch, setPagination]);

  useEffect(() => {
    setPagination({ currentPage: 1 });
  }, [dateRange, setPagination]);
  
  const queryKey = ['vehicleInvoices', dateRange, debouncedSearchTerm, pagination.currentPage, user.id];

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vehicle_invoices_report_v4', {
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
        p_search_term: debouncedSearchTerm || '',
        p_page_size: PAGE_SIZE,
        p_page_number: pagination.currentPage,
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return { invoices: [], totalCount: 0 };
      }
      
      const invoicesData = data[0]?.invoices_data || [];
      const totalCount = data[0]?.total_count || 0;

      return { invoices: invoicesData, totalCount };
    },
    enabled: !!dateRange.start && !!dateRange.end && !!user,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const invoices = data?.invoices || [];
  const totalCount = data?.totalCount || 0;


  useEffect(() => {
    setPagination({
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
    });
  }, [totalCount, setPagination]);

  useEffect(() => {
    if (showForm) {
        const fetchAndInit = async () => {
            if (isEditing) {
                 const { data: rpcData, error } = await supabase.rpc('get_vehicle_invoices_report_v4', {
                    p_start_date: '1970-01-01',
                    p_end_date: getCurrentDate(),
                    p_search_term: `id:${editingId}`,
                    p_page_size: 1,
                    p_page_number: 1,
                });

                if (error) {
                    toast({ title: "Error", description: "Could not fetch invoice for editing.", variant: 'destructive' });
                    closeForm();
                    return;
                }

                const selectedInvoice = rpcData[0]?.invoices_data?.[0];

                if (!selectedInvoice) {
                     toast({ title: "Not Found", description: "The invoice you were editing could not be found.", variant: 'destructive' });
                     closeForm();
                     return;
                }
                initializeShowroomStore(true, selectedInvoice);
            } else {
                initializeShowroomStore(false, null);
            }
        }
        fetchAndInit();
    }
  }, [showForm, isEditing, editingId, toast, closeForm]);

  const handlePrintChallan = useReactToPrint({
    content: () => challanPrintRef.current,
    onAfterPrint: () => setPrintData(null),
  });

  const handlePrintInvoice = useReactToPrint({
    content: () => invoicePrintRef.current,
    onAfterPrint: () => setPrintData(null),
  });

  const triggerPrint = async (type, invoice) => {
    try {
      const customer = invoice.customer || invoice.customer_details_json;
      const items = invoice.items || [];
      const settings = await queryClient.fetchQuery({ queryKey: ['settings'], queryFn: getSettings });
      
      if (!customer || items.length === 0 || !settings) {
        toast({ title: "Error", description: "Could not fetch all data required for printing.", variant: "destructive" });
        return;
      }
      setPrintData({ type, invoice, customer, items, settings });
    } catch (error) {
      toast({ title: "Error", description: `Failed to prepare print data: ${error.message}`, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (printData) {
      if(printData.type === 'DeliveryChallan') handlePrintChallan();
      if(printData.type === 'TaxInvoice') handlePrintInvoice();
    }
  }, [printData, handlePrintChallan, handlePrintInvoice]);

  const handleAddInvoice = () => {
    setOpenForm({ type: 'vehicle_invoice', mode: 'new' });
  };

  const handleEditInvoice = async (invoice) => {
    setOpenForm({ type: 'vehicle_invoice', mode: 'edit', id: invoice.invoice_id });
  };
  
  const saveInvoiceMutation = useMutation({
    mutationFn: saveVehicleInvoiceToDb,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vehicleInvoices'] });
        queryClient.invalidateQueries({ queryKey: ['stock'] });
    }
  });

  const handleSaveInvoice = async (invoiceData) => {
    try {
      await saveInvoiceMutation.mutateAsync(invoiceData);
      
      toast({
        title: "Success",
        description: `Invoice ${!invoiceData.id ? 'created' : 'updated'} successfully!`
      });

      clearShowroomStore(isEditing, editingId);
      closeForm();
    } catch (error) {
       toast({
        title: "Error",
        description: `Failed to save invoice: ${error.message}`,
        variant: "destructive"
      });
       throw error;
    }
  };

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
        const { data: itemsToRestore, error } = await supabase.from('vehicle_invoice_items').select('*').eq('invoice_id', invoiceId);
        if (error) throw error;
        await deleteVehicleInvoiceFromDb(invoiceId);
        if (itemsToRestore.length > 0) {
            const stockItems = itemsToRestore.map(item => ({
                chassis_no: item.chassis_no,
                engine_no: item.engine_no,
                model_name: item.model_name,
                colour: item.colour,
                price: item.price,
                gst: item.gst,
                hsn: item.hsn,
                purchase_date: new Date().toISOString().split('T')[0],
            }));
            await addStock(stockItems);
        }
    },
    onSuccess: () => {
      toast({
          title: "Invoice Deleted",
          description: "Invoice deleted and items have been restored to stock.",
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to delete invoice: ${error.message}`, variant: "destructive" });
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['vehicleInvoices'] });
        queryClient.invalidateQueries({ queryKey: ['stock'] });
    }
  });

  const handleDeleteInvoice = async (invoiceId) => {
    await deleteInvoiceMutation.mutateAsync(invoiceId);
  };

  const handleCancel = () => {
    clearShowroomStore(isEditing, editingId);
    closeForm();
  };

  const PrintComponent = () => {
    if (!printData) return null;
    const { invoice, customer, items, settings } = printData;
    
    return (
      <div className="hidden">
          <DeliveryChallan ref={challanPrintRef} invoice={invoice} customer={customer} items={items} settings={settings} />
          <TaxInvoice ref={invoicePrintRef} invoice={invoice} customer={customer} items={items} settings={settings} />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vehicle Invoices - Showroom Pro</title>
        <meta name="description" content="Create and manage vehicle invoices with real-time stock adjustment." />
      </Helmet>
      <div className="container-responsive py-3 md:py-4">
        {showForm ? (
          <VehicleInvoiceForm
            onSave={handleSaveInvoice}
            onCancel={handleCancel}
          />
        ) : (
          <VehicleInvoiceList
            invoices={invoices}
            onAddInvoice={handleAddInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onPrint={triggerPrint}
            loading={queryLoading}
            canAccess={canAccess}
            summaryData={null}
            summaryLoading={false}
            dateRange={dateRange}
            setDateRange={setDateRange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            pagination={{...pagination, totalCount}}
            setPagination={setPagination}
          />
        )}
      </div>
      <PrintComponent />
    </>
  );
};

export default VehicleInvoicesPage;
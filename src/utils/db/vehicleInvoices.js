import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { addStock } from './stock';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getVehicleInvoices = async ({ page = 1, pageSize = 50, searchTerm = '', startDate, endDate }) => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase.rpc('get_vehicle_invoices_report_v4', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_search_term: searchTerm,
        p_page_size: pageSize,
        p_page_number: page,
    });

    if (error) {
        console.error("RPC Error fetching invoices:", error);
        throw error;
    }

    const invoices = data[0]?.invoices_data || [];
    const count = data[0]?.total_count || 0;

    return { data: invoices, count, error: null };
};

export const getVehicleInvoiceItems = async (invoiceId) => {
    const { data, error } = await supabase
        .from('vehicle_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
    if (error) throw error;
    return data;
};

export const saveVehicleInvoice = async (invoiceData) => {
    const userId = await getCurrentUserId();
    const isUpdating = !!invoiceData.id;

    let finalInvoiceNo = invoiceData.invoice_no;
    if (!isUpdating || !finalInvoiceNo) {
        const isRegistered = invoiceData.selectedCustomer?.gst && invoiceData.selectedCustomer.gst.trim() !== '';
        const invoiceType = isRegistered ? 'registered' : 'non_registered';
        const { data: generatedNo, error: genError } = await supabase.rpc('generate_and_increment_invoice_no', {
            p_user_id: userId,
            p_invoice_type: invoiceType,
            p_invoice_date: invoiceData.invoice_date
        });
        if (genError) throw genError;
        finalInvoiceNo = generatedNo;
    }

    const invoicePayload = {
        id: invoiceData.id || uuidv4(),
        user_id: userId,
        invoice_no: finalInvoiceNo,
        invoice_date: invoiceData.invoice_date,
        customer_id: invoiceData.selectedCustomer?.id,
        customer_name: invoiceData.selectedCustomer?.customer_name,
        customer_details: {
            ...invoiceData.customer_details,
            gst: invoiceData.selectedCustomer?.gst,
            address: invoiceData.selectedCustomer?.address,
            mobile1: invoiceData.selectedCustomer?.mobile1,
            state: invoiceData.selectedCustomer?.state,
            district: invoiceData.selectedCustomer?.district,
            pincode: invoiceData.selectedCustomer?.pincode,
        },
        extra_charges: invoiceData.extra_charges,
        total_amount: invoiceData.total_amount,
    };

    const { data: savedInvoice, error: invoiceError } = await supabase
        .from('vehicle_invoices')
        .upsert(invoicePayload)
        .select()
        .single();

    if (invoiceError) throw invoiceError;

    const itemsToUpsert = (invoiceData.items || []).map(item => ({
        id: item.id || uuidv4(),
        invoice_id: savedInvoice.id,
        user_id: userId,
        model_name: item.model_name,
        chassis_no: item.chassis_no,
        engine_no: item.engine_no,
        price: item.price,
        colour: item.colour,
        gst: item.gst,
        hsn: item.hsn,
        taxable_value: item.taxable_value,
        cgst_rate: item.cgst_rate,
        sgst_rate: item.sgst_rate,
        igst_rate: item.igst_rate,
        cgst_amount: item.cgst_amount,
        sgst_amount: item.sgst_amount,
        igst_amount: item.igst_amount,
        discount: item.discount,
    }));
    
    // For updates, determine which items were removed to restore them to stock
    if (isUpdating) {
        const { data: oldItems, error: oldItemsError } = await supabase
            .from('vehicle_invoice_items')
            .select('*')
            .eq('invoice_id', savedInvoice.id);
        if (oldItemsError) {
             console.error("Error fetching old items for update check:", oldItemsError);
        } else {
             const newChassisNos = itemsToUpsert.map(i => i.chassis_no);
             const itemsToDelete = oldItems.filter(oi => !newChassisNos.includes(oi.chassis_no));
             const chassisToDeleteFromInvoice = itemsToDelete.map(i => i.chassis_no);

             if (chassisToDeleteFromInvoice.length > 0) {
                 // The trigger will handle stock restoration
                 await supabase.from('vehicle_invoice_items').delete().eq('invoice_id', savedInvoice.id).in('chassis_no', chassisToDeleteFromInvoice);
             }
        }
    }
    
    if (itemsToUpsert.length > 0) {
        // The trigger will handle stock deletion
        const { error: upsertError } = await supabase.from('vehicle_invoice_items').upsert(itemsToUpsert);
        if (upsertError) throw upsertError;
    }

    return savedInvoice;
};

export const deleteVehicleInvoice = async (invoiceId) => {
    // The trigger will handle restoring items to stock based on daily_report_settings
    const { error } = await supabase.from('vehicle_invoices').delete().eq('id', invoiceId);
    if (error) throw error;
    return { error };
};

export const getVehicleInvoicesForExport = async ({ startDate, endDate, searchTerm }) => {
    const { data, error } = await supabase.rpc('get_vehicle_invoices_report_v4', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_search_term: searchTerm,
        p_page_size: 99999,
        p_page_number: 1
    });
    
    if (error) throw error;
    return data[0]?.invoices_data || [];
};
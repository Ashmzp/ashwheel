import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { addStock } from './stock';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getVehicleInvoices = async ({ page = 1, pageSize = 50, searchTerm = '', startDate, endDate }) => {
    try {
        const userId = await getCurrentUserId();
        
        // If search term exists, search in items table first
        let invoiceIds = null;
        if (searchTerm && searchTerm.trim() !== '') {
            const { data: itemsData } = await supabase
                .from('vehicle_invoice_items')
                .select('invoice_id')
                .eq('user_id', userId)
                .or(`chassis_no.ilike.%${searchTerm}%,engine_no.ilike.%${searchTerm}%,model_name.ilike.%${searchTerm}%`);
            
            if (itemsData && itemsData.length > 0) {
                invoiceIds = [...new Set(itemsData.map(item => item.invoice_id))];
            }
        }
        
        let query = supabase
            .from('vehicle_invoices')
            .select('*, vehicle_invoice_items(*), customers(*)', { count: 'exact' })
            .eq('user_id', userId)
            .gte('invoice_date', startDate)
            .lte('invoice_date', endDate)
            .order('invoice_date', { ascending: false });
        
        if (searchTerm && searchTerm.trim() !== '') {
            if (invoiceIds && invoiceIds.length > 0) {
                // Search in both invoice fields and matched invoice IDs from items
                query = query.or(`invoice_no.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,id.in.(${invoiceIds.join(',')})`);
            } else {
                // Only search in invoice fields
                query = query.or(`invoice_no.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
            }
        }
        
        query = query.range((page - 1) * pageSize, page * pageSize - 1);
        
        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to fetch invoices: ${error.message}`);
        }

        // Transform data to match expected format
        const invoices = (data || []).map(inv => ({
            invoice_id: inv.id,
            invoice_no: inv.invoice_no,
            invoice_date: inv.invoice_date,
            customer_name: inv.customer_name,
            grand_total: inv.total_amount,
            customer: inv.customers,
            items: inv.vehicle_invoice_items || [],
            customer_details_json: inv.customer_details,
            extra_charges_json: inv.extra_charges,
            gst_number: inv.customer_details?.gst || inv.customers?.gst || '',
        }));

        return { data: invoices, count: count || 0, error: null };
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch vehicle invoices');
    }
};

export const getVehicleInvoiceItems = async (invoiceId) => {
    try {
        const { data, error } = await supabase
            .from('vehicle_invoice_items')
            .select('*')
            .eq('invoice_id', invoiceId);
        if (error) throw new Error(`Failed to fetch invoice items: ${error.message}`);
        return data;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch vehicle invoice items');
    }
};

export const saveVehicleInvoice = async (invoiceData) => {
    try {
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
            if (genError) throw new Error(`Failed to generate invoice number: ${genError.message}`);
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

        if (invoiceError) throw new Error(`Failed to save invoice: ${invoiceError.message}`);

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
                throw new Error(`Failed to fetch old items: ${oldItemsError.message}`);
            }
            
            const newChassisNos = itemsToUpsert.map(i => i.chassis_no);
            const itemsToDelete = oldItems.filter(oi => !newChassisNos.includes(oi.chassis_no));
            const chassisToDeleteFromInvoice = itemsToDelete.map(i => i.chassis_no);

            if (chassisToDeleteFromInvoice.length > 0) {
                // The trigger will handle stock restoration
                const { error: deleteError } = await supabase
                    .from('vehicle_invoice_items')
                    .delete()
                    .eq('invoice_id', savedInvoice.id)
                    .in('chassis_no', chassisToDeleteFromInvoice);
                
                if (deleteError) throw new Error(`Failed to delete old items: ${deleteError.message}`);
            }
        }
        
        if (itemsToUpsert.length > 0) {
            // The trigger will handle stock deletion
            const { error: upsertError } = await supabase
                .from('vehicle_invoice_items')
                .upsert(itemsToUpsert);
            
            if (upsertError) throw new Error(`Failed to save invoice items: ${upsertError.message}`);
        }

        return savedInvoice;
    } catch (error) {
        throw new Error(error.message || 'Failed to save vehicle invoice');
    }
};

export const deleteVehicleInvoice = async (invoiceId) => {
    try {
        // The trigger will handle restoring items to stock based on daily_report_settings
        const { error } = await supabase.from('vehicle_invoices').delete().eq('id', invoiceId);
        if (error) throw new Error(`Failed to delete invoice: ${error.message}`);
        return { error: null };
    } catch (error) {
        throw new Error(error.message || 'Failed to delete vehicle invoice');
    }
};

export const getVehicleInvoicesForExport = async ({ startDate, endDate, searchTerm }) => {
    try {
        const userId = await getCurrentUserId();
        
        // If search term exists, search in items table first
        let invoiceIds = null;
        if (searchTerm && searchTerm.trim() !== '') {
            const { data: itemsData } = await supabase
                .from('vehicle_invoice_items')
                .select('invoice_id')
                .eq('user_id', userId)
                .or(`chassis_no.ilike.%${searchTerm}%,engine_no.ilike.%${searchTerm}%,model_name.ilike.%${searchTerm}%`);
            
            if (itemsData && itemsData.length > 0) {
                invoiceIds = [...new Set(itemsData.map(item => item.invoice_id))];
            }
        }
        
        let query = supabase
            .from('vehicle_invoices')
            .select('*, vehicle_invoice_items(*), customers(*)')
            .eq('user_id', userId)
            .gte('invoice_date', startDate)
            .lte('invoice_date', endDate)
            .order('invoice_date', { ascending: false });
        
        if (searchTerm && searchTerm.trim() !== '') {
            if (invoiceIds && invoiceIds.length > 0) {
                query = query.or(`invoice_no.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,id.in.(${invoiceIds.join(',')})`);
            } else {
                query = query.or(`invoice_no.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
            }
        }
        
        const { data, error } = await query;
        
        if (error) throw new Error(`Failed to fetch invoices for export: ${error.message}`);
        
        // Transform data to match expected format
        return (data || []).map(inv => ({
            invoice_id: inv.id,
            invoice_no: inv.invoice_no,
            invoice_date: inv.invoice_date,
            customer_name: inv.customer_name,
            grand_total: inv.total_amount,
            customer: inv.customers,
            items: inv.vehicle_invoice_items || [],
            customer_details_json: inv.customer_details,
            extra_charges_json: inv.extra_charges,
            gst_number: inv.customer_details?.gst || inv.customers?.gst || '',
        }));
    } catch (error) {
        throw new Error(error.message || 'Failed to export vehicle invoices');
    }
};
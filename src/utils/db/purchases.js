
import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getPurchases = async ({ page = 1, pageSize = 10, searchTerm = '', startDate, endDate }) => {
    const userId = await getCurrentUserId();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('purchases')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (searchTerm) {
        query = query.or(`invoice_no.ilike.%${searchTerm}%,party_name.ilike.%${searchTerm}%,items->>chassisNo.ilike.%${searchTerm}%`);
    } else {
        if (startDate) {
            query = query.gte('invoice_date', startDate);
        }
        if (endDate) {
            query = query.lte('invoice_date', endDate);
        }
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching purchases:', error);
        throw error;
    }

    return { data, count };
};

export const getPurchaseById = async (id) => {
    const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching purchase by ID:', error);
        throw error;
    }
    return data;
};

export const savePurchase = async (purchaseData) => {
    const userId = await getCurrentUserId();
    const isUpdating = !!purchaseData.id;

    const payload = {
        id: isUpdating ? purchaseData.id : uuidv4(),
        user_id: userId,
        serial_no: purchaseData.serial_no,
        invoice_date: purchaseData.invoiceDate,
        invoice_no: purchaseData.invoiceNo,
        party_name: purchaseData.partyName,
        items: purchaseData.items,
        created_at: isUpdating ? purchaseData.created_at : new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('purchases')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error saving purchase:', error);
        throw error;
    }

    return data;
};

export const deletePurchase = async (id) => {
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
        console.error('Error deleting purchase:', error);
        throw error;
    }
    return { success: true };
};

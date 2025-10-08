import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const saveReceipt = async (receiptData) => {
    const userId = await getCurrentUserId();
    const payload = {
        ...receiptData,
        user_id: userId,
        id: receiptData.id || uuidv4(),
    };
    
    // Remove customer_name as it's not in the receipts table
    delete payload.customer_name;

    const { data, error } = await supabase.from('receipts').upsert(payload).select().single();
    if (error) {
        console.error('Error saving receipt:', error);
        throw error;
    }
    return data;
};

export const getReceipts = async ({ page = 1, pageSize = 10, searchTerm = '' }) => {
    const userId = await getCurrentUserId();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('receipts')
        .select('*, customers(customer_name)', { count: 'exact' })
        .eq('user_id', userId)
        .order('receipt_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (searchTerm) {
        query = query.or(`narration.ilike.%${searchTerm}%,customers.customer_name.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query;
    if (error) {
        console.error('Error fetching receipts:', error);
        throw error;
    }
    return { data, count };
};

export const deleteReceipt = async (id) => {
    const { error } = await supabase.from('receipts').delete().eq('id', id);
    if (error) {
        console.error('Error deleting receipt:', error);
        throw error;
    }
    return { error: null };
};
import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getPriceList = async () => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
        .from('price_list')
        .select('*')
        .eq('user_id', userId)
        .order('model_name');
    
    if (error) {
        console.error('Error fetching price list:', error);
        throw error;
    }
    return data;
};

export const savePriceListItem = async (item) => {
    const userId = await getCurrentUserId();
    const payload = {
        ...item,
        user_id: userId,
        id: item.id || uuidv4(),
    };
    const { data, error } = await supabase.from('price_list').upsert(payload).select().single();
    if (error) {
        console.error('Error saving price list item:', error);
        throw error;
    }
    return data;
};

export const deletePriceListItem = async (id) => {
    const { error } = await supabase.from('price_list').delete().eq('id', id);
    if (error) {
        console.error('Error deleting price list item:', error);
        throw error;
    }
    return { error: null };
};

export const bulkInsertPriceList = async (items) => {
    const userId = await getCurrentUserId();
    const itemsToInsert = items.map(item => ({
        user_id: userId,
        model_name: item['Model Name'],
        price: item['Price'],
        gst: item['GST'],
        category: item['Category'],
    }));

    const { data, error } = await supabase.from('price_list').upsert(itemsToInsert, { onConflict: 'user_id, model_name' });
    if (error) {
        console.error('Error bulk inserting price list:', error);
        throw error;
    }
    return data;
};
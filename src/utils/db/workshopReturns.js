import { supabase } from '@/lib/customSupabaseClient';
import { getCurrentUserId } from '@/utils/db/index';

// WP Return (Workshop Purchase Return)

export const searchWorkshopPurchasesForReturn = async (searchTerm) => {
    const userId = await getCurrentUserId();
    if (!searchTerm) return [];

    const { data, error } = await supabase
        .from('workshop_purchases')
        .select('id, invoice_no, invoice_date, party_name, items')
        .eq('user_id', userId)
        .or(`invoice_no.ilike.%${searchTerm}%,party_name.ilike.%${searchTerm}%`);
    
    if (error) {
        console.error('Error searching workshop purchases:', error);
        throw error;
    }
    
    return data || [];
};

// WS Return (Workshop Sales Return)

export const searchJobCardsForReturn = async (searchTerm) => {
    const userId = await getCurrentUserId();
    if (!searchTerm) return [];

    const { data, error } = await supabase
        .from('job_cards')
        .select('id, invoice_no, invoice_date, customer_name, customer_id, parts_items')
        .eq('user_id', userId)
        .or(`invoice_no.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,reg_no.ilike.%${searchTerm}%`);

    if (error) {
        console.error('Error searching job cards:', error);
        throw error;
    }
    return data || [];
};
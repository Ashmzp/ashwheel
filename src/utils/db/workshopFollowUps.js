import { supabase } from '@/lib/customSupabaseClient';

export const getFollowUps = async (startDate, endDate, searchTerm) => {
    const { data, error } = await supabase.rpc('search_follow_ups', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_search_term: searchTerm,
    });

    if (error) {
        console.error('Error fetching follow-ups:', error);
        throw new Error('Failed to fetch follow-ups.');
    }
    
    return data;
};
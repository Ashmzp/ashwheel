import { supabase } from '@/lib/customSupabaseClient';
    import { getCurrentUserId } from '@/utils/db';
    
    export const getWorkshopPurchases = async ({ searchTerm = '', dateRange = {} } = {}) => {
      const userId = await getCurrentUserId();
      if (!userId) return [];
      
      let query = supabase
        .from('workshop_purchases')
        .select('*')
        .eq('user_id', userId);
    
      if (searchTerm) {
        query = query.or(`party_name.ilike.%${searchTerm}%,invoice_no.ilike.%${searchTerm}%`);
      }
    
      if (dateRange.start) {
        query = query.gte('invoice_date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('invoice_date', dateRange.end);
      }
    
      const { data, error } = await query.order('serial_no', { ascending: false });
      
      if (error) {
        console.error('Error getting workshop purchases:', error);
        throw error;
      }
      return data;
    };
    
    export const getWorkshopPurchaseById = async (id) => {
      if (!id) return null;
      const userId = await getCurrentUserId();
      if (!userId) return null;
    
      const { data, error } = await supabase
        .from('workshop_purchases')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    
      if (error) {
        console.error(`Error fetching workshop purchase by id ${id}:`, error);
        throw error;
      }
      return data;
    };
    
    export const saveWorkshopPurchase = async (purchase) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("User not authenticated.");
    
      const purchaseData = { ...purchase, user_id: userId };
      const { data, error } = await supabase.from('workshop_purchases').upsert(purchaseData, { onConflict: 'id' }).select().single();
      if (error) {
        console.error('Error saving workshop purchase:', error);
        throw error;
      }
      return data;
    };
    
    export const deleteWorkshopPurchase = async (id) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("User not authenticated.");
    
      const { error } = await supabase.from('workshop_purchases').delete().eq('id', id).eq('user_id', userId);
      if (error) {
        console.error('Error deleting workshop purchase:', error);
        throw error;
      }
      return { error };
    };
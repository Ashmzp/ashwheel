import { supabase } from '@/lib/customSupabaseClient';
import { getCurrentUserId } from '@/utils/db';
import { sanitizeSearchTerm } from '@/utils/security/inputValidator';
import { validateSession } from '@/utils/security/authValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';
    
export const getWorkshopPurchases = async ({ searchTerm = '', dateRange = {} } = {}) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    if (!userId) return [];
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    let query = supabase
      .from('workshop_purchases')
      .select('*')
      .eq('user_id', userId);
  
    if (sanitizedSearch) {
      query = query.or(`party_name.ilike.%${sanitizedSearch}%,invoice_no.ilike.%${sanitizedSearch}%`);
    }
    
      if (dateRange.start) {
        query = query.gte('invoice_date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('invoice_date', dateRange.end);
      }
    
    const { data, error } = await query.order('serial_no', { ascending: false });
    
    if (error) {
      logError(error, 'getWorkshopPurchases');
      throw new Error(safeErrorMessage(error));
    }
    return data;
  } catch (error) {
    logError(error, 'getWorkshopPurchases');
    throw new Error(safeErrorMessage(error));
  }
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
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");
  
    const purchaseData = { ...purchase, user_id: userId };
    const { data, error } = await supabase.from('workshop_purchases').upsert(purchaseData, { onConflict: 'id' }).select().single();
    if (error) {
      logError(error, 'saveWorkshopPurchase');
      throw new Error(safeErrorMessage(error));
    }
    return data;
  } catch (error) {
    logError(error, 'saveWorkshopPurchase');
    throw new Error(safeErrorMessage(error));
  }
};
    
export const deleteWorkshopPurchase = async (id) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");
  
    const { error } = await supabase.from('workshop_purchases').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      logError(error, 'deleteWorkshopPurchase');
      throw new Error(safeErrorMessage(error));
    }
    return { error };
  } catch (error) {
    logError(error, 'deleteWorkshopPurchase');
    throw new Error(safeErrorMessage(error));
  }
};
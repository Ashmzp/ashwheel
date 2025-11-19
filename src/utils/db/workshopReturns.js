import { supabase } from '@/lib/customSupabaseClient';
import { getCurrentUserId } from '@/utils/db/index';
import { sanitizeSearchTerm, validateSession } from '@/utils/security/inputValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

// WP Return (Workshop Purchase Return)

export const searchWorkshopPurchasesForReturn = async (searchTerm) => {
    try {
      await validateSession();
      const userId = await getCurrentUserId();
      const sanitizedSearch = sanitizeSearchTerm(searchTerm);
      if (!sanitizedSearch) return [];

      const { data, error } = await supabase
          .from('workshop_purchases')
          .select('id, invoice_no, invoice_date, party_name, items')
          .eq('user_id', userId)
          .or(`invoice_no.ilike.%${sanitizedSearch}%,party_name.ilike.%${sanitizedSearch}%`);
      
      if (error) {
        logError(error, 'searchWorkshopPurchasesForReturn');
        throw new Error(safeErrorMessage(error));
      }
      
      return data || [];
    } catch (error) {
      logError(error, 'searchWorkshopPurchasesForReturn');
      throw new Error(safeErrorMessage(error));
    }
};

// WS Return (Workshop Sales Return)

export const searchJobCardsForReturn = async (searchTerm) => {
    try {
      await validateSession();
      const userId = await getCurrentUserId();
      const sanitizedSearch = sanitizeSearchTerm(searchTerm);
      if (!sanitizedSearch) return [];

      const { data, error } = await supabase
          .from('job_cards')
          .select('id, invoice_no, invoice_date, customer_name, customer_id, parts_items')
          .eq('user_id', userId)
          .or(`invoice_no.ilike.%${sanitizedSearch}%,customer_name.ilike.%${sanitizedSearch}%,reg_no.ilike.%${sanitizedSearch}%`);

      if (error) {
        logError(error, 'searchJobCardsForReturn');
        throw new Error(safeErrorMessage(error));
      }
      return data || [];
    } catch (error) {
      logError(error, 'searchJobCardsForReturn');
      throw new Error(safeErrorMessage(error));
    }
};
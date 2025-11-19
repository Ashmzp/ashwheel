import { supabase } from '@/lib/customSupabaseClient';
import { sanitizeSearchTerm, validateSession } from '@/utils/security/inputValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

export const getFollowUps = async (startDate, endDate, searchTerm) => {
    try {
      await validateSession();
      const sanitizedSearch = sanitizeSearchTerm(searchTerm);
      const { data, error } = await supabase.rpc('search_follow_ups', {
          p_start_date: startDate,
          p_end_date: endDate,
          p_search_term: sanitizedSearch,
      });

      if (error) {
        logError(error, 'getFollowUps');
        throw new Error(safeErrorMessage(error));
      }
      
      return data;
    } catch (error) {
      logError(error, 'getFollowUps');
      throw new Error(safeErrorMessage(error));
    }
};
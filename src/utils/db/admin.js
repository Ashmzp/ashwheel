import { supabase } from '@/lib/customSupabaseClient';
import { validateSession } from '@/utils/security/inputValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

export const getAllUsers = async () => {
    try {
      await validateSession();
      const { data, error } = await supabase.from('users').select('id, email, role, access, created_at');
      if (error) {
        logError(error, 'getAllUsers');
        throw new Error(safeErrorMessage(error));
      }
      return data;
    } catch (error) {
      logError(error, 'getAllUsers');
      throw new Error(safeErrorMessage(error));
    }
};

export const updateUserRoleAndAccess = async (userId, role, access) => {
    try {
      await validateSession();
      const { data, error } = await supabase.from('users').update({ role, access }).eq('id', userId);
      if (error) {
        logError(error, 'updateUserRoleAndAccess');
        throw new Error(safeErrorMessage(error));
      }
      return data;
    } catch (error) {
      logError(error, 'updateUserRoleAndAccess');
      throw new Error(safeErrorMessage(error));
    }
};
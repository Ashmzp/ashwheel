import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { validateSession } from '@/utils/security/authValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getPriceList = async () => {
    try {
      await validateSession();
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
          .from('price_list')
          .select('*')
          .eq('user_id', userId)
          .order('model_name');
      
      if (error) {
        logError(error, 'getPriceList');
        throw new Error(safeErrorMessage(error));
      }
      return data;
    } catch (error) {
      logError(error, 'getPriceList');
      throw new Error(safeErrorMessage(error));
    }
};

export const savePriceListItem = async (item) => {
    try {
      await validateSession();
      const userId = await getCurrentUserId();
    const payload = {
        ...item,
        user_id: userId,
        id: item.id || uuidv4(),
    };
      const { data, error } = await supabase.from('price_list').upsert(payload).select().single();
      if (error) {
        logError(error, 'savePriceListItem');
        throw new Error(safeErrorMessage(error));
      }
      return data;
    } catch (error) {
      logError(error, 'savePriceListItem');
      throw new Error(safeErrorMessage(error));
    }
};

export const deletePriceListItem = async (id) => {
    try {
      await validateSession();
      const { error } = await supabase.from('price_list').delete().eq('id', id);
      if (error) {
        logError(error, 'deletePriceListItem');
        throw new Error(safeErrorMessage(error));
      }
      return { error: null };
    } catch (error) {
      logError(error, 'deletePriceListItem');
      throw new Error(safeErrorMessage(error));
    }
};

export const bulkInsertPriceList = async (items) => {
    try {
      await validateSession();
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
        logError(error, 'bulkInsertPriceList');
        throw new Error(safeErrorMessage(error));
      }
      return data;
    } catch (error) {
      logError(error, 'bulkInsertPriceList');
      throw new Error(safeErrorMessage(error));
    }
};
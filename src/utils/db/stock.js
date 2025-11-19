import { supabase } from '@/lib/customSupabaseClient';
import { sanitizeSearchTerm, validatePageSize } from '@/utils/security/inputValidator';
import { validateSession } from '@/utils/security/authValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const addStock = async (stockItems) => {
  try {
    if (!stockItems || stockItems.length === 0) {
      return { data: [], error: null };
    }
    await validateSession();
    const userId = await getCurrentUserId();
  const itemsToSave = stockItems.map(s => ({
      user_id: userId,
      model_name: s.model_name || s.modelName,
      chassis_no: s.chassis_no || s.chassisNo,
      engine_no: s.engine_no || s.engineNo,
      colour: s.colour || 'N/A',
      price: s.price,
      purchase_date: s.purchase_date || s.invoice_date || s.purchaseDate || new Date(),
      hsn: s.hsn || null,
      gst: s.gst || null,
      category: s.category || null,
      created_at: s.created_at || new Date().toISOString(),
  }));
    const { data, error } = await supabase.from('stock').insert(itemsToSave).select();
    if (error) {
      logError(error, 'addStock');
      throw new Error(safeErrorMessage(error));
    }
    return { data, error };
  } catch (error) {
    logError(error, 'addStock');
    throw new Error(safeErrorMessage(error));
  }
};

export const getStock = async ({ page = 1, pageSize = 500, searchTerm = '' } = {}) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);

    let query = supabase
      .from('stock')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (sanitizedSearch) {
      const searchParts = sanitizedSearch.split(',').map(part => part.trim());
      if (searchParts.length === 2 && searchParts[0] && searchParts[1]) {
          query = query.ilike('model_name', `%${searchParts[0]}%`).ilike('colour', `%${searchParts[1]}%`);
      } else {
          query = query.or(`model_name.ilike.%${sanitizedSearch}%,chassis_no.ilike.%${sanitizedSearch}%,engine_no.ilike.%${sanitizedSearch}%,colour.ilike.%${sanitizedSearch}%,category.ilike.%${sanitizedSearch}%`);
      }
    }

    const { data, error, count } = await query;
    if (error) {
      logError(error, 'getStock');
      throw new Error(safeErrorMessage(error));
    }
    return { data, count };
  } catch (error) {
    logError(error, 'getStock');
    throw new Error(safeErrorMessage(error));
  }
};


export const checkStockExistence = async (chassisNo, engineNo) => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('stock')
      .select('chassis_no, engine_no')
      .eq('user_id', userId)
      .or(`chassis_no.eq.${chassisNo},engine_no.eq.${engineNo}`);

    if (error) {
        console.error('Error checking stock existence:', error);
        return { exists: false, message: 'Could not verify stock.' };
    }

    if (data && data.length > 0) {
        if (data.some(item => item.chassis_no === chassisNo)) {
            return { exists: true, message: `Chassis number ${chassisNo} already exists in your stock.` };
        }
        if (data.some(item => item.engine_no === engineNo)) {
            return { exists: true, message: `Engine number ${engineNo} already exists in your stock.` };
        }
    }

    return { exists: false, message: '' };
};


export const getAllStock = async () => {
  const userId = await getCurrentUserId();
  let allStock = [];
  let lastItem = null;
  const BATCH_SIZE = 1000;

  while (true) {
    const query = supabase
      .from('stock')
      .select('*')
      .eq('user_id', userId)
      .limit(BATCH_SIZE)
      .order('id');

    if (lastItem) {
      query.gt('id', lastItem.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting all stock:', error);
      throw error;
    }

    if (data.length > 0) {
      allStock = allStock.concat(data);
      lastItem = data[data.length - 1];
    }

    if (data.length < BATCH_SIZE) {
      break;
    }
  }
  return allStock;
};


export const searchStock = async (searchTerm) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .eq('user_id', userId)
      .or(`chassis_no.ilike.%${sanitizedSearch}%,engine_no.ilike.%${sanitizedSearch}%,model_name.ilike.%${sanitizedSearch}%`);

    if (error) {
      logError(error, 'searchStock');
      throw new Error(safeErrorMessage(error));
    }
    return data;
  } catch (error) {
    logError(error, 'searchStock');
    throw new Error(safeErrorMessage(error));
  }
};

export const deleteStockByChassis = async (chassisNos) => {
  try {
    if (!chassisNos || chassisNos.length === 0) {
        return {error: null};
    }
    await validateSession();
    const userId = await getCurrentUserId();
    const { error } = await supabase.from('stock')
      .delete()
      .eq('user_id', userId)
      .in('chassis_no', chassisNos);

    if (error) {
      logError(error, 'deleteStockByChassis');
      throw new Error(safeErrorMessage(error));
    }
    return { error };
  } catch (error) {
    logError(error, 'deleteStockByChassis');
    throw new Error(safeErrorMessage(error));
  }
};
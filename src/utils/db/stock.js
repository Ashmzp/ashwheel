import { supabase } from '@/lib/customSupabaseClient';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const addStock = async (stockItems) => {
  if (!stockItems || stockItems.length === 0) {
    return { data: [], error: null };
  }
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
      console.error('Error adding stock:', error);
      throw error;
  }
  return { data, error };
};

export const getStock = async ({ page = 1, pageSize = 9999, searchTerm = '' } = {}) => {
  const userId = await getCurrentUserId();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('stock')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (searchTerm) {
    const searchParts = searchTerm.split(',').map(part => part.trim().toLowerCase());
    if (searchParts.length === 2 && searchParts[0] && searchParts[1]) {
        query = query.ilike('model_name', `%${searchParts[0]}%`).ilike('colour', `%${searchParts[1]}%`);
    } else {
        const lowerSearch = searchTerm.toLowerCase();
        query = query.or(`model_name.ilike.%${lowerSearch}%,chassis_no.ilike.%${lowerSearch}%,engine_no.ilike.%${lowerSearch}%,colour.ilike.%${lowerSearch}%,category.ilike.%${lowerSearch}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('Error getting stock:', error);
    throw error;
  }
  return { data, count };
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
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('stock')
    .select('*')
    .eq('user_id', userId)
    .or(`chassis_no.ilike.%${searchTerm}%,engine_no.ilike.%${searchTerm}%,model_name.ilike.%${searchTerm}%`);

  if (error) {
    console.error('Error searching stock:', error);
    throw error;
  }
  return data;
};

export const deleteStockByChassis = async (chassisNos) => {
  if (!chassisNos || chassisNos.length === 0) {
      return {error: null};
  }
  const userId = await getCurrentUserId();
  const { error } = await supabase.from('stock')
    .delete()
    .eq('user_id', userId)
    .in('chassis_no', chassisNos);

  if (error) {
    console.error('Error deleting stock by chassis numbers:', error);
    throw error;
  }
  return { error };
};
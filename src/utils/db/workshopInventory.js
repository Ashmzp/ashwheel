import { supabase } from '@/lib/customSupabaseClient';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not authenticated in getCurrentUserId. This may be due to a session issue.");
        return null;
    }
    return user.id;
};

export const getWorkshopInventory = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return []; // Return empty array if no user
  
  const { data, error } = await supabase.from('workshop_inventory').select('*').eq('user_id', userId);
  if (error) {
    console.error('Error getting workshop inventory:', error);
    throw error;
  }
  return data;
};

export const upsertWorkshopInventory = async (items) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");
  
  const itemsWithUserId = items.map(item => {
    const newItem = { ...item, user_id: userId };
    // Ensure all expected fields are present to avoid DB errors
    const allFields = ['part_no', 'part_name', 'hsn_code', 'purchase_rate', 'sale_rate', 'quantity', 'gst', 'category', 'uom', 'user_id'];
    allFields.forEach(field => {
        if (newItem[field] === undefined) {
            newItem[field] = null;
        }
    });
    // Handle custom fields
    Object.keys(item).forEach(key => {
        if (key.startsWith('custom_')) {
            newItem[key] = item[key];
        }
    });
    return newItem;
  });

  const { data, error } = await supabase.from('workshop_inventory').upsert(itemsWithUserId, { onConflict: 'part_no, user_id' });
  if (error) {
    console.error('Error upserting workshop inventory:', error);
    throw error;
  }
  return { data, error };
};
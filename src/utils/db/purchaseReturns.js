import { supabase } from '@/lib/customSupabaseClient';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getPurchaseReturns = async ({ page = 1, pageSize = 20, searchTerm = '', dateRange = {} } = {}) => {
  const userId = await getCurrentUserId();
  let query = supabase
    .from('purchase_returns')
    .select(`
      *, 
      purchases(invoice_no)
    `, { count: 'exact' })
    .eq('user_id', userId);

  if (searchTerm) {
    const searchJsonQuery = `items.cs.{"chassisNo":"${searchTerm}"},items.cs.{"engineNo":"${searchTerm}"}`;
    query = query.or(`return_invoice_no.ilike.%${searchTerm}%,party_name.ilike.%${searchTerm}%,${searchJsonQuery}`);
  }
  
  if (dateRange.start) query = query.gte('return_date', dateRange.start);
  if (dateRange.end) query = query.lte('return_date', dateRange.end);
  
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching purchase returns:', error);
    throw error;
  }
  
  // Additional client-side filtering for partial matches in chassis/engine no
  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredData = data.filter(r => {
        const partyMatch = r.party_name.toLowerCase().includes(lowerCaseSearchTerm);
        const invoiceMatch = r.return_invoice_no.toLowerCase().includes(lowerCaseSearchTerm);
        const itemMatch = (Array.isArray(r.items) ? r.items : []).some(item => 
            item.chassisNo?.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.engineNo?.toLowerCase().includes(lowerCaseSearchTerm)
        );
        return partyMatch || invoiceMatch || itemMatch;
    });
    return { data: filteredData, count: filteredData.length };
  }

  return { data, count };
};

export const savePurchaseReturn = async (returnData) => {
  const userId = await getCurrentUserId();
  const dataToSave = { ...returnData, user_id: userId };
  const { data, error } = await supabase.from('purchase_returns').upsert(dataToSave, { onConflict: 'id' }).select().single();
  if (error) {
    console.error('Error saving purchase return:', error);
    throw error;
  }
  return data;
};

export const deletePurchaseReturn = async (id) => {
  const { error } = await supabase.from('purchase_returns').delete().eq('id', id);
  if (error) {
    console.error('Error deleting purchase return:', error);
    throw error;
  }
};

export const searchPurchasesForReturn = async (searchTerm) => {
    const userId = await getCurrentUserId();
    if (!searchTerm) return [];

    const { data, error } = await supabase
        .from('purchases')
        .select(`
            id,
            invoice_no,
            invoice_date,
            party_name,
            items
        `)
        .eq('user_id', userId);
    
    if (error) {
        console.error('Error searching purchases:', error);
        throw error;
    }
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    const filteredData = (data || [])
        .map(purchase => {
            const matchingItems = (Array.isArray(purchase.items) ? purchase.items : []).filter(item => 
                item.chassisNo?.toLowerCase().includes(lowerCaseSearchTerm) || 
                item.engineNo?.toLowerCase().includes(lowerCaseSearchTerm)
            );

            if (matchingItems.length > 0) {
                return {
                    ...purchase,
                    items: matchingItems
                };
            }
            return null;
        })
        .filter(Boolean);

    return filteredData;
};
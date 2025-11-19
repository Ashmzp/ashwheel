import { supabase } from '@/lib/customSupabaseClient';
import { sanitizeSearchTerm, validatePageSize } from '@/utils/security/inputValidator';
import { validateSession } from '@/utils/security/authValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getPurchaseReturns = async ({ page = 1, pageSize = 20, searchTerm = '', dateRange = {} } = {}) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    const validPageSize = validatePageSize(pageSize);
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    let query = supabase
    .from('purchase_returns')
    .select(`
      *, 
      purchases(invoice_no)
    `, { count: 'exact' })
    .eq('user_id', userId);

    if (sanitizedSearch) {
      const searchJsonQuery = `items.cs.{"chassisNo":"${sanitizedSearch}"},items.cs.{"engineNo":"${sanitizedSearch}"}`;
      query = query.or(`return_invoice_no.ilike.%${sanitizedSearch}%,party_name.ilike.%${sanitizedSearch}%,${searchJsonQuery}`);
    }
  
  if (dateRange.start) query = query.gte('return_date', dateRange.start);
  if (dateRange.end) query = query.lte('return_date', dateRange.end);
  
    const from = (page - 1) * validPageSize;
    const to = page * validPageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) {
      logError(error, 'getPurchaseReturns');
      throw new Error(safeErrorMessage(error));
    }
  
    if (sanitizedSearch) {
      const filteredData = data.filter(r => {
          const partyMatch = r.party_name?.toLowerCase().includes(sanitizedSearch);
          const invoiceMatch = r.return_invoice_no?.toLowerCase().includes(sanitizedSearch);
          const itemMatch = (Array.isArray(r.items) ? r.items : []).some(item => 
              item.chassisNo?.toLowerCase().includes(sanitizedSearch) ||
              item.engineNo?.toLowerCase().includes(sanitizedSearch)
          );
          return partyMatch || invoiceMatch || itemMatch;
      });
      return { data: filteredData, count: filteredData.length };
    }

    return { data, count };
  } catch (error) {
    logError(error, 'getPurchaseReturns');
    throw new Error(safeErrorMessage(error));
  }
};

export const savePurchaseReturn = async (returnData) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
  const dataToSave = { ...returnData, user_id: userId };
    const { data, error } = await supabase.from('purchase_returns').upsert(dataToSave, { onConflict: 'id' }).select().single();
    if (error) {
      logError(error, 'savePurchaseReturn');
      throw new Error(safeErrorMessage(error));
    }
    return data;
  } catch (error) {
    logError(error, 'savePurchaseReturn');
    throw new Error(safeErrorMessage(error));
  }
};

export const deletePurchaseReturn = async (id) => {
  try {
    await validateSession();
    const { error } = await supabase.from('purchase_returns').delete().eq('id', id);
    if (error) {
      logError(error, 'deletePurchaseReturn');
      throw new Error(safeErrorMessage(error));
    }
  } catch (error) {
    logError(error, 'deletePurchaseReturn');
    throw new Error(safeErrorMessage(error));
  }
};

export const searchPurchasesForReturn = async (searchTerm) => {
    try {
      await validateSession();
      const userId = await getCurrentUserId();
      const sanitizedSearch = sanitizeSearchTerm(searchTerm);
      if (!sanitizedSearch) return [];

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
        logError(error, 'searchPurchasesForReturn');
        throw new Error(safeErrorMessage(error));
      }
      
      const filteredData = (data || [])
          .map(purchase => {
              const matchingItems = (Array.isArray(purchase.items) ? purchase.items : []).filter(item => 
                  item.chassisNo?.toLowerCase().includes(sanitizedSearch) || 
                  item.engineNo?.toLowerCase().includes(sanitizedSearch)
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
    } catch (error) {
      logError(error, 'searchPurchasesForReturn');
      throw new Error(safeErrorMessage(error));
    }
};
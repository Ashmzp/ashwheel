import { supabase } from '@/lib/customSupabaseClient';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getSalesReturns = async ({ page = 1, pageSize = 20, searchTerm = '', dateRange = {} } = {}) => {
  const userId = await getCurrentUserId();
  let query = supabase
    .from('sales_returns')
    .select(`
      *, 
      vehicle_invoices(invoice_no)
    `, { count: 'exact' })
    .eq('user_id', userId);

  if (searchTerm) {
    const searchJsonQuery = `items.cs.{"chassis_no":"${searchTerm}"},items.cs.{"engine_no":"${searchTerm}"}`;
    query = query.or(`return_invoice_no.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,${searchJsonQuery}`);
  }
  
  if (dateRange.start) query = query.gte('return_date', dateRange.start);
  if (dateRange.end) query = query.lte('return_date', dateRange.end);

  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching sales returns:', error);
    throw error;
  }
  
  // Additional client-side filtering for partial matches in chassis/engine no
  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredData = data.filter(r => {
        const customerMatch = r.customer_name?.toLowerCase().includes(lowerCaseSearchTerm);
        const invoiceMatch = r.return_invoice_no.toLowerCase().includes(lowerCaseSearchTerm);
        const itemMatch = (Array.isArray(r.items) ? r.items : []).some(item => 
            item.chassis_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.engine_no?.toLowerCase().includes(lowerCaseSearchTerm)
        );
        return customerMatch || invoiceMatch || itemMatch;
    });
    return { data: filteredData, count: filteredData.length };
  }

  return { data, count };
};

export const saveSalesReturn = async (returnData) => {
  const userId = await getCurrentUserId();
  const dataToSave = { ...returnData, user_id: userId };
  
  const { data, error } = await supabase.from('sales_returns').upsert(dataToSave, { onConflict: 'id' }).select().single();
  
  if (error) {
    console.error('Error saving sales return:', error);
    throw error;
  }
  return data;
};

export const deleteSalesReturn = async (id) => {
  const { error } = await supabase.from('sales_returns').delete().eq('id', id);
  if (error) {
    console.error('Error deleting sales return:', error);
    throw error;
  }
};

export const searchInvoicesForReturn = async (searchTerm) => {
    const userId = await getCurrentUserId();
    if (!searchTerm) return [];

    const { data: items, error: itemsError } = await supabase
        .from('vehicle_invoice_items')
        .select(`
            chassis_no,
            engine_no,
            model_name,
            colour,
            price,
            hsn,
            gst,
            vehicle_invoices (
                id,
                invoice_no,
                invoice_date,
                customer_name,
                customer_id
            )
        `)
        .eq('user_id', userId)
        .or(`chassis_no.ilike.%${searchTerm}%,engine_no.ilike.%${searchTerm}%`);

    if (itemsError) {
        console.error('Error searching invoice items:', itemsError);
        throw itemsError;
    }

    const results = (items || [])
        .filter(item => item.vehicle_invoices) // Ensure the related invoice exists
        .map(item => ({
            invoice: item.vehicle_invoices,
            item: {
                chassis_no: item.chassis_no,
                engine_no: item.engine_no,
                model_name: item.model_name,
                colour: item.colour,
                price: item.price,
                hsn: item.hsn,
                gst: item.gst
            }
        }));

    return results;
};
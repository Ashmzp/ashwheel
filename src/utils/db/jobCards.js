import { supabase } from '@/lib/customSupabaseClient';
import { getCurrentUserId } from '@/utils/db/index';

export const getNextJobCardInvoiceNo = async (invoiceDate) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const { data, error } = await supabase.rpc('get_next_job_card_invoice_no_v2', {
    p_user_id: userId,
    p_invoice_date: invoiceDate,
  });

  if (error) {
    console.error('Error fetching next job card invoice number:', error);
    throw new Error(error.message || 'Could not generate next invoice number.');
  }

  return data;
};

export const getJobCardById = async (id) => {
  if (!id) return null;

  const { data, error } = await supabase
    .from('job_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching job card:", error);
    // Don't throw error here to prevent app crash on print page, let it return null
    return null;
  }
  return data;
};

export const getJobCards = async ({ searchTerm = '', dateRange = {} }) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: [], count: 0 };

  let query = supabase
    .from('job_cards')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (searchTerm) {
    query = query.or(`customer_name.ilike.%${searchTerm}%,invoice_no.ilike.%${searchTerm}%,reg_no.ilike.%${searchTerm}%`);
  }
  
  if (dateRange.start) {
    query = query.gte('invoice_date', dateRange.start);
  }
  if (dateRange.end) {
    query = query.lte('invoice_date', dateRange.end);
  }

  const { data, error, count } = await query
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching job cards:', error);
    throw error;
  }

  return { data, count };
};

export const saveJobCard = async (jobCard, isNew, originalJobCard) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const jobCardData = { ...jobCard, user_id: userId };

  if (isNew && !jobCardData.invoice_no) {
    const nextInvoiceNo = await getNextJobCardInvoiceNo(jobCardData.invoice_date);
    jobCardData.invoice_no = nextInvoiceNo;
  }

  const { data, error } = await supabase.rpc('save_job_card_and_update_inventory', {
    p_job_card_data: jobCardData,
    p_is_new: isNew,
    p_original_job_card: originalJobCard || null,
  });

  if (error) {
    console.error('Error saving job card:', error);
    throw new Error(error.message || 'An unexpected error occurred.');
  }
  return data;
};

export const deleteJobCard = async (jobCard) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const itemsToRestore = (jobCard.parts_items || []).map(item => ({
    part_no: item.part_no,
    quantity_change: Number(item.qty) || 0
  })).filter(item => item.quantity_change > 0);

  const { data, error } = await supabase.functions.invoke('delete-job-card', {
      body: JSON.stringify({ 
          jobCardId: jobCard.id,
          itemsToRestore: itemsToRestore
      }),
  });

  if (error) {
      console.error('Error invoking delete-job-card function:', error);
      throw new Error(error.details || error.message || 'Failed to delete job card.');
  }

  return data;
};
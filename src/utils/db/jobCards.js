import { supabase } from '@/lib/customSupabaseClient';
import { getCurrentUserId } from '@/utils/db/index';
import { sanitizeSearchTerm } from '@/utils/security/inputValidator';
import { validateSession } from '@/utils/security/authValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

export const getNextJobCardInvoiceNo = async (invoiceDate) => {
  await validateSession();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const { data, error } = await supabase.rpc('get_next_job_card_invoice_no_v2', {
    p_user_id: userId,
    p_invoice_date: invoiceDate,
  });

  if (error) {
    logError(error, 'getNextJobCardInvoiceNo');
    throw new Error(safeErrorMessage(error));
  }

  return data;
};

export const getJobCardById = async (id) => {
  if (!id) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('job_cards')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error("Error fetching job card:", error);
    // Don't throw error here to prevent app crash on print page, let it return null
    return null;
  }
  return data;
};

export const getJobCards = async ({ searchTerm = '', dateRange = {} }) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    if (!userId) return { data: [], count: 0 };
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);

    let query = supabase
      .from('job_cards')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (sanitizedSearch) {
      query = query.or(`customer_name.ilike.%${sanitizedSearch}%,invoice_no.ilike.%${sanitizedSearch}%,reg_no.ilike.%${sanitizedSearch}%`);
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
      logError(error, 'getJobCards');
      throw new Error(safeErrorMessage(error));
    }

    return { data, count };
  } catch (error) {
    logError(error, 'getJobCards');
    throw new Error(safeErrorMessage(error));
  }
};

export const saveJobCard = async (jobCard, isNew, originalJobCard) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

  // Only include valid database columns
  const validColumns = [
    'id', 'user_id', 'invoice_no', 'invoice_date', 'customer_id', 'customer_name',
    'customer_mobile', 'customer_address', 'customer_state', 'manual_jc_no',
    'jc_no', 'kms', 'reg_no', 'frame_no', 'model', 'job_type', 'mechanic',
    'next_due_date', 'parts_items', 'labour_items', 'denied_items', 'total_amount'
  ];

  const jobCardData = {};
  validColumns.forEach(col => {
    if (jobCard[col] !== undefined) {
      jobCardData[col] = jobCard[col];
    }
  });
  jobCardData.user_id = userId;

  if (isNew && !jobCardData.invoice_no) {
    const nextInvoiceNo = await getNextJobCardInvoiceNo(jobCardData.invoice_date);
    jobCardData.invoice_no = nextInvoiceNo;
  }

  // Call RPC function (single source of truth)
  const { data: rpcData, error: rpcError } = await supabase.rpc('save_job_card_and_update_inventory', {
    p_job_card_data: jobCardData,
    p_is_new: isNew,
    p_original_job_card: originalJobCard || null,
  });

  if (rpcError) {
    logError(rpcError, 'saveJobCard:rpc');
    // Show actual database error message (e.g., stock validation errors)
    throw new Error(rpcError.message || safeErrorMessage(rpcError));
  }

  return rpcData;
  } catch (error) {
    logError(error, 'saveJobCard');
    throw new Error(safeErrorMessage(error));
  }
};

export const deleteJobCard = async (jobCard) => {
  try {
    await validateSession();
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    // Delete job card - trigger will automatically restore inventory
    const { error } = await supabase
      .from('job_cards')
      .delete()
      .eq('id', jobCard.id)
      .eq('user_id', userId);

    if (error) {
      logError(error, 'deleteJobCard');
      throw new Error(safeErrorMessage(error));
    }

    return { success: true };
  } catch (error) {
    logError(error, 'deleteJobCard');
    throw new Error(safeErrorMessage(error));
  }
};
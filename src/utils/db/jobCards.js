import { supabase } from '@/lib/customSupabaseClient';
import { getCurrentUserId } from '@/utils/db/index';
import { sanitizeSearchTerm, validateSession } from '@/utils/security/inputValidator';
import { safeErrorMessage, logError } from '@/utils/security/errorHandler';

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

  // Try RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc('save_job_card_and_update_inventory', {
    p_job_card_data: jobCardData,
    p_is_new: isNew,
    p_original_job_card: originalJobCard || null,
  });

  if (!rpcError) {
    return rpcData;
  }

  // Fallback to direct insert/update if RPC fails
  console.warn('RPC function failed, using direct insert and manual inventory update:', rpcError);
  
  let savedJobCard;
  if (isNew) {
    const { data, error } = await supabase
      .from('job_cards')
      .insert([jobCardData])
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting job card:', error);
      throw new Error(error.message || 'Failed to create job card.');
    }
    savedJobCard = data;
  } else {
    const { data, error } = await supabase
      .from('job_cards')
      .update(jobCardData)
      .eq('id', jobCardData.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating job card:', error);
      throw new Error(error.message || 'Failed to update job card.');
    }
    savedJobCard = data;
  }

  // Manually update workshop inventory
  const newParts = jobCardData.parts_items || [];
  const oldParts = originalJobCard?.parts_items || [];

  // Calculate inventory changes
  const inventoryChanges = new Map();

  // Subtract new parts quantities
  newParts.forEach(part => {
    if (part.part_no && part.qty > 0) {
      inventoryChanges.set(part.part_no, (inventoryChanges.get(part.part_no) || 0) - Number(part.qty));
    }
  });

  // Add back old parts quantities
  oldParts.forEach(part => {
    if (part.part_no && part.qty > 0) {
      inventoryChanges.set(part.part_no, (inventoryChanges.get(part.part_no) || 0) + Number(part.qty));
    }
  });

  // Apply inventory changes
  for (const [partNo, qtyChange] of inventoryChanges.entries()) {
    if (qtyChange !== 0) {
      const { error: invError } = await supabase
        .from('workshop_inventory')
        .update({ 
          quantity: supabase.raw(`quantity + ${qtyChange}`)
        })
        .eq('part_no', partNo)
        .eq('user_id', userId);
      
      if (invError) {
        console.error(`Failed to update inventory for part ${partNo}:`, invError);
      }
    }
  }

    return savedJobCard;
  } catch (error) {
    logError(error, 'saveJobCard');
    throw new Error(safeErrorMessage(error));
  }
};

export const deleteJobCard = async (jobCard) => {
  try {
    await validateSession();
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
      logError(error, 'deleteJobCard');
      throw new Error(safeErrorMessage(error));
    }

    return data;
  } catch (error) {
    logError(error, 'deleteJobCard');
    throw new Error(safeErrorMessage(error));
  }
};
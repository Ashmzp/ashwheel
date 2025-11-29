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

  // Try RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc('save_job_card_and_update_inventory', {
    p_job_card_data: jobCardData,
    p_is_new: isNew,
    p_original_job_card: originalJobCard || null,
  });

  if (!rpcError) {
    return rpcData;
  }

  // Check if job card was actually created despite RPC error (serialization issue)
  if (rpcError && jobCardData.id) {
    const { data: existingCard, error: fetchError } = await supabase
      .from('job_cards')
      .select('*')
      .eq('id', jobCardData.id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!fetchError && existingCard) {
      // Job card was created successfully, RPC error was just serialization issue
      return existingCard;
    }
  }

  // Fallback to direct insert/update if RPC fails
  logError(rpcError, 'saveJobCard:rpcFallback');

  // Get settings for stock validation
  const { data: settingsData } = await supabase
    .from('settings')
    .select('workshop_settings')
    .eq('user_id', userId)
    .single();
  
  const preventNegativeStock = settingsData?.workshop_settings?.prevent_negative_stock || false;
  
  let savedJobCard;
  if (isNew) {
    const { data, error } = await supabase
      .from('job_cards')
      .insert([jobCardData])
      .select()
      .single();
    
    if (error) {
      logError(error, 'saveJobCard:insert');
      throw new Error(safeErrorMessage(error));
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
      logError(error, 'saveJobCard:update');
      throw new Error(safeErrorMessage(error));
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

  // Validate stock before saving if prevent_negative_stock is enabled
  if (preventNegativeStock) {
    for (const [partNo, qtyChange] of inventoryChanges.entries()) {
      if (qtyChange < 0) {
        const { data: currentInv, error: fetchError } = await supabase
          .from('workshop_inventory')
          .select('quantity, part_name')
          .eq('part_no', partNo)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (fetchError) {
          logError(fetchError, `saveJobCard:validateStock:${partNo}`);
          throw new Error(`Failed to check stock for Part No: ${partNo}`);
        }
        
        if (!currentInv) {
          throw new Error(`Part No: ${partNo} not found in inventory. Please add it first.`);
        }
        
        const currentStock = parseFloat(currentInv.quantity || 0);
        const finalStock = currentStock + qtyChange;
        
        if (finalStock < 0) {
          throw new Error(`Insufficient stock for ${currentInv.part_name || 'Unknown Part'} (Part No: ${partNo}). Available: ${currentStock}, Required: ${Math.abs(qtyChange)}`);
        }
      }
    }
  }

  // Apply inventory changes (batch for better performance)
  const inventoryUpdates = Array.from(inventoryChanges.entries())
    .filter(([_, qtyChange]) => qtyChange !== 0)
    .map(async ([partNo, qtyChange]) => {
      try {
        const { data: currentInv, error: fetchError } = await supabase
          .from('workshop_inventory')
          .select('quantity')
          .eq('part_no', partNo)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (fetchError) {
          logError(fetchError, `saveJobCard:fetchInventory:${partNo}`);
          return;
        }
        
        if (currentInv) {
          const newQty = parseFloat(currentInv.quantity || 0) + qtyChange;
          const { error: invError } = await supabase
            .from('workshop_inventory')
            .update({ quantity: newQty, last_updated: new Date().toISOString() })
            .eq('part_no', partNo)
            .eq('user_id', userId);
          
          if (invError) {
            logError(invError, `saveJobCard:updateInventory:${partNo}`);
          }
        }
      } catch (err) {
        logError(err, `saveJobCard:inventoryUpdate:${partNo}`);
      }
    });

  await Promise.all(inventoryUpdates);

    return savedJobCard;
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
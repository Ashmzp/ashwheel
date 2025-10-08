import { supabase } from '@/lib/customSupabaseClient';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getInvoices = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
  return data;
};

export const saveInvoice = async (invoice) => {
  const userId = await getCurrentUserId();
  const {data: customerData, error: customerError} = await supabase.from('customers').select('id').eq('customer_name', invoice.customer_name).eq('user_id', userId).single();
  if(customerError) {
      console.error('Error finding customer for invoice', customerError);
      throw new Error("Could not find the specified customer.");
  }

  const invoiceData = {
    id: invoice.id,
    user_id: userId,
    invoice_no: invoice.invoice_no,
    invoice_date: invoice.invoice_date || null,
    customer_id: customerData.id,
    customer_name: invoice.customer_name,
    customer_type: invoice.customer_type,
    items: invoice.items,
    total_amount: invoice.total_amount,
    custom_field_values: invoice.custom_field_values
  };
  const { data, error } = await supabase.from('invoices').upsert(invoiceData, { onConflict: 'id' });
  if (error) {
      console.error('Error saving invoice:', error);
      throw error;
  }
  return { data, error };
};

export const deleteInvoice = async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) {
        console.error('Error deleting invoice:', error);
        throw error;
    }
    return { error };
};
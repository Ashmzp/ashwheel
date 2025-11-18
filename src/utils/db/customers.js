import { supabase } from '@/lib/customSupabaseClient';

    const getCurrentUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated.");
        return user.id;
    };

    export const getCustomers = async ({ page = 1, pageSize = 1000, searchTerm = '', filters = {}, customerId = null } = {}) => {
      const userId = await getCurrentUserId();
      
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (customerId) {
        query = query.eq('id', customerId);
      } else {
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;
        query = query.range(from, to);
      }

      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,mobile1.ilike.%${searchTerm}%,mobile2.ilike.%${searchTerm}%,gst.ilike.%${searchTerm}%`);
      }

      if (filters.type) {
        if (filters.type === 'registered') {
          query = query.not('gst', 'is', null);
        } else if (filters.type === 'non-registered') {
          query = query.is('gst', null);
        }
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (!customerId) {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error getting customers:', error);
        throw error;
      }
      return { data, count };
    };

    export const getFullCustomerDetails = async (customerId) => {
      if (!customerId) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error for non-existent customers
        console.error('Error fetching full customer details:', error);
        throw error;
      }
      return data;
    };

    export const saveCustomer = async (customerToSave) => {
      const userId = await getCurrentUserId();
      
      const customer = {
        id: customerToSave.id || customerToSave.customer_id,
        user_id: userId,
        customer_name: customerToSave.customer_name,
        guardian_name: customerToSave.guardian_name,
        mobile1: customerToSave.mobile1,
        mobile2: customerToSave.mobile2 || null,
        dob: customerToSave.dob || null,
        address: customerToSave.address,
        state: customerToSave.state,
        district: customerToSave.district,
        pincode: customerToSave.pincode,
        gst: customerToSave.gst || null,
        created_at: customerToSave.created_at || new Date().toISOString(),
      };

      if (!customer.id) {
        const { data: existing, error: findError } = await supabase.from('customers').select('id').eq('mobile1', customer.mobile1).eq('user_id', userId).single();
        if (existing) {
            customer.id = existing.id;
        }
      }

      const { data, error } = await supabase.from('customers').upsert(customer).select().single();

      if (error) {
        console.error('Error saving customer:', error);
        if (error.message.includes("Could not find the 'user_id' column")) {
            throw new Error("Database schema mismatch. Please ensure the 'user_id' column exists in the 'customers' table.");
        }
        throw error;
      }
      return data;
    };

    export const deleteCustomer = async (id) => {
      const { data: jobCards, error: jobCardsError } = await supabase
        .from('job_cards')
        .select('id')
        .eq('customer_id', id)
        .limit(1);

      if (jobCardsError) {
        console.error('Error checking for job cards:', jobCardsError);
        throw new Error('Could not verify customer references. Please try again.');
      }

      if (jobCards && jobCards.length > 0) {
        throw new Error('This customer cannot be deleted because they have associated job cards.');
      }

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id')
        .eq('customer_id', id)
        .limit(1);

      if (invoicesError) {
        console.error('Error checking for invoices:', invoicesError);
        throw new Error('Could not verify customer references. Please try again.');
      }

      if (invoices && invoices.length > 0) {
        throw new Error('This customer cannot be deleted because they have associated invoices.');
      }

      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        console.error('Error deleting customer:', error);
        if (error.message.includes('violates foreign key constraint')) {
            throw new Error('This customer is linked to other records (like invoices or job cards) and cannot be deleted.');
        }
        throw error;
      }
      return { error };
    };
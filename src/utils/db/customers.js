import { supabase } from '@/lib/customSupabaseClient';
import { sanitizeQueryParams, validatePageSize, validateEmail, validatePhone } from '../security/inputValidator';
import { handleAsyncError, logError } from '../security/errorHandler';
import { validateSession } from '../security/authValidator';

    const getCurrentUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated.");
        return user.id;
    };

    export const getCustomers = async ({ page = 1, pageSize = 1000, searchTerm = '', filters = {}, customerId = null } = {}) => {
      try {
        await validateSession();
        const userId = await getCurrentUserId();
        
        const sanitized = sanitizeQueryParams({ searchTerm, startDate: filters.startDate, endDate: filters.endDate, page, pageSize });
        const validPageSize = validatePageSize(sanitized.pageSize || pageSize);
        const validPage = Math.max(1, sanitized.page || page);
        
        let query = supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);

        if (customerId) {
          query = query.eq('id', customerId);
        } else {
          const from = (validPage - 1) * validPageSize;
          const to = validPage * validPageSize - 1;
          query = query.range(from, to);
        }

        if (sanitized.searchTerm) {
          query = query.or(`customer_name.ilike.%${sanitized.searchTerm}%,mobile1.ilike.%${sanitized.searchTerm}%,mobile2.ilike.%${sanitized.searchTerm}%,gst.ilike.%${sanitized.searchTerm}%`);
        }

        if (filters.type) {
          if (filters.type === 'registered') {
            query = query.not('gst', 'is', null);
          } else if (filters.type === 'non-registered') {
            query = query.is('gst', null);
          }
        }

        if (sanitized.startDate) {
          query = query.gte('created_at', sanitized.startDate);
        }
        if (sanitized.endDate) {
          query = query.lte('created_at', sanitized.endDate);
        }

        if (!customerId) {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error, count } = await query;

        if (error) {
          logError(error, { function: 'getCustomers', userId });
          throw new Error('Failed to fetch customers');
        }
        return { data: data || [], count: count || 0 };
      } catch (error) {
        logError(error, { function: 'getCustomers' });
        throw error;
      }
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
      try {
        await validateSession();
        const userId = await getCurrentUserId();
        
        if (!validatePhone(customerToSave.mobile1)) {
          throw new Error('Invalid mobile number');
        }
        
        const customer = {
          id: customerToSave.id || customerToSave.customer_id,
          user_id: userId,
          customer_name: customerToSave.customer_name?.trim().substring(0, 100),
          guardian_name: customerToSave.guardian_name?.trim().substring(0, 100),
          mobile1: customerToSave.mobile1?.replace(/[^0-9]/g, '').substring(0, 10),
          mobile2: customerToSave.mobile2?.replace(/[^0-9]/g, '').substring(0, 10) || null,
          dob: customerToSave.dob || null,
          address: customerToSave.address?.trim().substring(0, 500),
          state: customerToSave.state?.trim().substring(0, 100),
          district: customerToSave.district?.trim().substring(0, 100),
          pincode: customerToSave.pincode?.replace(/[^0-9]/g, '').substring(0, 6),
          gst: customerToSave.gst?.trim().substring(0, 15) || null,
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
    } catch (error) {
      logError(error, { function: 'saveCustomer' });
      throw error;
    }
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
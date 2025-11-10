import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const getBookings = async ({ page = 1, pageSize = 10, searchTerm = '', startDate, endDate }) => {
    const userId = await getCurrentUserId();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('booking_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (pageSize !== 10000) {
        query = query.range(from, to);
    }

    if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,mobile_no.ilike.%${searchTerm}%,model_name.ilike.%${searchTerm}%,receipt_no.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`);
    } else {
        if (startDate) {
            query = query.gte('booking_date', startDate);
        }
        if (endDate) {
            query = query.lte('booking_date', endDate);
        }
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }

    return { data, count };
};

export const getBookingById = async (id) => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // PostgREST error for "exact-one" row not found
            const { data: adminData, error: adminError } = await supabase
                .rpc('get_user_role')
                .then(async ({data: role}) => {
                    if (role === 'admin') {
                        return await supabase.from('bookings').select('*').eq('id', id).single();
                    }
                    return { data: null, error: new Error("Not found or not an admin.") };
                });
            if (adminError) {
                console.error('Error fetching booking as admin:', adminError);
                throw adminError;
            }
            return adminData;
        }
        console.error('Error fetching booking by ID:', error);
        throw error;
    }
    return data;
};

export const saveBooking = async (bookingData, isEditing) => {
    const userId = await getCurrentUserId();
    const { data: { role } } = await supabase.rpc('get_user_role').then(res => ({data: {role: res.data}}));

    if (isEditing) {
        if (role !== 'admin') {
            const { data: existingBooking, error: fetchError } = await supabase
                .from('bookings')
                .select('id')
                .eq('id', bookingData.id)
                .eq('user_id', userId)
                .single();

            if (fetchError || !existingBooking) {
                throw new Error("Unauthorized: You can only edit your own bookings.");
            }
        }
    }
    
    const payload = {
        ...bookingData,
        user_id: isEditing ? bookingData.user_id : userId,
        id: isEditing ? bookingData.id : uuidv4(),
    };

    const { data, error } = await supabase
        .from('bookings')
        .upsert(payload)
        .select()
        .single();

    if (error) {
        console.error('Error saving booking:', error);
        throw error;
    }

    return data;
};

export const deleteBooking = async (id) => {
    const userId = await getCurrentUserId();
    const { data: { role } } = await supabase.rpc('get_user_role').then(res => ({data: {role: res.data}}));
    
    let query = supabase.from('bookings').delete().eq('id', id);
    if(role !== 'admin'){
        query = query.eq('user_id', userId);
    }
        
    const { error } = await query;
        
    if (error) {
        console.error('Error deleting booking:', error);
        throw error;
    }
    return { success: true };
};

export const getBookingSummary = async (startDate, endDate) => {
    const { data, error } = await supabase.rpc('get_booking_summary', {
        p_start_date: startDate,
        p_end_date: endDate,
    });

    if (error) {
        console.error('Error fetching booking summary:', error);
        throw error;
    }
    return data[0];
};
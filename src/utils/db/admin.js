import { supabase } from '@/lib/customSupabaseClient';

export const getAllUsers = async () => {
    const { data, error } = await supabase.from('users').select('id, email, role, access, created_at');
    if (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
    return data;
};

export const updateUserRoleAndAccess = async (userId, role, access) => {
    const { data, error } = await supabase.from('users').update({ role, access }).eq('id', userId);
    if (error) {
        console.error('Error updating user permissions:', error);
        throw error;
    }
    return data;
};
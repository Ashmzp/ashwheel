/**
 * Critical Security: Authentication & Session Validation
 */

import { supabase } from '../../lib/customSupabaseClient';

export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { valid: false, session: null };
    }
    
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    
    if (expiresAt <= now) {
      return { valid: false, session: null, expired: true };
    }
    
    return { valid: true, session };
  } catch (error) {
    return { valid: false, session: null, error };
  }
};

export const refreshSessionIfNeeded = async () => {
  const { valid, expired } = await validateSession();
  
  if (expired) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { success: true, session: data.session };
    } catch (error) {
      return { success: false, error };
    }
  }
  
  return { success: valid };
};

export const requireAuth = async () => {
  const { valid, session } = await validateSession();
  
  if (!valid) {
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  return session;
};

export const checkPermission = (userRole, requiredRole) => {
  const roleHierarchy = { admin: 3, manager: 2, user: 1 };
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};
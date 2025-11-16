import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useUserData as useUserDataHook } from '@/hooks/useUserData';
import { usePermissions as usePermissionsHook } from '@/hooks/usePermissions';
import { getSettings } from '@/utils/db/settings';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import useAutoLogout from '@/hooks/useAutoLogout';

const AuthContext = createContext(undefined);

const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

export const NewAuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearSessionData = useCallback(() => {
    setUser(null);
    setSession(null);
    
    try {
        const deviceId = localStorage.getItem('device_id');
        localStorage.clear();
        if (deviceId) {
            localStorage.setItem('device_id', deviceId);
        }
        sessionStorage.clear();
    } catch (e) {
        console.error("Error clearing local/session storage", e);
    }
  }, []);

  const signOut = useCallback(async (isAutoLogout = false) => {
    setLoading(true);
    const deviceId = getDeviceId();
    const currentUserId = session?.user?.id;

    if (currentUserId) {
        await supabase.from('active_sessions').delete().match({ user_id: currentUserId, session_id: deviceId });
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      if (!isAutoLogout) {
        toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
      }
    }
    
    clearSessionData();
    setLoading(false);

    if (isAutoLogout) {
        toast({
            title: "Session Expired",
            description: "You have been logged out due to inactivity.",
            variant: "destructive",
            duration: 5000,
        });
    }
    navigate('/login');
  }, [navigate, toast, session, clearSessionData]);

  useAutoLogout(user, signOut);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    setLoading(false);
  }, []);
  
  useEffect(() => {
    const getSessionAndUser = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
           console.error("getSession error on initial load:", sessionError.message);
           handleSession(null);
           return;
        }

        if (currentSession) {
            handleSession(currentSession);
        } else {
            handleSession(null);
        }
      } catch (error) {
        console.error("Error in getSessionAndUser:", error);
        handleSession(null);
      }
    };

    getSessionAndUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === "SIGNED_IN") {
            handleSession(currentSession);
            if(currentSession?.user) {
              await getSettings().catch(e => console.error("Failed to fetch settings on sign in", e));
            }
        } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESH_FAILED") {
           clearSessionData();
           if (event === "TOKEN_REFRESH_FAILED") {
             toast({ title: "Session Expired", description: "Please login again.", variant: "destructive" });
           }
           navigate('/login');
        } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
           handleSession(currentSession);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession, clearSessionData, navigate]);

  const { userData, loadingUserData, refetchUserData } = useUserDataHook(user, signOut);
  const { access, can } = usePermissionsHook(userData);

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!userData?.app_valid_till) {
      setIsExpired(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setIsExpired(userData.app_valid_till < today);
  }, [userData]);

  const canAccess = useCallback((module, action = 'read') => {
    if (userData?.role === 'admin') return true;
    if (!module) return true;
    if (isExpired && action !== 'read') return false; // Read-only on expiry
    return can(module, action);
  }, [userData, can, isExpired]);

  const canWrite = useCallback((module) => {
    if (isExpired) return false;
    return canAccess(module, 'write');
  }, [isExpired, canAccess]);

  const canDelete = useCallback((module) => {
    if (isExpired) return false;
    return canAccess(module, 'delete');
  }, [isExpired, canAccess]);


  const signUp = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }
    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: signInError.message || "Something went wrong",
      });
      return { data: null, error: signInError };
    }

    if (signInData.user) {
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role, max_devices')
            .eq('id', signInData.user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore not found error for admin login test
            await signOut();
            toast({ variant: "destructive", title: "Sign in Failed", description: "Could not retrieve user profile." });
            return { data: null, error: profileError };
        }

        // Admins can log in from multiple devices
        if (userProfile?.role === 'admin') {
            toast({ title: "Admin Sign in Successful!", description: "Welcome back!" });
            return { data: signInData, error: null };
        }

        const maxDevices = userProfile?.max_devices || 1;
        const deviceId = getDeviceId();

        const { data: activeSessions, error: sessionsError } = await supabase
            .from('active_sessions')
            .select('session_id', { count: 'exact' })
            .eq('user_id', signInData.user.id);

        if (sessionsError) {
            await signOut();
            toast({ variant: "destructive", title: "Sign in Failed", description: "Could not verify active sessions." });
            return { data: null, error: sessionsError };
        }

        const isDeviceActive = activeSessions.some(s => s.session_id === deviceId);

        if (!isDeviceActive && activeSessions.length >= maxDevices) {
            await signOut();
            toast({
                variant: "destructive",
                title: "Login Limit Reached",
                description: `You have reached your maximum device limit of ${maxDevices}. Please log out from another device.`,
                duration: 5000,
            });
            return { data: null, error: { message: "Device limit reached" } };
        }

        const { error: upsertError } = await supabase
            .from('active_sessions')
            .upsert({
                user_id: signInData.user.id,
                session_id: deviceId,
                last_active: new Date().toISOString(),
                device_info: { userAgent: navigator.userAgent }
            }, { onConflict: 'user_id, session_id' });

        if (upsertError) {
            console.error("Upsert error:", upsertError);
            await signOut();
            toast({ variant: "destructive", title: "Sign in Failed", description: "Could not register device session. " + upsertError.message });
            return { data: null, error: upsertError };
        }

        toast({
            title: "Sign in Successful!",
            description: "Welcome back!",
        });
    }

    return { data: signInData, error: null };
  }, [toast, signOut]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    userData,
    loadingUserData,
    access,
    canAccess,
    canWrite,
    canDelete,
    isExpired,
    refetchUserData,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, userData, loadingUserData, access, canAccess, canWrite, canDelete, isExpired, refetchUserData, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
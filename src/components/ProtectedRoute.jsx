import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, module, action = 'read', adminOnly = false }) => {
  const { user, loading, loadingUserData, canAccess, userData } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!loading && !loadingUserData && user && !toastShownRef.current) {
      const hasAccess = adminOnly ? userData?.role === 'admin' : canAccess(module, action);
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page.",
          variant: "destructive",
        });
        toastShownRef.current = true;
      }
    }
  }, [loading, loadingUserData, user, adminOnly, userData, canAccess, module, action, toast]);

  if (loading || loadingUserData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAccess = adminOnly ? userData?.role === 'admin' : canAccess(module, action);

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
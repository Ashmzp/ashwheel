import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Email Confirmed!",
      description: "Your account has been successfully verified. Redirecting to login...",
    });
    
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <>
      <Helmet>
        <title>Confirming Account - Ashwheel</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/20 text-foreground">
        <div className="text-center p-8 bg-card rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold mb-4 text-primary">Verification Successful!</h1>
          <p className="text-lg text-card-foreground">Thank you for confirming your email address.</p>
          <p className="mt-4 text-muted-foreground">You will be redirected to the login page shortly.</p>
          <div className="mt-8">
            <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthCallback;
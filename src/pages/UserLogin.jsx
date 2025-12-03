import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      if (data?.user && !error) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' });
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Password reset link sent to your email' });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Ashwheel</title>
      </Helmet>
      <div className="flex items-center justify-center min-h-screen bg-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:underline">
              Forgot Password?
            </button>
            <p className="text-sm text-muted-foreground">
              Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:underline">Sign Up - Free Trial</Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Are you an Admin? <Link to="/admin-login" className="font-semibold text-primary hover:underline">Login Here</Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link to="/" className="font-semibold text-primary hover:underline">Back to Home</Link>
            </p>
          </CardFooter>
        </Card>

        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>Enter your email to receive a password reset link</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" placeholder="m@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default UserLogin;
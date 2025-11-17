import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!email && !phone) {
      toast({ title: "Error", description: "Please enter email or phone number", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const signUpData = email 
      ? { email, options: { emailRedirectTo: window.location.origin + '/dashboard' } }
      : { phone };
    
    const { error } = await supabase.auth.signInWithOtp(signUpData);
    
    if (!error) {
      setShowOtpInput(true);
      toast({ 
        title: "OTP Sent!", 
        description: email 
          ? "Please check your email for the verification code." 
          : "Please check your phone for the verification code."
      });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter a valid 6-digit OTP", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const verifyData = email
      ? { email, token: otp, type: 'email' }
      : { phone, token: otp, type: 'sms' };
    
    const { error } = await supabase.auth.verifyOtp(verifyData);
    
    if (!error) {
      toast({ 
        title: "Success!", 
        description: "Verified! You get 30 days free trial!" 
      });
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - Ashwheel</title>
      </Helmet>
      <div className="flex items-center justify-center min-h-screen bg-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Get started with 30 days free trial - Full access to all features!</CardDescription>
          </CardHeader>
          <CardContent>
            {!showOtpInput ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="m@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  <p className="text-xs text-muted-foreground">We'll send a 6-digit OTP to verify your email</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number (Optional)</Label>
                  <Input 
                    id="signup-phone" 
                    type="tel" 
                    placeholder="+919876543210" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">Include country code (e.g., +91 for India)</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP - Start Free Trial'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    placeholder="123456" 
                    maxLength={6}
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to {email || phone}
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp('');
                  }}
                >
                  Change Email/Phone
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign In</Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link to="/" className="font-semibold text-primary hover:underline">Back to Home</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default SignupPage;

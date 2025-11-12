import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Helmet } from 'react-helmet';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn(email, password);
    if (data.user && !error) {
      navigate('/dashboard');
    }
    setLoading(false);
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
            <p className="text-sm text-muted-foreground">
              <Link to="/" className="font-semibold text-primary hover:underline">Back to Home</Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Are you an Admin? <Link to="/admin-login" className="font-semibold text-primary hover:underline">Login Here</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default UserLogin;
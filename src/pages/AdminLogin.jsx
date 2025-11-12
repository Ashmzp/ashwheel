import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

// Admin credentials from environment variables (secure)
const adminCredentials = {
  email: import.meta.env.VITE_ADMIN_EMAIL || "ash.mzp143@gmail.com",
  password: import.meta.env.VITE_ADMIN_PASSWORD || "Atul@1212"
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (email.trim() === adminCredentials.email && password === adminCredentials.password) {
      const { error } = await signIn(adminCredentials.email, adminCredentials.password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Admin Login Failed",
          description: error.message || "Could not sign in the admin user. Please check Supabase credentials.",
        });
      } else {
        toast({ title: "Admin Login Successful!" });
        navigate('/admin/dashboard');
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid admin credentials.",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - Ashwheel</title>
      </Helmet>
      <div className="flex items-center justify-center min-h-screen bg-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <div className="p-6 pt-0 text-center">
             <p className="text-sm text-muted-foreground">
               Not an Admin? <Link to="/login" className="font-semibold text-primary hover:underline">User Login</Link>
             </p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdminLogin;
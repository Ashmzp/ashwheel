import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/utils/dateUtils';
import useUserProfileStore from '@/stores/userProfileStore';
import { useAutosave } from '@/hooks/useAutosave';

const UserProfile = () => {
  const { user, userData, refetchUserData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const { password, confirmPassword, newEmail, productKey, setField, resetPasswords, resetForm } = useUserProfileStore();
  useAutosave(useUserProfileStore, 'user-profile-form-storage');

  const validityInfo = useMemo(() => {
    if (!userData?.app_valid_till) {
      return { text: "Not Active", daysLeft: 0, isExpired: true };
    }
    const validTillDate = new Date(userData.app_valid_till);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    validTillDate.setHours(0, 0, 0, 0);
    
    const diffTime = validTillDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Expired on ${formatDate(validTillDate)}`, daysLeft: 0, isExpired: true };
    }

    const daysLeft = diffDays + 1;

    return {
      text: `Valid till: ${formatDate(validTillDate)} (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left)`,
      daysLeft: daysLeft,
      isExpired: false,
    };
  }, [userData]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Password updated successfully." });
      resetPasswords();
    }
    setLoading(false);
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "A confirmation link has been sent to your new email address." });
      setField('newEmail', '');
    }
    setLoading(false);
  };

  const handleActivateKey = async (e) => {
    e.preventDefault();
    if (!productKey.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a product key." });
      return;
    }
    setIsActivating(true);

    try {
      const { data: keyData, error: keyError } = await supabase
        .from('product_keys')
        .select('id, validity_days, status')
        .eq('key', productKey.trim())
        .single();

      if (keyError || !keyData) {
        throw new Error("Invalid or non-existent product key.");
      }
      if (keyData.status === 'used') {
        throw new Error("This product key has already been used.");
      }

      const today = new Date();
      const currentValidity = userData?.app_valid_till ? new Date(userData.app_valid_till) : null;
      
      const startDate = (currentValidity && currentValidity > today) ? currentValidity : today;
      
      const newValidityDate = new Date(startDate);
      newValidityDate.setDate(newValidityDate.getDate() + keyData.validity_days);

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ app_valid_till: newValidityDate.toISOString().split('T')[0] })
        .eq('id', user.id);

      if (userUpdateError) {
        throw new Error("Failed to update your validity. Please try again.");
      }

      const { error: keyUpdateError } = await supabase
        .from('product_keys')
        .update({ status: 'used', used_by: user.id, used_at: new Date().toISOString() })
        .eq('id', keyData.id);
      
      if (keyUpdateError) {
        console.error("CRITICAL: Failed to mark key as used after granting validity.", keyUpdateError);
      }

      toast({ title: "Success!", description: `Your subscription has been extended by ${keyData.validity_days} days.` });
      setField('productKey', '');
      await refetchUserData();

    } catch (error) {
      toast({ variant: "destructive", title: "Activation Failed", description: error.message });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>My Profile - Showroom Pro</title>
        <meta name="description" content="Manage your profile, password, and app subscription." />
      </Helmet>
      <div className="p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Manage your application subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-semibold ${validityInfo.isExpired ? 'text-destructive' : 'text-green-600'}`}>
              {validityInfo.text}
            </div>
            <form onSubmit={handleActivateKey} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="product-key">Product Key</Label>
                <Input 
                  id="product-key" 
                  type="text" 
                  placeholder="Enter your product key"
                  value={productKey} 
                  onChange={e => setField('productKey', e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" disabled={isActivating}>
                {isActivating ? 'Activating...' : 'Verify & Activate'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your current email is: <strong>{user?.email}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="password">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Change Password</TabsTrigger>
                <TabsTrigger value="email">Change Email</TabsTrigger>
              </TabsList>
              <TabsContent value="password">
                <form onSubmit={handlePasswordChange} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={password} onChange={e => setField('password', e.target.value)} required autoComplete="new-password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setField('confirmPassword', e.target.value)} required autoComplete="new-password" />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</Button>
                </form>
              </TabsContent>
              <TabsContent value="email">
                <form onSubmit={handleEmailChange} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email Address</Label>
                    <Input id="new-email" type="email" value={newEmail} onChange={e => setField('newEmail', e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Email'}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UserProfile;
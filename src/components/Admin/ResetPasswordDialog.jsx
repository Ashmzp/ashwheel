import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { validateRequired } from '@/utils/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ResetPasswordDialog = ({ isOpen, setIsOpen, user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!user) return;

    if (!validateRequired(newPassword) || newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Invalid Password', description: 'New password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-user-actions', {
        body: JSON.stringify({
          action: 'reset_password',
          userId: user.id,
          password: newPassword,
        }),
      });

      if (error) throw new Error(error.message);

      toast({ title: 'Password Reset', description: `Password for ${user.email} has been updated.` });
      setNewPassword('');
      setIsOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error Resetting Password', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>Set a new password for <strong>{user?.email}</strong>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleResetPassword} disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all users including unverified ones
      const { data: authUsersData, error: authUsersError } = await supabase
        .from('users')
        .select('id, email, role, created_at, access, email_confirmed_at')
        .order('created_at', { ascending: false });
      
      if (authUsersError) throw authUsersError;
      
      setUsers(authUsersData || []);
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error fetching users', 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId) => {
    setDeletingUserId(userId);
    try {
      // Use RPC function to delete user completely
      const { data, error } = await supabase.rpc('delete_user_completely', {
        target_user_id: userId
      });

      if (error) throw error;
      
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      });
      fetchUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting user',
        description: error.message || 'Failed to delete user. Make sure you have admin permissions.',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>User Management - Ashwheel</title>
        <meta name="description" content="Manage users and their permissions." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading users...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.email_confirmed_at 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={deletingUserId === user.id}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} disabled={deletingUserId === user.id}>
                                  {deletingUserId === user.id ? 'Deleting...' : 'Continue'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default UserManagementPage;
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, RefreshCw, Trash2, KeyRound, Settings, LogOut } from 'lucide-react';
import { AddUserDialog } from '@/components/Admin/AddUserDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const allModules = {
  showroom: [
    { id: 'customers', name: 'Customers' },
    { id: 'purchases', name: 'Vehicle Purchases' },
    { id: 'purchase_returns', name: 'Purchase Returns' },
    { id: 'stock', name: 'Vehicle Stock' },
    { id: 'reports', name: 'Reports' },
    { id: 'vehicle_invoices', name: 'Vehicle Invoices' },
    { id: 'sales_returns', name: 'Sales Returns' },
    { id: 'bookings', name: 'Bookings' },
  ],
  workshop: [
    { id: 'workshop_purchases', name: 'Workshop Purchases' },
    { id: 'wp_return', name: 'WP Return' },
    { id: 'workshop_inventory', name: 'Workshop Inventory' },
    { id: 'job_cards', name: 'Job Cards' },
    { id: 'ws_return', name: 'WS Return' },
    { id: 'workshop_follow_up', name: 'Follow-up' },
  ],
  accounts: [
    { id: 'journal_entry', name: 'Journal Entry' },
    { id: 'party_ledger', name: 'Party Ledger' },
    { id: 'receipts', name: 'Receipts' },
  ],
  other: [
    { id: 'mis_report', name: 'MIS Report' },
  ],
};

const PermissionSelector = ({ label, value, onChange }) => (
  <div className="grid grid-cols-2 items-center">
    <Label className="font-normal">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select access" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        <SelectItem value="read">Read</SelectItem>
        <SelectItem value="write">Write</SelectItem>
        <SelectItem value="full">Full</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const PermissionsDialog = ({ user, isOpen, onOpenChange, onSave }) => {
    const [currentAccess, setCurrentAccess] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.access) {
            const initialAccess = {};
            Object.values(allModules).flat().forEach(module => {
                initialAccess[module.id] = user.access[module.id] || 'none';
            });
            setCurrentAccess(initialAccess);
        }
    }, [user]);

    const handleAccessChange = (moduleId, value) => {
        setCurrentAccess(prev => ({ ...prev, [moduleId]: value }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        await onSave(user.id, currentAccess);
        setIsSaving(false);
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Permissions for {user.email}</DialogTitle>
                    <DialogDescription>
                        Set module access levels for this user.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <Accordion type="multiple" className="w-full" defaultValue={['showroom', 'workshop', 'accounts', 'other']}>
                        <AccordionItem value="showroom">
                            <AccordionTrigger className="font-semibold">Showroom Permissions</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                {allModules.showroom.map(module => (
                                    <PermissionSelector
                                        key={module.id}
                                        label={module.name}
                                        value={currentAccess[module.id] || 'none'}
                                        onChange={(value) => handleAccessChange(module.id, value)}
                                    />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="workshop">
                            <AccordionTrigger className="font-semibold">Workshop Permissions</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                {allModules.workshop.map(module => (
                                    <PermissionSelector
                                        key={module.id}
                                        label={module.name}
                                        value={currentAccess[module.id] || 'none'}
                                        onChange={(value) => handleAccessChange(module.id, value)}
                                    />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="accounts">
                            <AccordionTrigger className="font-semibold">Accounts Permissions</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                {allModules.accounts.map(module => (
                                    <PermissionSelector
                                        key={module.id}
                                        label={module.name}
                                        value={currentAccess[module.id] || 'none'}
                                        onChange={(value) => handleAccessChange(module.id, value)}
                                    />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="other">
                            <AccordionTrigger className="font-semibold">Other Permissions</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                {allModules.other.map(module => (
                                    <PermissionSelector
                                        key={module.id}
                                        label={module.name}
                                        value={currentAccess[module.id] || 'none'}
                                        onChange={(value) => handleAccessChange(module.id, value)}
                                    />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_users_with_session_count');
            if (error) throw error;
            setUsers(data);
        } catch (error) {
            toast({
                title: "Error fetching users",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleDeleteUser = async (userId) => {
        try {
            const { error } = await supabase.functions.invoke('admin-user-actions', {
                body: JSON.stringify({
                    action: 'delete_user',
                    userId: userId,
                }),
            });

            if (error) throw error;
            
            toast({
                title: 'User Deleted',
                description: 'The user has been successfully deleted.',
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: 'Error deleting user',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleSendRecoveryEmail = async (email) => {
        try {
            const { error } = await supabase.functions.invoke('admin-user-actions', {
                body: JSON.stringify({
                    action: 'send_recovery_email',
                    email: email,
                }),
            });

            if (error) throw error;

            toast({
                title: 'Recovery Email Sent',
                description: `A password reset link has been sent to ${email}.`,
            });
        } catch (error) {
            toast({
                title: 'Error Sending Email',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleLogoutAllDevices = async (userId, userEmail) => {
        try {
            const { error } = await supabase.functions.invoke('admin-user-actions', {
                body: JSON.stringify({
                    action: 'logout_all_devices',
                    userId: userId,
                }),
            });

            if (error) throw error;

            toast({
                title: 'All Devices Logged Out',
                description: `All active sessions for ${userEmail} have been terminated.`,
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: 'Error Logging Out Devices',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleAddUser = () => {
        setIsAddUserDialogOpen(true);
    };

    const handleOpenPermissions = (user) => {
        setSelectedUser(user);
        setIsPermissionsDialogOpen(true);
    };

    const handleUpdatePermissions = async (userId, newAccess) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ access: newAccess })
                .eq('id', userId);

            if (error) throw error;

            toast({
                title: 'Permissions Updated',
                description: 'User permissions have been successfully updated.',
            });
            
            fetchUsers();
            setIsPermissionsDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error updating permissions',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 bg-background text-foreground">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <div className="flex justify-between items-center mb-4">
                <Input
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <div className="space-x-2">
                    <Button onClick={fetchUsers} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button onClick={handleAddUser}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Account Valid Till</TableHead>
                            <TableHead>Active Devices</TableHead>
                            <TableHead>Max Devices</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan="6" className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>{user.app_valid_till ? new Date(user.app_valid_till).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>{user.active_session_count}</TableCell>
                                    <TableCell>{user.max_devices || 'N/A'}</TableCell>
                                    <TableCell>
                                         <div className="flex space-x-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                title="Manage Permissions"
                                                onClick={() => handleOpenPermissions(user)}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Reset Password">
                                                        <KeyRound className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Send Password Reset Link?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will send a password reset link to {user.email}. The user will be able to set a new password themselves.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleSendRecoveryEmail(user.email)}>
                                                            Send Link
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Logout All Devices" className="text-yellow-500 hover:text-yellow-600">
                                                        <LogOut className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Logout all devices for {user.email}?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will terminate all active sessions for this user, forcing them to log in again on all devices.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleLogoutAllDevices(user.id, user.email)}>
                                                            Confirm Logout
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Delete User">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the user account and remove their data from our servers.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                                            Continue
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan="6" className="text-center">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddUserDialog
                isOpen={isAddUserDialogOpen}
                onUserAdded={fetchUsers}
                setIsOpen={setIsAddUserDialogOpen}
            />

            <PermissionsDialog
                user={selectedUser}
                isOpen={isPermissionsDialogOpen}
                onOpenChange={setIsPermissionsDialogOpen}
                onSave={handleUpdatePermissions}
            />
        </div>
    );
};

export default UserManagement;
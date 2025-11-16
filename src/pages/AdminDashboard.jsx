import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { formatDate } from '@/utils/dateUtils';
import { PlusCircle, Edit, Loader2, Database, Zap, HardDrive, Server, Users, FunctionSquare, ArrowRightLeft, Clock, ShieldCheck, PauseCircle } from 'lucide-react';
import { AddUserDialog } from '@/components/Admin/AddUserDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const showroomModules = [
    { id: 'customers', name: 'Customers' },
    { id: 'purchases', name: 'Showroom Purchases' },
    { id: 'purchase_returns', name: 'Showroom Purchase Returns' },
    { id: 'stock', name: 'Stock' },
    { id: 'reports', name: 'Reports' },
    { id: 'vehicle_invoices', name: 'Vehicle Invoices' },
    { id: 'sales_returns', name: 'Sales Returns' },
    { id: 'bookings', name: 'Bookings' },
];

const workshopModules = [
    { id: 'workshop_purchases', name: 'Workshop Purchases' },
    { id: 'wp_return', name: 'WP Return' },
    { id: 'workshop_inventory', name: 'Workshop Inventory' },
    { id: 'job_cards', name: 'Job Cards' },
    { id: 'ws_return', name: 'WS Return' },
    { id: 'workshop_follow_up', name: 'Follow-up' },
];

const accountsModules = [
    { id: 'journal_entry', name: 'Journal Entry' },
    { id: 'party_ledger', name: 'Party Ledger' },
    { id: 'receipts', name: 'Receipts' },
];

const otherModules = [
    { id: 'mis_report', name: 'MIS Report' },
];

const fetchUsers = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('*, active_sessions(count)')
        .neq('role', 'admin');
    if (error) throw new Error(error.message);
    return data;
};

const SupabaseUsageTracker = () => {
    const usageData = [
        { name: 'Database Size', icon: <Database className="h-6 w-6 text-blue-500" />, limit: '500 MB', description: 'Data storage limit. Write operations may fail if exceeded.' },
        { name: 'Monthly Active Users', icon: <Users className="h-6 w-6 text-teal-500" />, limit: '50,000', description: 'Unique users logging in per month. Auth may be blocked if exceeded.' },
        { name: 'Edge Function Invocations', icon: <FunctionSquare className="h-6 w-6 text-indigo-500" />, limit: '500,000 / month', description: 'Custom server logic calls. Functions will stop if limit is reached.' },
        { name: 'Realtime Messages', icon: <Zap className="h-6 w-6 text-green-500" />, limit: '2 Million / month', description: 'Live data updates. Realtime features will stop if exceeded.' },
        { name: 'Storage Size', icon: <HardDrive className="h-6 w-6 text-yellow-500" />, limit: '1 GB', description: 'File uploads (images, PDFs). Uploads will fail if limit is reached.' },
        { name: 'Data Egress', icon: <ArrowRightLeft className="h-6 w-6 text-orange-500" />, limit: '5 GB / month', description: 'Data transfer out (API responses, file downloads). App may become unresponsive if exceeded.' },
        { name: 'Concurrent Connections', icon: <Server className="h-6 w-6 text-purple-500" />, limit: '200 peak', description: 'Simultaneous database connections. New users may fail to connect.' },
        { name: 'Log Retention', icon: <Clock className="h-6 w-6 text-gray-500" />, limit: '1 day', description: 'API/DB logs for debugging. Older logs are deleted.' },
        { name: 'Auth Audit Trails', icon: <ShieldCheck className="h-6 w-6 text-red-500" />, limit: '1 hour', description: 'Login/signup history for security checks.' },
        { name: 'Project Inactivity', icon: <PauseCircle className="h-6 w-6 text-pink-500" />, limit: '1 week pause', description: 'Project pauses if unused. Ensure regular activity to keep ERP online.' },
    ];

    return (
        <Card className="mb-6 bg-secondary/50 border-border/50">
            <CardHeader>
                <CardTitle className="gradient-text">Supabase Usage Tracker (Free Plan)</CardTitle>
                <p className="text-sm text-muted-foreground">
                    This is a conceptual tracker showing your free tier limits. Real-time usage data is not available via API for the free plan. Monitor your Supabase Dashboard for actual usage.
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {usageData.map((item, index) => (
                        <Card key={index} className="bg-background/70 hover:bg-background transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                                {item.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold">Limit: {item.limit}</div>
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-200"><strong className="font-semibold">API Calls (Read/Write/Update):</strong> Supabase's free plan doesn't limit the number of API calls directly. Instead, usage is measured by Data Egress, which is limited to 5 GB per month. As long as your total data transfer remains within this limit, you can make unlimited API calls.</p>
                </div>
            </CardContent>
        </Card>
    );
};

const AdminDashboard = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: users = [], isLoading, isError, error } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: fetchUsers,
    });

    const filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isError) {
            toast({ title: 'Error fetching users', description: error.message, variant: 'destructive' });
        }
    }, [isError, error, toast]);

    const handleUserAdded = () => {
        queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        setAddUserDialogOpen(false);
    };

    return (
        <>
            <Helmet>
                <title>Admin Dashboard - Ashwheel</title>
                <meta name="description" content="Manage users, permissions, and monitor service usage." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="container mx-auto p-4"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                </div>

                <SupabaseUsageTracker />

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Search users..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                        <Button onClick={() => setAddUserDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button>
                    </div>
                    <AddUserDialog isOpen={isAddUserDialogOpen} setIsOpen={setAddUserDialogOpen} onUserAdded={handleUserAdded} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>App Valid Till</TableHead>
                                    <TableHead>Active Devices</TableHead>
                                    <TableHead>Max Devices</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan="6" className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.role}</TableCell>
                                            <TableCell>{user.app_valid_till ? formatDate(user.app_valid_till) : 'N/A'}</TableCell>
                                            <TableCell>{user.active_sessions[0]?.count || 0}</TableCell>
                                            <TableCell>{user.max_devices}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <EditPermissionsDialog user={user} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan="6" className="text-center">No users found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    );
};

const EditPermissionsDialog = ({ user }) => {
    const [permissions, setPermissions] = useState(user.access || {});
    const [appValidTill, setAppValidTill] = useState(user.app_valid_till || '');
    const [maxDevices, setMaxDevices] = useState(user.max_devices || 1);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        setPermissions(user.access || {});
        setAppValidTill(user.app_valid_till || '');
        setMaxDevices(user.max_devices || 1);
    }, [user]);

    const handlePermissionChange = (module, value) => {
        setPermissions(prev => ({
            ...prev,
            [module]: value
        }));
    };

    const mutation = useMutation({
        mutationFn: (updatedData) => supabase
            .from('users')
            .update(updatedData)
            .eq('id', user.id)
            .select()
            .single(),
        onSuccess: () => {
            toast({ title: 'Success', description: 'User permissions updated successfully.' });
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (error) => {
            toast({ title: 'Error updating permissions', description: error.message, variant: 'destructive' });
        },
    });

    const handleSavePermissions = () => {
        mutation.mutate({ access: permissions, app_valid_till: appValidTill || null, max_devices: maxDevices });
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Permissions for {user.email}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="app-valid-till">App Valid Till</Label>
                            <Input 
                                id="app-valid-till" 
                                type="date" 
                                value={appValidTill ? appValidTill.split('T')[0] : ''} 
                                onChange={(e) => setAppValidTill(e.target.value)} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="max-devices">Max Devices</Label>
                            <Input 
                                id="max-devices" 
                                type="number" 
                                min="1"
                                value={maxDevices} 
                                onChange={(e) => setMaxDevices(parseInt(e.target.value, 10) || 1)} 
                            />
                        </div>
                    </div>
                
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Showroom Permissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {showroomModules.map(module => (
                                <div key={module.id} className="space-y-2">
                                    <Label>{module.name}</Label>
                                    <Select 
                                        value={permissions[module.id] || 'none'} 
                                        onValueChange={(value) => handlePermissionChange(module.id, value)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="read">Read Only</SelectItem>
                                            <SelectItem value="write">Read & Write</SelectItem>
                                            <SelectItem value="full">Full Access</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Workshop Permissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {workshopModules.map(module => (
                                <div key={module.id} className="space-y-2">
                                    <Label>{module.name}</Label>
                                    <Select 
                                        value={permissions[module.id] || 'none'} 
                                        onValueChange={(value) => handlePermissionChange(module.id, value)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="read">Read Only</SelectItem>
                                            <SelectItem value="write">Read & Write</SelectItem>
                                            <SelectItem value="full">Full Access</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Accounts Permissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {accountsModules.map(module => (
                                <div key={module.id} className="space-y-2">
                                    <Label>{module.name}</Label>
                                    <Select 
                                        value={permissions[module.id] || 'none'} 
                                        onValueChange={(value) => handlePermissionChange(module.id, value)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="read">Read Only</SelectItem>
                                            <SelectItem value="write">Read & Write</SelectItem>
                                            <SelectItem value="full">Full Access</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Other Permissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {otherModules.map(module => (
                                <div key={module.id} className="space-y-2">
                                    <Label>{module.name}</Label>
                                    <Select 
                                        value={permissions[module.id] || 'none'} 
                                        onValueChange={(value) => handlePermissionChange(module.id, value)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="read">Read Only</SelectItem>
                                            <SelectItem value="write">Read & Write</SelectItem>
                                            <SelectItem value="full">Full Access</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={mutation.isPending}>Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleSavePermissions} disabled={mutation.isPending}>
                            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save changes
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AdminDashboard;
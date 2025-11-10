import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail, validateRequired } from '@/utils/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export const AddUserDialog = ({ isOpen, setIsOpen, onUserAdded }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [access, setAccess] = useState({});
  const [maxDevices, setMaxDevices] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAccessChange = (module, value) => {
    setAccess(prev => ({ ...prev, [module]: value }));
  };

  const handleAddUser = async () => {
    if (!validateEmail(email)) {
      toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
      return;
    }
    if (!validateRequired(password) || password.length < 6) {
      toast({ variant: 'destructive', title: 'Invalid Password', description: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: JSON.stringify({ action: 'create_user', email, password, access, max_devices: maxDevices }),
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({ title: 'User Created', description: 'The new user has been created successfully.' });
      setEmail('');
      setPassword('');
      setAccess({});
      setMaxDevices(1);
      setIsOpen(false);
      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error Creating User', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account and set their initial permissions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-devices">Max Devices</Label>
            <Input id="max-devices" type="number" min="1" value={maxDevices} onChange={(e) => setMaxDevices(parseInt(e.target.value, 10) || 1)} />
          </div>
          
          <Accordion type="multiple" className="w-full" defaultValue={['showroom', 'workshop', 'accounts', 'other']}>
            <AccordionItem value="showroom">
              <AccordionTrigger className="font-semibold">Showroom Permissions</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {allModules.showroom.map(module => (
                  <PermissionSelector 
                    key={module.id}
                    label={module.name}
                    value={access[module.id] || 'none'}
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
                    value={access[module.id] || 'none'}
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
                    value={access[module.id] || 'none'}
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
                    value={access[module.id] || 'none'}
                    onChange={(value) => handleAccessChange(module.id, value)}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleAddUser} disabled={loading}>{loading ? 'Creating...' : 'Create User'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
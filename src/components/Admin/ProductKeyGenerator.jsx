import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatDateTime } from '@/utils/dateUtils';
import { escapeHTML } from '@/utils/sanitize';

const ProductKeyGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [validityDays, setValidityDays] = useState(30);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      // The select query now explicitly joins with the users table.
      // The FK constraint fk_used_by_user makes this possible.
      const { data, error } = await supabase
        .from('product_keys')
        .select(`
          id,
          key,
          validity_days,
          status,
          used_at,
          users ( email ) 
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      setKeys(data);

    } catch (error) {
      console.error("Error fetching keys:", error);
      toast({ variant: 'destructive', title: 'Error fetching keys', description: error.message });
    } finally {
      setLoadingKeys(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const generateKey = () => {
    const key = `SHOWROOMPRO-${uuidv4().split('-')[0].toUpperCase()}`;
    return key;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!validityDays || validityDays < 1 || validityDays > 3650) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Validity must be between 1 and 3650 days.' });
      return;
    }
    setIsLoading(true);
    setGeneratedKey(null);

    const newKey = generateKey();
    try {
      const { data, error } = await supabase
        .from('product_keys')
        .insert({
          key: newKey,
          validity_days: validityDays,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      
      setGeneratedKey(data.key);
      toast({ title: 'Success', description: 'Product key generated successfully.' });
      fetchKeys(); // Refresh the list
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to generate key: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    const safeText = escapeHTML(text);
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Key copied to clipboard.' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Key Generator</CardTitle>
          <CardDescription>Generate new product keys for users.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="flex items-end gap-4">
            <div className="flex-grow">
              <Label htmlFor="validity-days">Validity (in days)</Label>
              <Input
                id="validity-days"
                type="number"
                min="1"
                max="3650"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Key'}
            </Button>
          </form>
          {generatedKey && (
            <div className="mt-4 p-3 bg-secondary rounded-md flex justify-between items-center">
              <span className="font-mono text-lg">{generatedKey}</span>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Keys</CardTitle>
          <CardDescription>List of recently generated product keys.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Used On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingKeys ? (
                  <TableRow><TableCell colSpan="5" className="text-center">Loading keys...</TableCell></TableRow>
                ) : keys.length === 0 ? (
                  <TableRow><TableCell colSpan="5" className="text-center">No keys generated yet.</TableCell></TableRow>
                ) : (
                  keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {key.key}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(key.key)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{key.validity_days} days</TableCell>
                      <TableCell>
                        <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{key.users?.email || (key.status === 'used' ? 'N/A' : '')}</TableCell>
                      <TableCell>{key.used_at ? formatDateTime(key.used_at) : ''}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductKeyGenerator;
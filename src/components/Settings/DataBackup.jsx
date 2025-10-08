import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const tablesToBackup = [
    'settings',
    'customers',
    'purchases',
    'stock',
    'vehicle_invoices',
    'vehicle_invoice_items',
    'sales_returns',
    'purchase_returns',
    'workshop_purchases',
    'workshop_inventory',
    'job_cards',
    'workshop_purchase_returns',
    'workshop_sales_returns',
    'workshop_follow_ups',
    'workshop_labour_items',
];

const DataBackup = () => {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();

    const handleBackup = async () => {
        setIsBackingUp(true);
        toast({ title: "Starting Backup...", description: "This may take a few moments." });

        try {
            const backupData = {};
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            for (const table of tablesToBackup) {
                const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id);
                if (error) {
                    console.warn(`Could not back up ${table}:`, error.message);
                    continue;
                }
                backupData[table] = data;
            }

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ashwheel_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: "Backup Successful", description: "Your data has been downloaded." });
        } catch (error) {
            toast({ title: "Backup Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);
        toast({ title: "Starting Import...", description: "Please do not close this window." });

        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            // Simple confirmation
            if (!window.confirm("Are you sure you want to import this data? This will overwrite existing data for this user.")) {
                setIsImporting(false);
                return;
            }

            for (const table of tablesToBackup) {
                if (backupData[table] && backupData[table].length > 0) {
                    // Delete existing data for the user in the current table
                    const { error: deleteError } = await supabase.from(table).delete().eq('user_id', user.id);
                    if (deleteError) {
                        console.error(`Error clearing table ${table}:`, deleteError);
                        throw new Error(`Failed to clear old data from ${table}.`);
                    }

                    // Insert new data, ensuring user_id is correct
                    const dataToInsert = backupData[table].map(item => ({ ...item, user_id: user.id, id: undefined }));
                    
                    // Supabase has a limit on how many rows can be inserted at once.
                    // Let's chunk it.
                    const chunkSize = 500;
                    for (let i = 0; i < dataToInsert.length; i += chunkSize) {
                        const chunk = dataToInsert.slice(i, i + chunkSize);
                        const { error: insertError } = await supabase.from(table).insert(chunk);
                        if (insertError) {
                            console.error(`Error importing to ${table}:`, insertError);
                            throw new Error(`Failed to import data into ${table}.`);
                        }
                    }
                }
            }

            toast({ title: "Import Successful", description: "Your data has been restored. Please refresh the page." });
        } catch (error) {
            toast({ title: "Import Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsImporting(false);
            // Reset file input
            event.target.value = null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Backup & Import</CardTitle>
                <CardDescription>Download all your data or import a previous backup. Importing will overwrite existing data.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button onClick={handleBackup} disabled={isBackingUp}>
                    {isBackingUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Backup Data
                </Button>
                <Button asChild variant="outline" disabled={isImporting}>
                    <label htmlFor="import-file" className="cursor-pointer flex items-center">
                        {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Import Data
                    </label>
                </Button>
                <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleImport} disabled={isImporting} />
            </CardContent>
        </Card>
    );
};

export default DataBackup;
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { EXPORT_COLUMNS_CONFIG } from './columnsConfig';

const ALL_COLUMN_KEYS = Object.keys(EXPORT_COLUMNS_CONFIG);

const ColumnSettingsDialog = ({ visibleColumns, setVisibleColumns, storageKey }) => {
    const [tempColumns, setTempColumns] = useState(visibleColumns);
    const { toast } = useToast();

    const handleColumnToggle = (colName, checked) => {
        if (checked) {
            setTempColumns(prev => [...prev, colName]);
        } else {
            setTempColumns(prev => prev.filter(c => c !== colName));
        }
    };

    const handleSaveSettings = () => {
        setVisibleColumns(tempColumns);
        localStorage.setItem(storageKey, JSON.stringify(tempColumns));
        toast({ title: "Settings Saved", description: "Your column preferences have been saved." });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Customize Columns</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-4">
                    {ALL_COLUMN_KEYS.map(colName => (
                        <div key={colName} className="flex items-center space-x-2">
                            <Checkbox
                                id={colName}
                                checked={tempColumns.includes(colName)}
                                onCheckedChange={(checked) => handleColumnToggle(colName, checked)}
                            />
                            <label htmlFor={colName} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {colName}
                            </label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveSettings}>Save as Default</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ColumnSettingsDialog;
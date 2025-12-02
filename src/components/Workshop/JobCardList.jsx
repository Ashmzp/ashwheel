import React, { useState, useMemo } from 'react';
import '@/styles/responsive.css';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Printer, Trash2, Loader2, Download, Settings, Search } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import JobCardPreviewDialog from '@/components/Workshop/JobCardPreviewDialog';
import { useSettingsStore } from '@/stores/settingsStore';
import { exportToExcel } from '@/utils/excel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const allJobCardColumns = [
    { id: 'invoice_no', label: 'Invoice No' },
    { id: 'invoice_date', label: 'Date' },
    { id: 'customer_name', label: 'Customer Name' },
    { id: 'reg_no', label: 'Reg. No' },
    { id: 'status', label: 'Status' },
    { id: 'total_amount', label: 'Total Amount' },
    { id: 'manual_jc_no', label: 'Manual JC No.'},
    { id: 'frame_no', label: 'Frame No'},
    { id: 'model', label: 'Model'},
    { id: 'mechanic', label: 'Mechanic'},
    { id: 'next_due_date', label: 'Next Due Date'},
    { id: 'actions', label: 'Actions' },
];

const JobCardList = ({ jobCards = [], onEdit, onDelete, isLoading, dateRange, setDateRange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewJobCard, setPreviewJobCard] = useState(null);
  const { settings, updateSettings } = useSettingsStore();
  const { toast } = useToast();

  const savedVisibleColumns = settings.workshop_settings?.job_card_columns;
  const initialVisibleColumns = useMemo(() => savedVisibleColumns || ['invoice_no', 'invoice_date', 'customer_name', 'reg_no', 'status', 'total_amount', 'actions'], [savedVisibleColumns]);
  
  const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);

  const filteredJobCards = jobCards.filter(jc => {
    const term = searchTerm.toLowerCase();
    return jc.invoice_no?.toLowerCase().includes(term) ||
           jc.customer_name?.toLowerCase().includes(term) ||
           jc.reg_no?.toLowerCase().includes(term) ||
           jc.frame_no?.toLowerCase().includes(term) ||
           jc.model?.toLowerCase().includes(term);
  });

  const handleExport = () => {
    const dataToExport = [];
    
    filteredJobCards.forEach(jc => {
      const parts = Array.isArray(jc.parts_items) ? jc.parts_items : [];
      const labour = Array.isArray(jc.labour_items) ? jc.labour_items : [];
      
      const partsTotal = parts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const labourTotal = labour.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      const grandTotal = partsTotal + labourTotal;
      
      // Add header row for each job card
      dataToExport.push({
        'Invoice No': jc.invoice_no,
        'Date': formatDate(jc.invoice_date),
        'Customer Name': jc.customer_name,
        'Reg. No': jc.reg_no,
        'Status': jc.status,
        'Total Amount': grandTotal,
        'Manual JC No.': jc.manual_jc_no,
        'Mechanic': jc.mechanic,
        'Frame No': jc.frame_no,
        'Next Due Date': formatDate(jc.next_due_date),
        'Model': jc.model,
        'Part Name': '',
        'Part No.': '',
        'HSN': '',
        'Qty': '',
        'Rate': '',
        'GST %': '',
        'Disc': '',
        'Amount': ''
      });
      
      // Add parts rows
      parts.forEach(part => {
        dataToExport.push({
          'Invoice No': jc.invoice_no,
          'Date': formatDate(jc.invoice_date),
          'Customer Name': '',
          'Reg. No': jc.reg_no,
          'Status': '',
          'Total Amount': '',
          'Manual JC No.': '',
          'Mechanic': '',
          'Frame No': jc.frame_no,
          'Next Due Date': '',
          'Model': '',
          'Part Name': part.part_name || '',
          'Part No.': part.part_no || '',
          'HSN': part.hsn || '',
          'Qty': part.qty || '',
          'Rate': part.rate || '',
          'GST %': part.gst || '',
          'Disc': part.discount || 0,
          'Amount': part.amount || ''
        });
      });
      
      // Add parts total row
      if (parts.length > 0) {
        dataToExport.push({
          'Invoice No': '',
          'Date': '',
          'Customer Name': '',
          'Reg. No': '',
          'Status': '',
          'Total Amount': '',
          'Manual JC No.': '',
          'Mechanic': '',
          'Frame No': '',
          'Next Due Date': '',
          'Model': '',
          'Part Name': 'Total Parts',
          'Part No.': '',
          'HSN': '',
          'Qty': '',
          'Rate': '',
          'GST %': '',
          'Disc': '',
          'Amount': partsTotal
        });
      }
      
      // Add labour rows
      labour.forEach(lab => {
        dataToExport.push({
          'Invoice No': '',
          'Date': '',
          'Customer Name': '',
          'Reg. No': '',
          'Status': '',
          'Total Amount': '',
          'Manual JC No.': '',
          'Mechanic': '',
          'Frame No': '',
          'Next Due Date': '',
          'Model': '',
          'Part Name': `Labour: ${lab.description || ''}`,
          'Part No.': '',
          'HSN': '',
          'Qty': '',
          'Rate': '',
          'GST %': '',
          'Disc': '',
          'Amount': lab.amount || ''
        });
      });
      
      // Add labour total row
      if (labour.length > 0) {
        dataToExport.push({
          'Invoice No': '',
          'Date': '',
          'Customer Name': '',
          'Reg. No': '',
          'Status': '',
          'Total Amount': '',
          'Manual JC No.': '',
          'Mechanic': '',
          'Frame No': '',
          'Next Due Date': '',
          'Model': '',
          'Part Name': 'Total Labour',
          'Part No.': '',
          'HSN': '',
          'Qty': '',
          'Rate': '',
          'GST %': '',
          'Disc': '',
          'Amount': labourTotal
        });
      }
      
      // Add grand total row
      dataToExport.push({
        'Invoice No': '',
        'Date': '',
        'Customer Name': '',
        'Reg. No': '',
        'Status': '',
        'Total Amount': '',
        'Manual JC No.': '',
        'Mechanic': '',
        'Frame No': '',
        'Next Due Date': '',
        'Model': '',
        'Part Name': 'GRAND TOTAL',
        'Part No.': '',
        'HSN': '',
        'Qty': '',
        'Rate': '',
        'GST %': '',
        'Disc': '',
        'Amount': grandTotal
      });
      
      // Add empty row for spacing
      dataToExport.push({});
    });
    
    exportToExcel(dataToExport, `job-cards-${dateRange.start}-to-${dateRange.end}`);
  };

  const handlePreview = (e, jobCard) => {
    e.stopPropagation();
    setPreviewJobCard(jobCard);
  };
  
  const saveColumnSettings = (newColumns) => {
    updateSettings({
        workshop_settings: {
            ...settings.workshop_settings,
            job_card_columns: newColumns,
        },
    });
    toast({title: "Settings Saved", description: "Your column preferences have been saved."});
  };

  return (
    <>
      <Card>
        <CardContent className="card-compact">
          <div className="flex-responsive mb-3">
            <div className="search-bar">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Invoice, Customer, Reg No..."
                className="input-compact pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-controls">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="btn-compact flex-1 sm:flex-none justify-start text-left font-normal">
                    {format(new Date(dateRange.start), "dd-MMM-yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(dateRange.start)}
                    onSelect={(date) => setDateRange(prev => ({...prev, start: format(date, 'yyyy-MM-dd')}))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="btn-compact flex-1 sm:flex-none justify-start text-left font-normal">
                    {format(new Date(dateRange.end), "dd-MMM-yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(dateRange.end)}
                    onSelect={(date) => setDateRange(prev => ({...prev, end: format(date, 'yyyy-MM-dd')}))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleExport} variant="outline" className="btn-compact"><Download className="h-3.5 w-3.5" /></Button>
              <ColumnSettingsDialog visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} saveSettings={saveColumnSettings} />
            </div>
          </div>
          <div className="scrollable-container">
            <Table className="table-compact">
              <TableHeader>
                <TableRow>
                  {allJobCardColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                    <TableHead key={col.id}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="text-center">
                      <div className="flex justify-center items-center p-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredJobCards.length > 0 ? filteredJobCards.map(jc => (
                  <TableRow key={jc.id}>
                    {allJobCardColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                      <TableCell key={col.id}>
                        {col.id === 'actions' ? (
                          <div className="action-buttons">
                            <Button variant="ghost" onClick={(e) => handlePreview(e, jc)}><Printer /></Button>
                            <Button variant="ghost" onClick={() => onEdit(jc)}><Edit /></Button>
                            <Button variant="ghost" onClick={() => onDelete(jc.id)}><Trash2 className="text-red-500" /></Button>
                          </div>
                        ) : col.id === 'status' ? (
                          <span className={`status-badge ${jc.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {jc.status || 'pending'}
                          </span>
                        ) : col.id === 'invoice_date' || col.id === 'next_due_date' ? (
                          formatDate(jc[col.id])
                        ) : col.id === 'total_amount' ? (
                          `₹${Number(jc.total_amount).toFixed(2)}`
                        ) : (
                          jc[col.id]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="h-20 text-center">No job cards found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {previewJobCard && (
        <JobCardPreviewDialog 
          jobCard={previewJobCard}
          isOpen={!!previewJobCard}
          onOpenChange={(isOpen) => !isOpen && setPreviewJobCard(null)}
        />
      )}
    </>
  );
};

const ColumnSettingsDialog = ({ visibleColumns, setVisibleColumns, saveSettings }) => {
    const [tempColumns, setTempColumns] = useState(visibleColumns);

    const handleColumnToggle = (colName, checked) => {
        if (checked) {
            setTempColumns(prev => [...prev, colName]);
        } else {
            setTempColumns(prev => prev.filter(c => c !== colName));
        }
    };

    const handleSaveSettings = () => {
        setVisibleColumns(tempColumns);
        saveSettings(tempColumns);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="btn-compact"><Settings className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Customize Columns</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-4">
                    {allJobCardColumns.map(col => (
                       col.id !== 'actions' && <div key={col.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={col.id}
                                checked={tempColumns.includes(col.id)}
                                onCheckedChange={(checked) => handleColumnToggle(col.id, checked)}
                            />
                            <label htmlFor={col.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {col.label}
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

export default JobCardList;
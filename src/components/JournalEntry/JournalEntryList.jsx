import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Loader2, FileDown } from 'lucide-react';
import useJournalEntryStore from '@/stores/journalEntryStore';
import { getJournalEntries, deleteJournalEntry } from '@/utils/db/journalEntries';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui/use-toast';
import { DateRangePicker } from '@/components/ui/daterangepicker';
import { getCurrentMonthDateRange } from '@/utils/dateUtils';
import { exportToExcel } from '@/utils/excel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const JournalEntryList = () => {
  const {
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    setFormData,
    setIsEditing,
    setActiveTab,
    setSelectedEntryId,
  } = useJournalEntryStore();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { toast } = useToast();
  const pageSize = 100;
  const [dateRange, setDateRange] = useState(() => {
    const { start, end } = getCurrentMonthDateRange();
    return { from: new Date(start), to: new Date(end) };
  });

  const fetchEntries = async (range) => {
    setIsLoading(true);
    try {
      const { data, count } = await getJournalEntries({ 
        page, 
        pageSize, 
        searchTerm: debouncedSearchTerm,
        startDate: range.from,
        endDate: range.to,
      });
      setEntries(data);
      setTotalCount(count);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to fetch journal entries: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchEntries(dateRange);
    }
  }, [page, debouncedSearchTerm, dateRange]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleEdit = (entry) => {
    setSelectedEntryId(entry.id);
    setFormData(entry);
    setIsEditing(true);
    setActiveTab('form');
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    try {
      await deleteJournalEntry(entryToDelete.id);
      toast({
        title: 'Success',
        description: 'Journal entry deleted successfully.',
      });
      if (dateRange?.from && dateRange?.to) {
        fetchEntries(dateRange);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete entry: ${error.message}`,
      });
    } finally {
      setEntryToDelete(null);
    }
  };

  const handleExport = () => {
    const dataToExport = entries.map(entry => ({
      'Date': new Date(entry.entry_date).toLocaleDateString(),
      'Party Name': entry.party_name,
      'Particulars': entry.particulars,
      'Model': entry.model_name,
      'Chassis No': entry.chassis_no,
      'Invoice No': entry.invoice_no,
      'Debit': entry.entry_type === 'Debit' ? entry.price : 0,
      'Credit': entry.entry_type === 'Credit' ? entry.price : 0,
      'Narration': entry.narration,
      'Remark': entry.remark,
    }));
    exportToExcel(dataToExport, 'Journal_Entries');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal Entries</CardTitle>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <Input
            placeholder="Search by party, particulars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <DateRangePicker dateRange={dateRange} onDateChange={setDateRange} />
          <Button onClick={handleExport} disabled={entries.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : entries.length > 0 ? (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.party_name}</TableCell>
                    <TableCell>{entry.particulars}</TableCell>
                    <TableCell className="text-right">
                      {entry.entry_type === 'Debit' ? (entry.price || 0).toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.entry_type === 'Credit' ? (entry.price || 0).toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => setEntryToDelete(entry)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the journal entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No journal entries found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} />
              </PaginationItem>
              {[...Array(totalPages).keys()].map(p => (
                <PaginationItem key={p + 1}>
                  <PaginationLink href="#" onClick={() => setPage(p + 1)} isActive={page === p + 1}>
                    {p + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalEntryList;
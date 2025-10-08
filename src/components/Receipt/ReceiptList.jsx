import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import useReceiptStore from '@/stores/receiptStore';
import { getReceipts, deleteReceipt } from '@/utils/db/receipts';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui/use-toast';
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

const ReceiptList = () => {
  const {
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    setFormData,
    setIsEditing,
    setActiveTab,
    setSelectedReceiptId,
  } = useReceiptStore();
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { toast } = useToast();
  const pageSize = 10;

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const { data, count } = await getReceipts({ page, pageSize, searchTerm: debouncedSearchTerm });
      setReceipts(data);
      setTotalCount(count);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to fetch receipts: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [page, debouncedSearchTerm]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleEdit = (receipt) => {
    setSelectedReceiptId(receipt.id);
    setFormData(receipt);
    setIsEditing(true);
    setActiveTab('form');
  };

  const handleDelete = async () => {
    if (!receiptToDelete) return;
    try {
      await deleteReceipt(receiptToDelete.id);
      toast({
        title: 'Success',
        description: 'Receipt deleted successfully.',
      });
      fetchReceipts(); // Refresh list
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete receipt: ${error.message}`,
      });
    } finally {
      setReceiptToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <div className="mt-4">
          <Input
            placeholder="Search by customer name or narration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : receipts.length > 0 ? (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>{new Date(receipt.receipt_date).toLocaleDateString()}</TableCell>
                    <TableCell>{receipt.customers.customer_name}</TableCell>
                    <TableCell>{receipt.payment_mode}</TableCell>
                    <TableCell className="text-right">{(receipt.amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(receipt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => setReceiptToDelete(receipt)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the receipt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setReceiptToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No receipts found.
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

export default ReceiptList;
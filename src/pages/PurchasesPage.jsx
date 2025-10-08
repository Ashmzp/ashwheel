
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { v4 as uuidv4 } from 'uuid';
import { 
  savePurchase as savePurchaseToDb,
  deletePurchase as deletePurchaseFromDb,
  getPurchases,
} from '@/utils/db/purchases';
import { addStock, deleteStockByChassis } from '@/utils/db/stock';
import { Search, Plus, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/utils/excel';
import { formatDate, getCurrentMonthDateRange } from '@/utils/dateUtils';
import PurchaseForm from '@/components/Purchases/PurchaseForm';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { PaginationControls } from '@/components/ui/pagination';
import { initializePurchaseStore, clearPurchaseStore } from '@/stores/purchaseStore';
import useUIStore from '@/stores/uiStore';
import { useDebounce } from '@/hooks/useDebounce';

const PurchaseList = ({ purchases, onAddPurchase, onEditPurchase, onDeletePurchase, loading, totalPages, currentPage, onPageChange, searchTerm, setSearchTerm, dateRange, setDateRange }) => {
  const { toast } = useToast();
  const { canAccess } = useAuth();

  const handleDelete = async (purchaseId, items) => {
    if (window.confirm('Are you sure? This will also remove related items from stock.')) {
      try {
        await onDeletePurchase(purchaseId, items);
        toast({ title: "Success", description: "Purchase deleted successfully!" });
      } catch (error) {
        toast({ title: "Error", description: `Failed to delete purchase. ${error.message}`, variant: "destructive" });
      }
    }
  };

  const handleExport = async () => {
    try {
      const { data: allData } = await getPurchases({
        page: 1,
        pageSize: 10000, // Fetch all matching records
        searchTerm,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (!allData || allData.length === 0) {
        toast({ title: "Info", description: "No data to export for the current filters." });
        return;
      }

      const dataToExport = allData.flatMap(p => 
        (p.items || []).map(item => ({
          'Party Name': p.party_name,
          'Invoice Date': formatDate(p.invoice_date),
          'Invoice Number': p.invoice_no,
          'Model Name': item.modelName,
          'Chassis Number': item.chassisNo,
          'Engine Number': item.engineNo,
          'Colour': item.colour,
          'HSN Code': item.hsn,
          'GST %': item.gst,
          'Price': item.price,
        }))
      );
      
      exportToExcel(dataToExport, 'purchases_report');
      toast({ title: "Success", description: "Data exported to Excel." });
    } catch (error) {
      toast({ title: "Export Error", description: `Failed to export data: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicle Purchases</h1>
        {canAccess('purchases', 'write') && (
          <Button onClick={onAddPurchase}><Plus className="w-4 h-4 mr-2" /> Add Purchase</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Party, Invoice, Chassis..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-auto" />
              <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-auto" />
              <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading purchases...</TableCell></TableRow>
                ) : purchases.length > 0 ? purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.serial_no}</TableCell>
                    <TableCell>{formatDate(purchase.invoice_date)}</TableCell>
                    <TableCell>{purchase.invoice_no}</TableCell>
                    <TableCell>{purchase.party_name}</TableCell>
                    <TableCell>{purchase.items?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      {canAccess('purchases', 'write') && (
                        <Button variant="ghost" size="icon" onClick={() => onEditPurchase(purchase)}><Edit className="h-4 w-4" /></Button>
                      )}
                      {canAccess('purchases', 'delete') && (
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(purchase.id, purchase.items)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No purchases found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {totalPages > 1 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


const PurchasesPage = () => {
  const { openForm, setOpenForm, closeForm } = useUIStore();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(getCurrentMonthDateRange());
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const { user } = useAuth();
  const PAGE_SIZE = 50;

  const showForm = openForm?.type === 'purchase';
  const isEditing = openForm?.mode === 'edit';
  const editingId = openForm?.id;

  const fetchPurchases = useCallback(async (page, term, range) => {
    setLoading(true);
    try {
      const { data, count } = await getPurchases({
        page,
        pageSize: PAGE_SIZE,
        searchTerm: term,
        startDate: range.start,
        endDate: range.end,
      });
      setPurchases(data || []);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to fetch purchases: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPurchases(currentPage, debouncedSearchTerm, dateRange);
  }, [currentPage, debouncedSearchTerm, dateRange, fetchPurchases]);

  useEffect(() => {
    if (showForm) {
      const selectedPurchase = isEditing ? purchases.find(p => p.id === editingId) : null;
      if (isEditing && !selectedPurchase && !loading) {
        toast({ title: "Not Found", description: "The purchase you were editing could not be found.", variant: 'destructive' });
        closeForm();
        return;
      }
      initializePurchaseStore(isEditing, selectedPurchase);
    }
  }, [showForm, isEditing, editingId, purchases, loading, closeForm, toast]);

  const handleAddPurchase = () => {
    setOpenForm({ type: 'purchase', mode: 'new' });
  };

  const handleEditPurchase = (purchase) => {
    setOpenForm({ type: 'purchase', mode: 'edit', id: purchase.id });
  };

  const handleSavePurchase = async (purchaseData) => {
    const selectedPurchase = isEditing ? purchases.find(p => p.id === editingId) : null;
    try {
      if (selectedPurchase) {
        if (selectedPurchase.items && selectedPurchase.items.length > 0) {
          const oldChassisNos = selectedPurchase.items.map(item => item.chassisNo);
          await deleteStockByChassis(oldChassisNos);
        }
      }
      
      const savedData = await savePurchaseToDb(purchaseData);
      
      if (savedData.items && savedData.items.length > 0) {
        const newStockItems = savedData.items.map(item => ({
          id: uuidv4(),
          purchase_id: savedData.id,
          model_name: item.modelName,
          chassis_no: item.chassisNo,
          engine_no: item.engineNo,
          colour: item.colour,
          hsn: item.hsn,
          gst: item.gst,
          price: item.price,
          purchase_date: savedData.invoice_date,
          user_id: user.id
        }));
        await addStock(newStockItems);
      }
      
      toast({
        title: "Success",
        description: `Purchase ${selectedPurchase ? 'updated' : 'created'} and stock updated.`
      });

      clearPurchaseStore(isEditing, editingId);
      closeForm();
      fetchPurchases(1, '', getCurrentMonthDateRange());
      setCurrentPage(1);
      setSearchTerm('');
      setDateRange(getCurrentMonthDateRange());

    } catch (error) {
      console.error("Failed to save purchase and update stock:", error);
      toast({
        title: "Error",
        description: `Failed to save purchase. ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  const handleDeletePurchase = async (purchaseId, items) => {
    if(items && items.length > 0) {
        const chassisNosToDelete = items.map(item => item.chassisNo);
        await deleteStockByChassis(chassisNosToDelete);
    }
    await deletePurchaseFromDb(purchaseId);
    fetchPurchases(currentPage, searchTerm, dateRange);
  };

  const handleCancel = () => {
    clearPurchaseStore(isEditing, editingId);
    closeForm();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Helmet>
        <title>Purchases - Showroom Pro</title>
        <meta name="description" content="Manage all your vehicle purchases." />
      </Helmet>
      <div className="p-4 md:p-8">
        {showForm ? (
          <PurchaseForm
            onSave={handleSavePurchase}
            onCancel={handleCancel}
          />
        ) : (
          <PurchaseList
            purchases={purchases}
            onAddPurchase={handleAddPurchase}
            onEditPurchase={handleEditPurchase}
            onDeletePurchase={handleDeletePurchase}
            loading={loading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}
      </div>
    </>
  );
};

export default PurchasesPage;

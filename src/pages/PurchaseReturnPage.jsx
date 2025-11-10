import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getPurchaseReturns, savePurchaseReturn, deletePurchaseReturn, addStock, deleteStockByChassis } from '@/utils/db';
import { getCurrentDate, formatDate, getCurrentMonthDateRange } from '@/utils/dateUtils';
import { exportToExcel } from '@/utils/excel';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import PurchaseReturnForm from '@/components/PurchaseReturns/PurchaseReturnForm';
import PurchaseReturnList from '@/components/PurchaseReturns/PurchaseReturnList';
import usePurchaseReturnStore from '@/stores/purchaseReturnStore';

const PurchaseReturnPage = () => {
    const [view, setView] = useState('list');
    const [returns, setReturns] = useState([]);
    const [editingReturn, setEditingReturn] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const { canAccess } = useAuth();
    const searchDebounceTimeout = useRef(null);
    const PAGE_SIZE = 10;
    const resetForm = usePurchaseReturnStore(state => state.resetForm);

    const initialDateRange = getCurrentMonthDateRange();
    const [dateRange, setDateRange] = useState({ start: initialDateRange.start, end: initialDateRange.end });

    const fetchReturns = useCallback(async (page = currentPage, term = searchTerm, range = dateRange) => {
        setLoading(true);
        try {
            const { data, count } = await getPurchaseReturns({ page, pageSize: PAGE_SIZE, searchTerm: term, dateRange: range });
            setReturns(Array.isArray(data) ? data : []);
            setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
        } catch (error) {
            toast({ title: 'Error', description: 'Could not fetch purchase returns.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, dateRange, toast]);

    useEffect(() => {
        clearTimeout(searchDebounceTimeout.current);
        searchDebounceTimeout.current = setTimeout(() => {
            setCurrentPage(1);
            fetchReturns(1, searchTerm, dateRange);
        }, 500);
    }, [searchTerm, dateRange, fetchReturns]);
    
    useEffect(() => {
        fetchReturns(1, searchTerm, dateRange);
    }, []);

    const handleSave = async (returnData) => {
        try {
            await savePurchaseReturn(returnData);
            
            const chassisNos = (Array.isArray(returnData.items) ? returnData.items : []).map(item => item.chassisNo);
            await deleteStockByChassis(chassisNos);

            toast({ title: "Success", description: "Purchase return saved and stock updated." });
            setView('list');
            setEditingReturn(null);
            fetchReturns(1, '', { start: '', end: '' });
        } catch (error) {
            toast({ title: "Error", description: `Failed to save purchase return: ${error.message}`, variant: "destructive" });
        }
    };
    
    const handleDelete = async (returnToDelete) => {
        if(window.confirm("Are you sure? This will delete the purchase return and add items back to stock.")) {
            try {
                const stockItems = (Array.isArray(returnToDelete.items) ? returnToDelete.items : []).map(item => ({
                    purchase_id: `PR-DEL-${returnToDelete.id}`,
                    model_name: item.modelName,
                    chassis_no: item.chassisNo,
                    engine_no: item.engineNo,
                    colour: item.colour,
                    price: item.price,
                    purchase_date: returnToDelete.return_date,
                    hsn: item.hsn,
                    gst: item.gst
                }));
                await addStock(stockItems);

                await deletePurchaseReturn(returnToDelete.id);
                toast({ title: "Success", description: "Purchase return deleted and stock restored." });
                fetchReturns(currentPage, searchTerm, dateRange);
            } catch (error) {
                toast({ title: "Error", description: `Failed to delete purchase return: ${error.message}`, variant: "destructive" });
            }
        }
    };
    
    const handleExport = async () => {
        try {
            const { data: allReturns } = await getPurchaseReturns({
                page: 1,
                pageSize: 9999, // Fetch all matching records
                searchTerm,
                dateRange,
            });

            if (!allReturns || allReturns.length === 0) {
                toast({ title: "No Data", description: "No data to export for the current filters." });
                return;
            }

            const excelData = allReturns.flatMap(r => 
                (Array.isArray(r.items) ? r.items : []).map(item => ({
                    "Return Invoice No": r.return_invoice_no,
                    "Return Date": formatDate(r.return_date),
                    "Party Name": r.party_name,
                    "Original Invoice No": r.purchases?.invoice_no || 'N/A',
                    "Reason": r.reason,
                    "Model Name": item.modelName,
                    "Chassis No": item.chassisNo,
                    "Engine No": item.engineNo,
                    "Colour": item.colour,
                    "Price": item.price,
                    "HSN": item.hsn,
                    "GST": item.gst,
                }))
            );

            exportToExcel(excelData, `Purchase_Returns_${getCurrentDate()}`);
            toast({ title: "Export Successful", description: "Purchase returns have been exported." });
        } catch (error) {
            toast({ title: "Export Error", description: `Could not export data: ${error.message}`, variant: "destructive" });
        }
    };

    const handleEdit = (ret) => {
        setEditingReturn(ret);
        setView('form');
    };
    
    const handleCancel = () => {
        setView('list');
        setEditingReturn(null);
        resetForm();
    }

    return (
        <>
            <Helmet>
                <title>Purchase Returns - Showroom Pro</title>
            </Helmet>
            <div className="space-y-4">
                {view === 'list' && (
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Purchase Returns Management</h1>
                        {canAccess('purchase_returns', 'write') && (
                            <Button onClick={() => { setEditingReturn(null); resetForm(); setView('form'); }}><Plus className="w-4 h-4 mr-2" /> New Purchase Return</Button>
                        )}
                    </div>
                )}
                {view === 'list' ? (
                    <PurchaseReturnList 
                        returns={returns} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                        loading={loading} 
                        totalPages={totalPages} 
                        currentPage={currentPage} 
                        onPageChange={(page) => {
                            setCurrentPage(page);
                            fetchReturns(page, searchTerm, dateRange);
                        }}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        onExport={handleExport}
                    />
                ) : (
                    <PurchaseReturnForm onSave={handleSave} onCancel={handleCancel} existingReturn={editingReturn} />
                )}
            </div>
        </>
    );
};

export default PurchaseReturnPage;
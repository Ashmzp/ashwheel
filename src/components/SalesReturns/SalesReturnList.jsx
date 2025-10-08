import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, Edit, Loader2, FileDown } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { PaginationControls } from '@/components/ui/pagination';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';

const SalesReturnList = ({ returns, onEdit, onDelete, loading, totalPages, currentPage, onPageChange, searchTerm, setSearchTerm, dateRange, setDateRange, onExport }) => {
    const { canAccess } = useAuth();
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>Sales Returns</CardTitle>
                    <Button onClick={onExport} variant="outline" size="sm">
                        <FileDown className="w-4 h-4 mr-2" />
                        Export to Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Input
                            placeholder="Search by Chassis, Engine, Party..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Return No</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Party</TableHead>
                                <TableHead>Items (Model, Chassis, Engine)</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             <AnimatePresence>
                            {loading ? <TableRow><TableCell colSpan="6" className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow> :
                             returns.length > 0 ? returns.map(r => (
                                <motion.tr key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <TableCell>{r.return_invoice_no}</TableCell>
                                    <TableCell>{formatDate(r.return_date)}</TableCell>
                                    <TableCell>{r.customer_name}</TableCell>
                                    <TableCell>
                                        <ul className="list-disc list-inside">
                                            {(Array.isArray(r.items) ? r.items : []).map((item, index) => (
                                                <li key={index} className="text-xs">
                                                    {item.model_name} ({item.chassis_no} / {item.engine_no})
                                                </li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                    <TableCell>₹{parseFloat(r.total_refund_amount).toFixed(2)}</TableCell>
                                    <TableCell>
                                        {canAccess('sales_returns', 'write') && (
                                            <Button variant="ghost" size="icon" onClick={() => onEdit(r)} disabled><Edit className="w-4 h-4" /></Button>
                                        )}
                                        {canAccess('sales_returns', 'delete') && (
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(r)}><Trash2 className="w-4 h-4" /></Button>
                                        )}
                                    </TableCell>
                                </motion.tr>
                            )) : <TableRow><TableCell colSpan="6" className="text-center">No sales returns found.</TableCell></TableRow>}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
                {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />}
            </CardContent>
        </Card>
    );
};

export default SalesReturnList;
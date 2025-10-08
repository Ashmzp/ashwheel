import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PackageOpen, ShoppingCart, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateUtils';
import useReportStore from '@/stores/reportStore';

const TrackVehicle = () => {
    const { trackVehicle, setTrackVehicleState } = useReportStore();
    const { searchTerm } = trackVehicle || {};
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const navigate = useNavigate();

    const { data, isLoading, error, isFetched } = useQuery({
        queryKey: ['trackVehicleHistory', debouncedSearchTerm],
        queryFn: async () => {
            if (!debouncedSearchTerm) return null;
            const { data, error } = await supabase.rpc('track_vehicle_history_v13', { p_search_term: debouncedSearchTerm });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!debouncedSearchTerm,
    });
    
    const handleRowDoubleClick = (module, id) => {
        let path = '';
        switch (module) {
            case 'purchases':
                path = `/purchases?formId=${id}`;
                break;
            case 'purchase_returns':
                path = `/purchase-returns?formId=${id}`;
                break;
            case 'vehicle_sales':
                path = `/vehicle-invoices?formId=${id}`;
                break;
            case 'sales_returns':
                path = `/sales-returns?formId=${id}`;
                break;
            default:
                return;
        }
        navigate(path);
    };

    const hasData = useMemo(() => {
        if (!data) return false;
        return Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0);
    }, [data]);

    const renderPurchaseTile = (purchase) => (
        <TableRow key={`purchase-${purchase.id}`} className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleRowDoubleClick('purchases', purchase.id)}>
            <TableCell>{formatDate(purchase.invoice_date)}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-semibold">{purchase.party_name}</span>
                    <span className="text-xs text-muted-foreground">{purchase.invoice_no}</span>
                </div>
            </TableCell>
            <TableCell>
                {(purchase.items || []).map(item => (
                    <div key={item.chassis_no || item.chassisNo} className="text-xs">
                        {item.modelName} ({item.chassis_no || item.chassisNo})
                    </div>
                ))}
            </TableCell>
        </TableRow>
    );

    const renderPurchaseReturnTile = (pr) => (
        <TableRow key={`pr-${pr.id}`} className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleRowDoubleClick('purchase_returns', pr.id)}>
            <TableCell>{formatDate(pr.return_date)}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-semibold">{pr.party_name}</span>
                    <span className="text-xs text-muted-foreground">{pr.return_invoice_no}</span>
                </div>
            </TableCell>
            <TableCell>
                {(pr.items || []).map(item => (
                    <div key={item.chassisNo} className="text-xs">
                        {item.modelName} ({item.chassisNo})
                    </div>
                ))}
            </TableCell>
        </TableRow>
    );

    const renderSaleTile = (sale) => (
        <TableRow key={`sale-${sale.id}`} className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleRowDoubleClick('vehicle_sales', sale.id)}>
            <TableCell>{formatDate(sale.invoice_date)}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-semibold">{sale.customer_name}</span>
                    <span className="text-xs text-muted-foreground">{sale.invoice_no}</span>
                </div>
            </TableCell>
            <TableCell>
                 {(sale.items || []).map(item => (
                    <div key={item.chassis_no} className="text-xs">
                        {item.model_name} ({item.chassis_no})
                    </div>
                ))}
            </TableCell>
        </TableRow>
    );

    const renderSalesReturnTile = (sr) => (
         <TableRow key={`sr-${sr.id}`} className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleRowDoubleClick('sales_returns', sr.id)}>
            <TableCell>{formatDate(sr.return_date)}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-semibold">{sr.customer_name}</span>
                    <span className="text-xs text-muted-foreground">{sr.return_invoice_no}</span>
                </div>
            </TableCell>
            <TableCell>
                {(sr.items || []).map(item => (
                    <div key={item.chassis_no} className="text-xs">
                        {item.model_name} ({item.chassis_no})
                    </div>
                ))}
            </TableCell>
        </TableRow>
    );
    
    const ModuleTile = ({ title, icon, data, renderItem }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {data && data.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Party</TableHead>
                                <TableHead>Vehicles</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(item => renderItem(item))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-sm text-muted-foreground p-4">No data found in this module.</div>
                )}
            </CardContent>
        </Card>
    );


    return (
        <div>
            <div className="flex gap-2 mb-4">
                <Input 
                    placeholder="Search by Customer, Chassis, Engine, or Invoice No..."
                    value={searchTerm || ''}
                    onChange={(e) => setTrackVehicleState({ searchTerm: e.target.value })}
                />
            </div>
            {isLoading && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            
            {debouncedSearchTerm && isFetched && !isLoading && !error && (
                !hasData ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-muted">
                        <PackageOpen className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">No History Found</h3>
                        <p className="text-muted-foreground">We couldn't find any records matching "{debouncedSearchTerm}".</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                       <ModuleTile title="Purchases" icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} data={data.purchases} renderItem={renderPurchaseTile} />
                       <ModuleTile title="Purchase Returns" icon={<ArrowLeftRight className="h-4 w-4 text-muted-foreground" />} data={data.purchase_returns} renderItem={renderPurchaseReturnTile} />
                       <ModuleTile title="Vehicle Sales" icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} data={data.vehicle_sales} renderItem={renderSaleTile} />
                       <ModuleTile title="Sales Returns" icon={<RotateCcw className="h-4 w-4 text-muted-foreground" />} data={data.sales_returns} renderItem={renderSalesReturnTile} />
                    </div>
                )
            )}
        </div>
    );
};

export default TrackVehicle;
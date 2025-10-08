import React from 'react';
import { motion } from 'framer-motion';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Printer, Edit, Trash2 } from 'lucide-react';
import { EXPORT_COLUMNS_CONFIG } from './columnsConfig';

const renderCellContent = (invoice, colName) => {
    const config = EXPORT_COLUMNS_CONFIG[colName];
    if (!config) return null;

    let value;

    if (config.source === 'customer') {
        value = invoice.customers ? invoice.customers[config.key] : invoice.customer_details?.[config.key];
    } else if (config.source === 'item') {
        value = (invoice.vehicle_invoice_items || []).map(item => item[config.key]).join(', ');
    } else {
        value = invoice[config.key];
    }
    
    const displayValue = config.format ? config.format(value) : (value ?? '');

    return (
      <TableCell key={`${invoice.id}-${colName}`}>{displayValue}</TableCell>
    );
};


const InvoiceTableRow = ({ invoice, isSelected, onSelectRow, visibleColumns, onPrint, onEditInvoice, onDeleteInvoice, canAccess }) => {
    return (
        <motion.tr
            key={invoice.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={isSelected ? 'bg-secondary' : ''}
        >
            <TableCell>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectRow(invoice.id, checked)}
                />
            </TableCell>
            {visibleColumns.map(colName => renderCellContent(invoice, colName))}
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" title="Print Delivery Challan" onClick={() => onPrint('DeliveryChallan', invoice)}><Printer className="h-4 w-4 text-blue-400" /></Button>
                <Button variant="ghost" size="icon" title="Print Tax Invoice" onClick={() => onPrint('TaxInvoice', invoice)}><Printer className="h-4 w-4 text-green-400" /></Button>
                {canAccess('vehicle_invoices', 'write') && (
                    <Button variant="ghost" size="icon" title="Edit Invoice" onClick={() => onEditInvoice(invoice)}><Edit className="h-4 w-4" /></Button>
                )}
                {canAccess('vehicle_invoices', 'delete') && (
                    <Button variant="ghost" size="icon" title="Delete Invoice" className="text-red-500" onClick={() => onDeleteInvoice(invoice.id)}><Trash2 className="h-4 w-4" /></Button>
                )}
            </TableCell>
        </motion.tr>
    );
};

export default React.memo(InvoiceTableRow);
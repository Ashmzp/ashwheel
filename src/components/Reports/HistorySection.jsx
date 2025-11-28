import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateUtils';

const HistorySection = ({ title, data, columns, onRowDoubleClick }) => {
    if (!data || data.length === 0) return null;

    return (
        <div>
            <h4 className="font-semibold mb-1">{title}</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map(col => <TableHead key={col.key}>{col.header}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, idx) => (
                        <TableRow key={row.id || idx} onDoubleClick={() => onRowDoubleClick(row)} className="cursor-pointer hover:bg-muted/50">
                            {columns.map((col, colIdx) => (
                                <TableCell key={col.key || colIdx}>
                                    {col.key && col.key.includes('date') && row[col.key] ? formatDate(row[col.key]) : (row[col.key] || '-')}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default HistorySection;
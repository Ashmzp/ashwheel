import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/dateUtils';

const FollowUpList = ({ followUps, onTakeFollowUp }) => {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Next Due Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Chassis No</TableHead>
              <TableHead>Last Remark</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {followUps.length > 0 ? (
              followUps.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.next_due_date)}</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{item.customer_mobile}</TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.frame_no}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.workshop_follow_ups?.[item.workshop_follow_ups.length - 1]?.remark || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => onTakeFollowUp(item)}>Take Follow-up</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No follow-ups found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FollowUpList;
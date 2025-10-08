import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import JobCardPDF from '@/components/Workshop/JobCardPDF';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const JobCardPreviewDialog = ({ jobCard, isOpen, onOpenChange }) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `JobCard-${jobCard?.invoice_no || 'invoice'}`,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Job Card Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-auto border rounded-md p-2 bg-gray-100">
           <div ref={componentRef}>
             <JobCardPDF jobCard={jobCard} />
           </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobCardPreviewDialog;
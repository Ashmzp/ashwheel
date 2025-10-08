import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getJobCardById } from '@/utils/db/jobCards';
import JobCardPDF from '@/components/Workshop/JobCardPDF';
import { Helmet } from 'react-helmet-async';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const JobCardPrintPage = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [jobCard, setJobCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const componentRef = useRef();
  const { toast } = useToast();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `JobCard-${jobCard?.invoice_no || 'invoice'}`,
  });

  const fetchAndPrint = useCallback(async () => {
    if (!id || !user) {
      if (!user) setError("Authentication error. Please log in and try again.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log("Fetching JobCard with ID:", id);
      const data = await getJobCardById(id);
      if (data) {
        console.log("Fetched JobCard data:", data);
        setJobCard(data);
      } else {
        const errorMessage = "Job Card not found. It may have been deleted or you don't have permission to view it.";
        console.error(errorMessage, "ID:", id);
        setError(errorMessage);
        toast({
          title: 'Error Loading Job Card',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = `Failed to fetch job card: ${err.message}`;
      console.error(errorMessage, err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, user, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchAndPrint();
    }
  }, [authLoading, fetchAndPrint]);

  useEffect(() => {
    if (jobCard && !loading && !error) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [jobCard, loading, error, handlePrint]);
  
  if (loading || authLoading) {
    return <div className="flex justify-center items-center h-screen bg-white text-gray-700">Loading document for printing...</div>;
  }

  if (error) {
     return <div className="flex justify-center items-center h-screen bg-white text-red-500 p-4 text-center">{error}</div>;
  }

  if (!jobCard) {
    return <div className="flex justify-center items-center h-screen bg-white text-gray-700">Preparing document...</div>;
  }

  return (
    <>
      <Helmet>
        <title>Print Job Card {jobCard?.invoice_no}</title>
      </Helmet>
      <div style={{ display: 'none' }}>
          <div ref={componentRef} className="print-container">
            <JobCardPDF jobCard={jobCard} />
          </div>
      </div>
       <style>{`
          @media print {
            body * {
                visibility: hidden;
            }
            .print-container, .print-container * {
                visibility: visible;
            }
            .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        `}</style>
    </>
  );
};

export default JobCardPrintPage;
import React, { useState, useRef, useCallback } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scissors, Download, Loader2, ArrowLeft, RefreshCw, FileText, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { sanitizeFilename } from '@/utils/sanitize';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const SplitPdfPage = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagePreviews, setPagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const MAX_FILE_SIZE = 20 * 1024 * 1024;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "Is PDF splitting free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, completely free with unlimited splits."}},
      {"@type": "Question", "name": "Are my files secure?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, all processing happens in your browser. Files never uploaded."}},
      {"@type": "Question", "name": "Can I select specific pages?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, you can remove unwanted pages before downloading."}}
    ]
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        if (selectedFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File Type', description: 'Please select a valid PDF file.', variant: 'destructive' });
            return;
        }
        if (selectedFile.size > MAX_FILE_SIZE) {
            toast({ title: 'File Too Large', description: 'Please select a file smaller than 20MB.', variant: 'destructive'});
            return;
        }
        setFile(selectedFile);
        generatePreviews(selectedFile);
    }
  };
  
  const generatePreviews = useCallback(async (pdfFile) => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setPagePreviews([]);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsDoc = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      
      if (pdfjsDoc.isEncrypted) {
        toast({ title: "Encrypted PDF", description: "This PDF is password-protected and cannot be processed.", variant: "destructive" });
        resetState();
        return;
      }
      
      const numPages = pdfjsDoc.numPages;
      if (numPages <= 1) {
        toast({ title: 'Single Page PDF', description: 'This PDF has only one page and cannot be split.' });
        resetState();
        return;
      }

      const previewPromises = [];
      for (let i = 1; i <= numPages; i++) {
        previewPromises.push((async () => {
          const page = await pdfjsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          return { pageNumber: i, dataUrl: canvas.toDataURL() };
        })());
      }

      const previews = await Promise.all(previewPromises);
      setPagePreviews(previews);

    } catch (error) {
      console.error("Splitting Error:", error);
      toast({ title: 'Processing Failed', description: 'Could not process the PDF file. It might be corrupted.', variant: 'destructive' });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);
  
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
        if (droppedFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File Type', description: 'Please drag and drop a valid PDF file.', variant: 'destructive' });
            return;
        }
        if (droppedFile.size > MAX_FILE_SIZE) {
            toast({ title: 'File Too Large', description: 'Please select a file smaller than 20MB.', variant: 'destructive' });
            return;
        }
        setFile(droppedFile);
        fileInputRef.current.files = e.dataTransfer.files;
        generatePreviews(droppedFile);
    }
  };
  
  const deletePage = (pageNumber) => {
    setPagePreviews(previews => previews.filter(p => p.pageNumber !== pageNumber));
    toast({ title: 'Page Removed', description: `Page ${pageNumber} has been removed from the split.` });
  };
  
  const handleDownloadAll = async () => {
    if (!file || pagePreviews.length === 0) return;

    setIsProcessing(true); 
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const zip = new JSZip();
      const originalFileName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
      const pageNumbersToKeep = pagePreviews.map(p => p.pageNumber);

      for (const pageNumber of pageNumbersToKeep) {
        const subDoc = await PDFDocument.create();
        const [copiedPage] = await subDoc.copyPages(pdfDoc, [pageNumber - 1]);
        subDoc.addPage(copiedPage);
        const pdfBytes = await subDoc.save();
        zip.file(`${originalFileName}-page_${pageNumber}.pdf`, pdfBytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${originalFileName}-split-ashwheel.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast({ title: 'Download Started', description: 'Your ZIP file with the selected pages is downloading.' });
    } catch (error) {
        toast({ title: 'Download Failed', description: 'Could not create the ZIP file.', variant: 'destructive' });
    } finally {
        setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPagePreviews([]);
    setIsProcessing(false);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <SEO path="/split-pdf" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-background p-4 sm:p-6">
        <main className="w-full max-w-7xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Scissors className="text-primary h-6 w-6"/>Split PDF</CardTitle>
                    <CardDescription>Upload a PDF to see all its pages. Remove any pages you don't want, then download the rest as a ZIP file.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!file && (
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        >
                            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-lg text-muted-foreground">Drag & drop a PDF here, or click to select</p>
                            <p className="text-sm text-muted-foreground">Max file size: 20MB. Your files are processed in-browser.</p>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden"/>
                        </div>
                    )}

                    <AnimatePresence>
                    {isProcessing && pagePreviews.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center p-8">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                            <p className="text-lg">Generating Previews...</p>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    <AnimatePresence>
                    {pagePreviews.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 p-4 bg-secondary/50 rounded-lg">
                                <div className="text-center sm:text-left">
                                    <p className="font-semibold">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{pagePreviews.length} pages ready to be split.</p>
                                </div>
                                <div className="flex gap-2">
                                     <Button onClick={resetState} variant="outline">
                                        <RefreshCw className="mr-2 h-4 w-4" /> Split Another
                                    </Button>
                                    <Button onClick={handleDownloadAll} disabled={isProcessing || pagePreviews.length === 0}>
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                        Download Pages (.zip)
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {pagePreviews.map((preview, index) => (
                                    <motion.div
                                        key={preview.pageNumber}
                                        className="relative group border rounded-lg overflow-hidden flex flex-col items-center justify-center bg-white"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <img src={preview.dataUrl} alt={`Page ${preview.pageNumber}`} className="w-full h-auto object-contain"/>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="destructive" size="icon" onClick={() => deletePage(preview.pageNumber)}>
                                                <Trash2 className="h-5 w-5"/>
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-0 w-full bg-black/50 text-white text-xs text-center py-1">
                                            Page {preview.pageNumber}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to Use PDF Splitter</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ol>
                  <li><strong>Upload Your PDF:</strong> Click the upload area or drag and drop a multi-page PDF file. The tool supports files up to 20MB.</li>
                  <li><strong>Review Pages:</strong> Once uploaded, you'll see a preview of every page in your document.</li>
                  <li><strong>Remove Unwanted Pages:</strong> Hover over any page you don't want to include in the final split. A red trash icon will appear. Click it to remove the page from the selection.</li>
                  <li><strong>Download All Pages:</strong> Click the "Download Pages (.zip)" button. The tool will save all the remaining pages as individual PDF files, bundled together in a single ZIP archive for your convenience.</li>
                  <li><strong>Start Over:</strong> If you want to split a different document, simply click the "Split Another" button.</li>
                </ol>
                <p><strong>Secure & Private:</strong> Your files are processed entirely within your browser. No data is ever sent to our servers, ensuring your information remains confidential.</p>
              </CardContent>
            </Card>
        </main>
      </div>
    </>
  );
};

export default SplitPdfPage;
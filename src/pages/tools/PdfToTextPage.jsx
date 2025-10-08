
import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PdfToTextPage = () => {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setExtractedText('');
      handleConvert(selectedFile);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a valid PDF file.',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setExtractedText('');
      if (fileInputRef.current) fileInputRef.current.files = e.dataTransfer.files;
      handleConvert(droppedFile);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please drag and drop a valid PDF file.',
        variant: 'destructive',
      });
    }
  };

  const handleConvert = useCallback(async (pdfFile) => {
    if (!pdfFile) return;

    setIsConverting(true);
    setExtractedText('');
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        const typedarray = new Uint8Array(fileReader.result);
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        const pdf = await loadingTask.promise;
        let fullText = '';
        let hasText = false;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          if (textContent.items.length > 0) {
            hasText = true;
          }
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        
        if (!hasText) {
          toast({
            title: 'No Text Detected',
            description: "This PDF appears to be a scanned image with no selectable text. OCR functionality is not yet available.",
            variant: "destructive",
            duration: 9000
          });
          setExtractedText("No text was detected. Your PDF might be a scanned image. For scanned PDFs, please note that OCR (Optical Character Recognition) is not yet supported by this tool.");
        } else {
            setExtractedText(fullText.trim());
            toast({
              title: 'Text Extracted Successfully',
              description: `Extracted text from ${pdf.numPages} page(s). You can now download it as a .txt file.`,
            });
        }
      } catch (error) {
        console.error("Conversion Error:", error);
        toast({
          title: 'Conversion Failed',
          description: error.message || 'Could not process the PDF file. It might be corrupted or protected.',
          variant: 'destructive',
        });
      } finally {
        setIsConverting(false);
      }
    };
    
    fileReader.onerror = () => {
        toast({
            title: 'File Read Error',
            description: 'Could not read the selected file.',
            variant: 'destructive',
        });
        setIsConverting(false);
    };

    fileReader.readAsArrayBuffer(pdfFile);
  }, [toast]);

  const handleDownload = () => {
    if (!extractedText || extractedText === "No text was detected. Your PDF might be a scanned image. For scanned PDFs, please note that OCR (Optical Character Recognition) is not yet supported by this tool.") return;

    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const originalFileName = file.name.replace(/\.pdf$/i, '');
    link.download = `${originalFileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({
        title: 'Download Started',
        description: 'Your text file is being downloaded.',
    });
  };

  const resetState = () => {
    setFile(null);
    setExtractedText('');
    setIsConverting(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const renderContent = () => {
    if (!file) {
      return (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
        >
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">Drag & drop a PDF here, or click to select</p>
          <p className="text-sm text-muted-foreground">Only PDFs with selectable text are supported. Scanned PDFs are not yet supported.</p>
          <input
            type="file"
            id="pdf-to-text-upload"
            name="pdf-to-text-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
        </div>
      );
    }

    if (isConverting) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center p-8">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg">Extracting text, please wait...</p>
        </motion.div>
      )
    }

    if (extractedText) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 p-4 bg-secondary/50 rounded-lg">
              <p className="font-semibold flex-1 truncate">{file.name}</p>
              <div className="flex gap-2">
                  <Button onClick={resetState} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" /> New PDF
                  </Button>
                  <Button onClick={handleDownload} disabled={!extractedText || extractedText === "No text was detected. Your PDF might be a scanned image. For scanned PDFs, please note that OCR (Optical Character Recognition) is not yet supported by this tool."}>
                      <Download className="mr-2 h-4 w-4" /> Download (.txt)
                  </Button>
              </div>
          </div>
          
          <div className="w-full p-4 border rounded-lg h-96 overflow-y-auto bg-muted/50">
              <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
          </div>
        </motion.div>
      );
    }
    return null;
  }

  return (
    <>
      <Helmet>
        <title>PDF to Text Extractor - Ashwheel Tools</title>
        <meta name="description" content="Extract all selectable text from your PDF files and download as a TXT file. Ideal for copying content from PDFs for editing or analysis. Note: OCR for scanned PDFs is not yet supported." />
        <meta name="keywords" content="pdf to text, extract text from pdf, pdf text extractor, copy text from pdf, convert pdf to txt, searchable pdf, pdf text converter" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
            <Button variant="ghost" asChild>
                <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tools
                </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">PDF to Text Extractor</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle>Upload PDF to Extract Text</CardTitle>
                    <CardDescription>This tool extracts all selectable text from your PDF file. Ideal for copying content for editing or analysis. (Note: Scanned PDFs with no selectable text are not yet supported).</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {renderContent()}
                  </AnimatePresence>
                </CardContent>
            </Card>
            <Card className="w-full max-w-4xl mt-8">
                <CardHeader>
                    <CardTitle>How to Use the PDF to Text Extractor</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Quickly and easily extract all the text from your PDF documents. Here’s how it works:</p>
                    <ol>
                        <li><strong>Upload Your PDF:</strong> Drag and drop your PDF file into the upload area, or click to select it from your device.</li>
                        <li><strong>Automatic Extraction:</strong> The tool will immediately start processing the file to extract all selectable text.</li>
                        <li><strong>Review & Download:</strong> The extracted text will appear in the text box. You can review it, copy it, or click the "Download (.txt)" button to save it as a plain text file.</li>
                    </ol>
                    <h3>Important Note on Scanned PDFs</h3>
                    <p>This tool works by reading the text layer embedded in a PDF. If your PDF is a scan of a physical document (i.e., an image), it will not have a text layer, and this tool will not be able to extract any text. Support for scanned documents using Optical Character Recognition (OCR) is planned for a future update.</p>
                </CardContent>
            </Card>
        </main>
      </div>
    </>
  );
};

export default PdfToTextPage;

import React, { useState, useRef, useCallback } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { Link } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Upload, FileImage, Download, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
    import JSZip from 'jszip';
    import { saveAs } from 'file-saver';
    import * as pdfjsLib from "pdfjs-dist";
    import pdfWorker from "pdfjs-dist/build/pdf.worker.js?url";

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

    const PdfToJpegPage = () => {
      const [file, setFile] = useState(null);
      const [images, setImages] = useState([]);
      const [isConverting, setIsConverting] = useState(false);
      const fileInputRef = useRef(null);
      const { toast } = useToast();
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

      const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
          if (selectedFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File Type', description: 'Please select a valid PDF file.', variant: 'destructive' });
            return;
          }
          if (selectedFile.size > MAX_FILE_SIZE) {
            toast({ title: 'File Too Large', description: 'Please select a file smaller than 50MB.', variant: 'destructive' });
            return;
          }
          handleConvert(selectedFile);
        } else {
          toast({ title: 'No File Selected', description: 'Please select a PDF file to convert.', variant: 'destructive' });
        }
      };

      const handleDragOver = (e) => {
        e.preventDefault();
      };

      const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
          if (droppedFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File Type', description: 'Please drag and drop a valid PDF file.', variant: 'destructive' });
            return;
          }
          if (droppedFile.size > MAX_FILE_SIZE) {
            toast({ title: 'File Too Large', description: 'Please select a file smaller than 50MB.', variant: 'destructive' });
            return;
          }
          if (fileInputRef.current) {
            fileInputRef.current.files = e.dataTransfer.files;
          }
          handleConvert(droppedFile);
        } else {
          toast({ title: 'No File Dropped', description: 'Please drag and drop a PDF file to convert.', variant: 'destructive' });
        }
      };
      
      const handleConvert = useCallback(async (pdfFile) => {
        if (!pdfFile) return;

        setFile(pdfFile);
        setIsConverting(true);
        setImages([]);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            if (pdf.isEncrypted) {
              toast({
                title: "Encrypted PDF",
                description: "This PDF is password-protected and cannot be converted.",
                variant: "destructive",
              });
              setIsConverting(false);
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
            }

            const pageCount = pdf.numPages;
            const outputFileName = pdfFile.name.replace(/\.pdf$/i, '');

            if (pageCount === 1) {
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2 }); // Higher scale for better quality
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;
                
                canvas.toBlob((blob) => {
                    saveAs(blob, `${outputFileName}-ashwheel.jpeg`); // More descriptive name
                    toast({ title: 'Conversion Successful', description: 'Single page PDF downloaded as JPEG.' });
                    resetState();
                }, 'image/jpeg', 0.95); // 95% quality

            } else {
                const zip = new JSZip();
                for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2 });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    await page.render({ canvasContext: context, viewport }).promise;
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
                    zip.file(`${outputFileName}-page-${pageNum}.jpeg`, blob);
                }
                const zipBlob = await zip.generateAsync({ type: "blob" });
                saveAs(zipBlob, `${outputFileName}-ashwheel.zip`); // More descriptive name
                toast({ title: 'Conversion Successful', description: `Multi-page PDF downloaded as a ZIP file containing ${pageCount} JPEGs.` });
                resetState();
            }

        } catch (error) {
            toast({
                title: 'Conversion Failed',
                description: error.message || 'Could not process the PDF file. It might be corrupted or password-protected.',
                variant: 'destructive',
            });
            resetState();
        } finally {
            setIsConverting(false);
        }
      }, [toast]);
      
      const resetState = () => {
        setFile(null);
        setImages([]);
        setIsConverting(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      };

      const renderContent = () => {
        if (isConverting) {
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center p-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg">Converting your PDF, please wait...</p>
              <p className="text-sm text-muted-foreground">{file?.name}</p>
            </motion.div>
          )
        }

        return (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Drag & drop a PDF here, or click to select</p>
            <p className="text-sm text-muted-foreground">Max file size: 50MB. Password-protected PDFs are not supported.</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
          </div>
        )
      }

      return (
        <>
          <Helmet>
            <title>PDF to JPEG Converter - Ashwheel Tools</title>
            <meta name="description" content="Convert your PDF files to high-quality JPEG images for free. Easy, fast, and secure. Single-page PDFs download as JPEG, multi-page PDFs as a ZIP file. Optimize PDFs for web and social media." />
            <meta name="keywords" content="pdf to jpeg, pdf to jpg, convert pdf to image, extract images from pdf, pdf to image converter, pdf to jpg converter, extract pdf pages, PDF for social media" />
          </Helmet>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
            <header className="flex items-center justify-between mb-8">
                <Button variant="ghost" asChild>
                    <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tools
                    </Link>
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold text-primary">PDF to JPEG Converter</h1>
            </header>

            <main className="flex-1 flex flex-col items-center">
                <Card className="w-full max-w-5xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileImage className="text-primary"/>
                            <span>Upload Your PDF</span>
                        </CardTitle>
                        <CardDescription>Convert single-page PDFs to JPEG or multi-page PDFs to a ZIP file instantly. This tool helps you transform your PDF documents into shareable image formats. Max file size: 50MB. Password-protected PDFs are not supported.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AnimatePresence mode="wait">
                        {renderContent()}
                      </AnimatePresence>
                    </CardContent>
                </Card>
                <Card className="w-full max-w-5xl mt-8">
                    <CardHeader>
                        <CardTitle>How to Use the PDF to JPEG Converter</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                        <p>Transform your PDF pages into high-quality JPEG images with our simple and efficient tool. Here’s how:</p>
                        <ol>
                            <li><strong>Upload Your PDF:</strong> Drag and drop your PDF file into the upload area, or click to select it from your device. The tool supports files up to 50MB.</li>
                            <li><strong>Automatic Conversion:</strong> The conversion process starts automatically. Our tool renders each page of your PDF at a high resolution to ensure the best image quality.</li>
                            <li><strong>Download Your Images:</strong>
                                <ul>
                                    <li>If your PDF has only one page, it will be downloaded as a single JPEG file.</li>
                                    <li>If your PDF has multiple pages, a ZIP file containing all the pages as individual JPEGs will be downloaded.</li>
                                </ul>
                            </li>
                        </ol>
                        <h3>Frequently Asked Questions (FAQs)</h3>
                        <dl>
                            <dt>Is this service free?</dt>
                            <dd>Yes, converting your PDFs to JPEGs is completely free and unlimited.</dd>
                            <dt>Are my files secure?</dt>
                            <dd>Your privacy is guaranteed. All file processing is done in your browser, and your files are never uploaded to any server.</dd>
                            <dt>What is the maximum file size?</dt>
                            <dd>You can upload PDF files up to 50MB.</dd>
                        </dl>
                    </CardContent>
                </Card>
            </main>
          </div>
        </>
      );
    };

    export default PdfToJpegPage;
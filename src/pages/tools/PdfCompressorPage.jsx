import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, ArrowLeft, RefreshCw, Minimize2, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const PdfCompressorPage = () => {
  const [file, setFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressionLevel, setCompressionLevel] = useLocalStorage('pdf-compress-level', 70);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        if (selectedFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File', description: 'Please select a PDF file.', variant: 'destructive' });
            return;
        }
        if (selectedFile.size > MAX_FILE_SIZE) {
            toast({ title: 'File Too Large', description: 'Please select a file smaller than 50MB for compression.', variant: 'destructive' });
            return;
        }
        setFile(selectedFile);
        setOriginalSize(selectedFile.size);
    } else {
      toast({ title: 'Invalid File', description: 'Please select a PDF file.', variant: 'destructive' });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
        if (droppedFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File', description: 'Please drag and drop a PDF file.', variant: 'destructive' });
            return;
        }
        if (droppedFile.size > MAX_FILE_SIZE) {
            toast({ title: 'File Too Large', description: 'Please select a file smaller than 50MB for compression.', variant: 'destructive' });
            return;
        }
        setFile(droppedFile);
        setOriginalSize(droppedFile.size);
        fileInputRef.current.files = e.dataTransfer.files;
    } else {
      toast({ title: 'Invalid File', description: 'Please drag and drop a PDF file.', variant: 'destructive' });
    }
  };

  const estimatedSize = useMemo(() => {
    if (!originalSize) return 0;
    // This is a rough estimation. Actual compression depends on content.
    // Assuming average 70% compression at 70% quality, and linear scaling.
    const reductionFactor = (100 - compressionLevel) / 100 * 0.7 + (compressionLevel / 100 * 0.3); // Mix of fixed reduction and quality scaling
    const estimated = originalSize * reductionFactor * 0.8; // Further reduction estimate
    return estimated / 1024;
  }, [originalSize, compressionLevel]);

  const compressPDF = async () => {
    if (!file) {
      toast({ title: 'No File', description: 'Please upload a PDF file first.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const scale = compressionLevel / 100; // Affects resolution for image-heavy PDFs
      const quality = Math.max(0.1, compressionLevel / 100); // Affects JPEG quality

      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (originalPdf.isEncrypted) {
        toast({
          title: "Encrypted PDF",
          description: "This PDF is password-protected and cannot be compressed.",
          variant: "destructive",
        });
        setIsLoading(false);
        resetState();
        return;
      }

      const compressedPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= originalPdf.numPages; i++) {
        const page = await originalPdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 }); // Start with base scale
        
        // If the page contains images, render to canvas and re-embed with lower quality/resolution
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width * scale;
        canvas.height = viewport.height * scale;
        
        const renderContext = {
          canvasContext: context,
          viewport: page.getViewport({ scale: scale }),
        };
        
        await page.render(renderContext).promise;

        const imgData = canvas.toDataURL('image/jpeg', quality); // Compress to JPEG
        const embeddedImg = await compressedPdfDoc.embedJpg(imgData);
        
        const newPage = compressedPdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
        newPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: embeddedImg.width,
          height: embeddedImg.height,
        });
      }

      const pdfBytes = await compressedPdfDoc.save();
      const finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const finalSizeKB = (finalBlob.size / 1024).toFixed(1);
      const originalFileName = file.name.replace(/\.pdf$/i, '');

      saveAs(finalBlob, `${originalFileName}-compressed-ashwheel.pdf`); // More descriptive name

      toast({
        title: 'Compression Successful!',
        description: `Final PDF Size: ${finalSizeKB} KB.`,
      });
      resetState();
    } catch (error) {
      console.error("Compression error:", error);
      toast({
        title: 'Compression Failed',
        description: error.message || 'An unexpected error occurred during compression. Please ensure your PDF is not corrupted or password-protected.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setOriginalSize(0);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  return (
    <>
      <Helmet>
        <title>PDF Compressor - Ashwheel Tools</title>
        <meta name="description" content="Reduce the size of your PDF files online for free while maintaining quality. Easy, fast, and secure. Optimize your PDFs for email and web sharing." />
        <meta name="keywords" content="compress pdf, pdf compressor, reduce pdf size, optimize pdf, shrink pdf file, email pdf, web optimized pdf, PDF file size reducer" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
            <Button variant="ghost" asChild>
                <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tools
                </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">PDF Compressor</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Reduce PDF File Size</CardTitle>
                    <CardDescription>Upload your PDF and adjust the compression level to reduce its size. Ideal for optimizing large PDF files for faster sharing and smaller storage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        {!file ? (
                            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                            </motion.div>
                        ) : (
                            <motion.div key="compress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold truncate">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">Original size: {(originalSize / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={resetState}>
                                        <RefreshCw className="mr-2 h-4 w-4"/>
                                        Change File
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="compression" className="flex justify-between">
                                        <span>Compression Level</span>
                                        <span className="font-bold text-primary">{compressionLevel}%</span>
                                    </Label>
                                    <Slider
                                        id="compression"
                                        min={10}
                                        max={100}
                                        step={1}
                                        value={[compressionLevel]}
                                        onValueChange={(val) => setCompressionLevel(val[0])}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Smaller File (Lower Quality)</span>
                                        <span className="font-semibold">Est. Size: ~{estimatedSize.toFixed(1)} KB</span>
                                        <span>Larger File (Higher Quality)</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                      Higher compression levels may reduce image quality within the PDF.
                                    </p>
                                </div>

                                <Button onClick={compressPDF} disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Compressing...
                                        </>
                                    ) : (
                                        <>
                                            <Minimize2 className="mr-2 h-4 w-4" />
                                            Compress & Download PDF
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
            <Card className="w-full max-w-2xl mt-8">
                <CardHeader>
                    <CardTitle>How to Use the PDF Compressor</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Reduce the file size of your PDFs in three simple steps, making them easier to share and store.</p>
                    <ol>
                        <li><strong>Upload Your PDF:</strong> Drag and drop your PDF file into the upload area, or click to select it from your device. The tool supports PDFs up to 50MB.</li>
                        <li><strong>Adjust Compression Level:</strong> Use the slider to choose your desired compression level. A lower percentage results in a smaller file size but may reduce image quality. A higher percentage maintains better quality with less size reduction.</li>
                        <li><strong>Compress & Download:</strong> Click the "Compress & Download" button. The tool will process your file and automatically start the download of your optimized PDF.</li>
                    </ol>
                    <h3>Frequently Asked Questions (FAQs)</h3>
                    <dl>
                        <dt>Is this tool free?</dt>
                        <dd>Yes, our PDF Compressor is completely free to use without any limits.</dd>
                        <dt>Are my files secure?</dt>
                        <dd>Your privacy is our priority. All processing is done directly in your browser, meaning your files are never uploaded to our servers.</dd>
                        <dt>Does this work on password-protected PDFs?</dt>
                        <dd>No, for security reasons, encrypted or password-protected PDFs cannot be processed by this tool.</dd>
                    </dl>
                </CardContent>
            </Card>
        </main>
      </div>
    </>
  );
};

export default PdfCompressorPage;
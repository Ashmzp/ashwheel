
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, ArrowLeft, RefreshCw, FileText, Download } from 'lucide-react';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const WordToPdfPage = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFile(selectedFile);
    } else {
      toast({ title: 'Invalid File', description: 'Please select a .docx file.', variant: 'destructive' });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFile(droppedFile);
    } else {
      toast({ title: 'Invalid File', description: 'Please drag and drop a .docx file.', variant: 'destructive' });
    }
  };

  const convertToPdf = async () => {
    if (!file) {
      toast({ title: 'No File Selected', description: 'Please upload a .docx file first.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

      const renderContainer = document.createElement('div');
      renderContainer.style.position = 'absolute';
      renderContainer.style.left = '-9999px';
      renderContainer.style.width = '210mm';
      renderContainer.style.padding = '15mm';
      renderContainer.style.backgroundColor = 'white';
      renderContainer.innerHTML = `<style>
        body { font-family: 'Times New Roman', serif; }
        p, li { line-height: 1.5; margin-bottom: 12px; }
        h1, h2, h3, h4, h5, h6 { margin-bottom: 15px; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
        td, th { border: 1px solid #dddddd; text-align: left; padding: 8px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
        blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; font-style: italic; }
      </style>${html}`;
      document.body.appendChild(renderContainer);

      const canvas = await html2canvas(renderContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      document.body.removeChild(renderContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const originalFileName = file.name.replace(/\.docx$/i, '');
      pdf.save(`${originalFileName}.pdf`);

      toast({
        title: 'Conversion Successful!',
        description: 'Your PDF has been downloaded.',
      });
      resetState();

    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: 'Conversion Failed',
        description: 'Could not convert the file. Please try another one.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  return (
    <>
      <Helmet>
        <title>Word to PDF Converter - Ashwheel Tools</title>
        <meta name="description" content="Convert your Word documents (.docx) to high-quality PDF files for free. Fast, secure, and client-side conversion. Easily transform your documents for sharing and printing." />
        <meta name="keywords" content="word to pdf, docx to pdf, convert word to pdf, free word to pdf converter, convert documents, online word converter, doc to pdf" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
            <Button variant="ghost" asChild>
                <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tools
                </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Word to PDF Converter</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Convert DOCX to PDF</CardTitle>
                    <CardDescription>Upload your Word documents (.docx) to instantly convert them into PDF files. This tool helps you securely and accurately format your documents.</CardDescription>
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
                                    <p className="text-lg text-muted-foreground">Drag & drop a .docx file, or click to select</p>
                                    <input
                                        type="file"
                                        id="word-to-pdf-upload"
                                        name="word-to-pdf-upload"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        className="hidden"
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="convert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <p className="font-semibold truncate">{file.name}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={resetState}>
                                        <RefreshCw className="mr-2 h-4 w-4"/>
                                        Change File
                                    </Button>
                                </div>

                                <Button onClick={convertToPdf} disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            Convert & Download PDF
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
                    <CardTitle>How to Use the Word to PDF Converter</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Easily convert your Microsoft Word documents to high-quality, professional PDFs with our free online tool. Follow these simple steps:</p>
                    <ol>
                        <li><strong>Upload Your File:</strong> Drag and drop your .docx file into the upload area, or click to select it from your device.</li>
                        <li><strong>Automatic Conversion:</strong> The tool will instantly begin processing your file. Our advanced conversion engine ensures that your original formatting, including fonts, images, and layouts, is preserved.</li>
                        <li><strong>Download Your PDF:</strong> Once the conversion is complete, your new PDF file will be automatically downloaded to your device, ready for sharing, printing, or archiving.</li>
                    </ol>
                    <h3>Frequently Asked Questions (FAQs)</h3>
                    <dl>
                        <dt>Is this tool free to use?</dt>
                        <dd>Yes, our Word to PDF converter is completely free and requires no registration or software installation.</dd>
                        <dt>Are my files secure?</dt>
                        <dd>Absolutely. All processing happens in your browser, and your files are never uploaded to our servers. They remain private and secure on your computer.</dd>
                        <dt>What file formats are supported?</dt>
                        <dd>This tool is specifically designed to convert modern Word documents with the .docx extension.</dd>
                    </dl>
                </CardContent>
            </Card>
        </main>
      </div>
    </>
  );
};

export default WordToPdfPage;

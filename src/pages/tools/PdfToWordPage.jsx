import React, { useState, useRef } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, ArrowLeft, RefreshCw, FileText, Download } from 'lucide-react';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PdfToWordPage = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({ title: 'Invalid File', description: 'Please select a .pdf file.', variant: 'destructive' });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast({ title: 'Invalid File', description: 'Please drag and drop a .pdf file.', variant: 'destructive' });
    }
  };

  const convertToDocx = async () => {
    if (!file) {
      toast({ title: 'No File Selected', description: 'Please upload a .pdf file first.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      if (!fullText.trim()) {
        toast({
          title: 'No Text Found',
          description: 'This PDF appears to be image-based. Text could not be extracted.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // This is a very basic conversion. For a real-world scenario, a more complex library
      // would be needed to preserve formatting. Here we just put the text into a docx.
      const { Document, Packer, Paragraph } = await import('docx');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: fullText.split('\n').map(text => new Paragraph({ text })),
        }],
      });

      const blob = await Packer.toBlob(doc);
      const originalFileName = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${originalFileName}.docx`);

      toast({
        title: 'Conversion Successful!',
        description: 'Your DOCX file has been downloaded.',
      });
      resetState();

    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: 'Conversion Failed',
        description: 'Could not convert the file. It might be corrupted or password-protected.',
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
  
  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I convert PDF to Word?", "acceptedAnswer": { "@type": "Answer", "text": "Upload your PDF file, click Convert & Download DOCX, and your editable Word document will be ready instantly." } },
      { "@type": "Question", "name": "Is the conversion accurate?", "acceptedAnswer": { "@type": "Answer", "text": "The tool extracts text accurately from text-based PDFs. Complex layouts with images may require manual adjustment." } },
      { "@type": "Question", "name": "Is my data secure?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, all conversion happens in your browser. Your files are never uploaded to any server." } }
    ]
  };

  return (
    <>
      <SEO path="/tools/pdf-to-word" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
            <Button variant="ghost" asChild>
                <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tools
                </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">PDF to Word Converter</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Convert PDF to DOCX</CardTitle>
                    <CardDescription>Upload your PDF to convert it into an editable Word document. Note: This tool extracts text and may not perfectly preserve complex layouts.</CardDescription>
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
                                    <p className="text-lg text-muted-foreground">Drag & drop a .pdf file, or click to select</p>
                                    <input
                                        type="file"
                                        id="pdf-to-word-upload"
                                        name="pdf-to-word-upload"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,application/pdf"
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

                                <Button onClick={convertToDocx} disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            Convert & Download DOCX
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
                    <CardTitle>How to Use the PDF to Word Converter</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Convert your PDFs into editable Word documents in a few simple steps.</p>
                    <ol>
                        <li><strong>Upload PDF:</strong> Drag and drop your PDF file or click to select it.</li>
                        <li><strong>Convert:</strong> Click the "Convert & Download DOCX" button.</li>
                        <li><strong>Download:</strong> Your file will be converted and automatically downloaded as a .docx file.</li>
                    </ol>
                    <p><strong>Note:</strong> This tool is best for text-based PDFs. Complex layouts with many images may not convert perfectly.</p>
                </CardContent>
            </Card>
        </main>
      </div>
    </>
  );
};

export default PdfToWordPage;
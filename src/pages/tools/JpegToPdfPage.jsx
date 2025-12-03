import React, { useState, useRef } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Download, Loader2, ArrowLeft, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

const JpegToPdfPage = () => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "Is JPEG to PDF conversion free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, completely free with unlimited conversions."}},
      {"@type": "Question", "name": "Can I combine multiple images?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, you can combine multiple JPEG/PNG images into one PDF."}},
      {"@type": "Question", "name": "Are my files secure?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, all processing happens in your browser."}}
    ]
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const imageFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File Type', description: `${file.name} is not an image and will be skipped.`, variant: 'destructive' });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'File Too Large', description: `${file.name} is larger than 10MB and will be skipped.`, variant: 'destructive' });
        return false;
      }
      return true;
    });

    if (imageFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...imageFiles]);
    } else if (selectedFiles.length > 0) {
      toast({
        title: 'No Valid Images Selected',
        description: 'Please select valid image files (JPEG, PNG) under 10MB each.',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File Type', description: `${file.name} is not an image and will be skipped.`, variant: 'destructive' });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'File Too Large', description: `${file.name} is larger than 10MB and will be skipped.`, variant: 'destructive' });
        return false;
      }
      return true;
    });

    if (imageFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...imageFiles]);
    } else if (droppedFiles.length > 0) {
      toast({
        title: 'No Valid Images Dropped',
        description: 'Please drag and drop valid image files (JPEG, PNG) under 10MB each.',
        variant: 'destructive',
      });
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const createPdf = async () => {
    if (files.length === 0) {
      toast({ title: 'No Images Selected', description: 'Please upload at least one image to convert.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const file of files) {
        const imageBytes = await file.arrayBuffer();
        let image;
        if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (file.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
            toast({title: "Unsupported Image Type", description: `Skipping ${file.name}. Only JPEG and PNG are fully supported.`, variant: "destructive"});
            continue;
        }
        
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      if (pdfDoc.getPageCount() === 0) {
        throw new Error("No valid images were processed into the PDF.");
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ashwheel-converted-images.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'PDF Created Successfully',
        description: 'Your images have been converted to a PDF and downloaded.',
      });
      resetState();

    } catch (error) {
      console.error("PDF Creation Error:", error);
      toast({
        title: 'Error Creating PDF',
        description: error.message || 'Could not convert images to PDF. Please ensure images are valid and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFiles([]);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <SEO path="/jpeg-to-pdf" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Image to PDF Converter</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Upload Your Images</CardTitle>
              <CardDescription>Drag & drop your JPEG/PNG files or click to select them. Max file size per image: 10MB.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors mb-6"
              >
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Drag & drop images here, or click to select</p>
                <input
                  type="file"
                  id="image-to-pdf-upload"
                  name="image-to-pdf-upload"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                />
              </div>

              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h3 className="text-lg font-semibold mb-4">Selected Images ({files.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                      {files.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${index}`}
                          className="relative group border rounded-lg overflow-hidden"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <img src={URL.createObjectURL(file)} alt={`Preview ${file.name}`} className="w-full h-24 object-cover" />
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                            {file.name}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                      <Button onClick={resetState} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> Clear All
                      </Button>
                      <Button onClick={createPdf} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Convert to PDF
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          <Card className="w-full max-w-4xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the Image to PDF Converter</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Combine multiple JPEG or PNG images into a single, convenient PDF document.</p>
                <ol>
                    <li><strong>Upload Your Images:</strong> Drag and drop your image files into the upload area, or click to select them from your device. You can add multiple files at once.</li>
                    <li><strong>Arrange Images (Optional):</strong> The images will be added to the PDF in the order they are displayed. You can remove any unwanted images by clicking the 'X' icon.</li>
                    <li><strong>Convert to PDF:</strong> Click the "Convert to PDF" button. The tool will process all your images and merge them into one PDF file.</li>
                    <li><strong>Download:</strong> Your new PDF file will be automatically downloaded to your device.</li>
                </ol>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default JpegToPdfPage;
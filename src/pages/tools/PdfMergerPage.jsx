import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Upload, FilePlus, Loader2, Merge, Trash2, GripVertical } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const ItemType = 'PAGE';

const PageThumbnail = ({ id, pdfName, pageNum, dataUrl, index, movePage, removePage }) => {
  const ref = useRef(null);
  
  const [, drop] = useDrop({
    accept: ItemType,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      movePage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType,
    item: () => ({ id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  
  const opacity = isDragging ? 0.4 : 1;

  preview(drop(ref));

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      layout
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      className="relative group p-1 border rounded-lg bg-background shadow-sm"
    >
      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => removePage(index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-full aspect-[210/297] bg-white rounded-md overflow-hidden flex items-center justify-center">
          <img src={dataUrl} alt={`Page ${pageNum} of ${pdfName}`} className="w-full h-full object-contain" />
        </div>
        <div className="text-xs text-center mt-1 text-muted-foreground truncate w-full">{pdfName} (p.{pageNum})</div>
      </div>
      <div ref={drag} className="absolute left-0 top-0 bottom-0 w-8 cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
    </motion.div>
  );
};

const PdfMergerPage = () => {
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const processFiles = useCallback(async (files) => {
    setIsProcessing(true);
    let newPages = [];
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Invalid File', description: `${file.name} is not a valid PDF.`, variant: 'destructive' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'File Too Large', description: `${file.name} is over 100MB and cannot be processed.`, variant: 'destructive' });
        continue;
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        if (pdfDoc.isEncrypted) {
            toast({ title: 'Encrypted PDF', description: `${file.name} is password-protected and cannot be processed.`, variant: 'destructive' });
            continue;
        }

        const pdfjsDoc = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        
        for (let i = 0; i < pdfjsDoc.numPages; i++) {
            const page = await pdfjsDoc.getPage(i + 1);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const dataUrl = canvas.toDataURL();
            newPages.push({ id: `${file.name}-${i}-${Date.now()}`, pdfName: file.name, pageNum: i + 1, dataUrl, originalFile: file, originalPageIndex: i });
        }
      } catch (e) {
        console.error(e);
        toast({ title: 'Processing Error', description: `Could not process ${file.name}. It may be corrupted or in an unsupported format.`, variant: 'destructive' });
      }
    }
    setPages(p => [...p, ...newPages]);
    setIsProcessing(false);
  }, [toast]);

  const onDrop = useCallback(acceptedFiles => {
      processFiles(acceptedFiles);
  }, [processFiles]);
  
  const handleFileInput = (event) => {
    const files = event.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };
  
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'application/pdf': ['.pdf']},
    noClick: true, 
    noKeyboard: true 
  });

  const removePage = useCallback((index) => {
    setPages(p => p.filter((_, i) => i !== index));
  }, []);

  const movePage = useCallback((dragIndex, hoverIndex) => {
    setPages((prevPages) => {
      const newPages = [...prevPages];
      const [draggedPage] = newPages.splice(dragIndex, 1);
      newPages.splice(hoverIndex, 0, draggedPage);
      return newPages;
    });
  }, []);

  const mergePDFs = useCallback(async () => {
    if (pages.length === 0) {
      toast({ title: 'No Pages', description: 'Please add some PDF files.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      const fileCache = new Map();

      for (const page of pages) {
        let pdfDoc;
        if (fileCache.has(page.originalFile.name)) {
            pdfDoc = fileCache.get(page.originalFile.name);
        } else {
            const arrayBuffer = await page.originalFile.arrayBuffer();
            pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            fileCache.set(page.originalFile.name, pdfDoc);
        }
        
        const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [page.originalPageIndex]);
        mergedPdf.addPage(copiedPage);
      }
      const mergedBytes = await mergedPdf.save();
      saveAs(new Blob([mergedBytes], { type: 'application/pdf' }), 'ashwheel-merged.pdf');
      toast({ title: 'Merge Successful', description: 'Your PDF has been created.' });
      setPages([]);
    } catch (e) {
      toast({ title: 'Merge Failed', description: 'An error occurred during merging.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [pages, toast]);
  
  const renderContent = () => {
    if (pages.length > 0) {
      return (
        <DndProvider backend={HTML5Backend}>
          <div {...getRootProps()} className={`p-4 border rounded-lg bg-secondary/20 min-h-[200px] relative ${isDragActive ? 'border-primary ring-2 ring-primary' : ''}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[55vh] overflow-y-auto">
                  {pages.map((page, i) => (
                  <PageThumbnail key={page.id} index={i} id={page.id} {...page} movePage={movePage} removePage={removePage} />
                  ))}
              </div>
               {isDragActive && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-lg pointer-events-none z-20">
                      <p className="text-primary font-bold text-lg">Drop files to add</p>
                  </div>
              )}
          </div>
        </DndProvider>
      );
    }

    return (
      <div {...getRootProps({onClick: openFilePicker})} className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}>
        <input {...getInputProps()} style={{ display: 'none' }} />
        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">Drag & drop PDF files here, or click to select</p>
        <p className="text-sm text-muted-foreground">Files are processed in your browser. No uploads!</p>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>PDF Merger - Combine, Rearrange, and Edit Pages</title>
        <meta name="description" content="Merge multiple PDFs into one file. Rearrange, add, or delete pages with our free and secure online PDF merger. No uploads required." />
        <meta name="keywords" content="merge pdf, combine pdf, rearrange pdf pages, delete pdf pages, pdf joiner" />
      </Helmet>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <main className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Merge className="text-primary"/> PDF Merger & Page Organizer
              </CardTitle>
              <CardDescription>Combine PDFs, rearrange pages by dragging, and delete unwanted ones before merging. Max file size: 100MB.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    accept="application/pdf"
                    multiple
                    style={{ display: 'none' }}
                />
                {isProcessing && pages.length === 0 && <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
                {! (isProcessing && pages.length === 0) && renderContent()}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                  <Button onClick={openFilePicker} variant="outline" disabled={isProcessing}>
                    <FilePlus className="mr-2 h-4 w-4" /> Add More PDFs
                  </Button>
                  <Button onClick={mergePDFs} disabled={isProcessing || pages.length === 0} className="w-full sm:w-auto">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Merge className="mr-2 h-4 w-4" />}
                    Merge & Download PDF
                  </Button>
                </div>
            </CardContent>
          </Card>
          <Card className="w-full max-w-7xl mt-8 mx-auto">
            <CardHeader><CardTitle>How to Use</CardTitle></CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ol>
                <li><strong>Upload PDFs:</strong> Click 'Add More PDFs' or drag & drop files. All pages will appear as thumbnails.</li>
                <li><strong>Rearrange Pages:</strong> Use the grip handle on the left of a page to click and drag it to a new position.</li>
                <li><strong>Delete Pages:</strong> Hover over any page and click the red trash icon to remove it.</li>
                <li><strong>Add New PDFs:</strong> Click 'Add More PDFs' again to add pages from other documents at any time.</li>
                <li><strong>Merge & Download:</strong> When ready, click 'Merge & Download' to save your new, single PDF.</li>
              </ol>
              <p><strong>Security Note:</strong> All processing happens directly in your browser. Your files are never uploaded to our servers, ensuring your data remains private.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default PdfMergerPage;
import React, { useState, useRef, useEffect, useCallback } from 'react';
    import SEO from '@/components/SEO';
    import ToolProCTA from '@/components/ToolProCTA';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Upload, Loader2, RefreshCw, Type, Image as ImageIcon, MousePointer, Trash2, Download, Square, Pen, Undo, Redo, Layers, FilePlus, ArrowLeft, Info } from 'lucide-react';
    import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
    import { saveAs } from 'file-saver';
    import { useDropzone } from 'react-dropzone';
    import { v4 as uuidv4 } from 'uuid';
    import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Rect as KonvaRect, Line as KonvaLine } from 'react-konva';
    import useImage from 'use-image';
    import { create } from 'zustand';
    import { produce } from 'immer';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
    import { sanitizeFilename, escapeHTML } from '@/utils/sanitize';
    import { getCSRFToken } from '@/utils/csrf';
    
    const usePdfStore = create((set, get) => ({
      history: [[]],
      historyStep: 0,
      objects: [],
      setObjects: (updater) => set(produce(state => {
        const newObjects = typeof updater === 'function' ? updater(state.objects) : updater;
        if (state.historyStep < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyStep + 1);
        }
        state.history.push(newObjects);
        state.historyStep += 1;
        state.objects = newObjects;
      })),
      updateObject: (id, newAttrs) => set(produce(state => {
        const index = state.objects.findIndex(o => o.id === id);
        if (index !== -1) {
          state.objects[index] = { ...state.objects[index], ...newAttrs };
        }
      })),
      undo: () => set(state => {
        if (state.historyStep > 0) {
          const newStep = state.historyStep - 1;
          return { historyStep: newStep, objects: state.history[newStep] };
        }
        return {};
      }),
      redo: () => set(state => {
        if (state.historyStep < state.history.length - 1) {
          const newStep = state.historyStep + 1;
          return { historyStep: newStep, objects: state.history[newStep] };
        }
        return {};
      }),
      reset: () => set({ objects: [], history: [[]], historyStep: 0 }),
    }));
    
    const URLImage = ({ image, onSelect, shapeProps, isSelected, onChange }) => {
      const [img] = useImage(image.src, 'anonymous');
      const shapeRef = useRef();
      const trRef = useRef();
    
      useEffect(() => {
        if (isSelected) {
          trRef.current.nodes([shapeRef.current]);
          trRef.current.getLayer().batchDraw();
        }
      }, [isSelected]);
    
      return (
        <>
          <KonvaImage
            image={img}
            onClick={onSelect}
            onTap={onSelect}
            ref={shapeRef}
            {...shapeProps}
            draggable
            onDragEnd={(e) => onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() })}
            onTransformEnd={() => {
              const node = shapeRef.current;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);
              onChange({ ...shapeProps, x: node.x(), y: node.y(), width: Math.max(5, node.width() * scaleX), height: Math.max(5, node.height() * scaleY) });
            }}
          />
          {isSelected && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />}
        </>
      );
    };
    
    const EditableText = ({ shapeProps, isSelected, onSelect, onChange, onDblClick }) => {
      const shapeRef = useRef();
      const trRef = useRef();
    
      useEffect(() => {
        if (isSelected) {
          trRef.current.nodes([shapeRef.current]);
          trRef.current.getLayer().batchDraw();
        }
      }, [isSelected]);
    
      return (
        <>
          <KonvaText
            onClick={onSelect}
            onTap={onSelect}
            onDblClick={onDblClick}
            onDblTap={onDblClick}
            ref={shapeRef}
            {...shapeProps}
            draggable
            onDragEnd={(e) => onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() })}
            onTransformEnd={() => {
              const node = shapeRef.current;
              const scaleX = node.scaleX();
              node.scaleX(1);
              node.scaleY(1);
              onChange({ ...shapeProps, x: node.x(), y: node.y(), width: Math.max(5, node.width() * scaleX) });
            }}
          />
          {isSelected && <Transformer ref={trRef} enabledAnchors={['middle-left', 'middle-right']} boundBoxFunc={(oldBox, newBox) => { newBox.height = oldBox.height; return newBox; }} />}
        </>
      );
    };
    
    const PropertiesPanel = ({ selectedObject, onUpdate, onDelete }) => {
      if (!selectedObject) return null;
    
      const commonProps = (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>X</Label><Input type="number" value={Math.round(selectedObject.x)} onChange={e => onUpdate({ x: parseInt(e.target.value) })} /></div>
            <div><Label>Y</Label><Input type="number" value={Math.round(selectedObject.y)} onChange={e => onUpdate({ y: parseInt(e.target.value) })} /></div>
            <div><Label>Width</Label><Input type="number" value={Math.round(selectedObject.width)} onChange={e => onUpdate({ width: parseInt(e.target.value) })} /></div>
            {selectedObject.type === 'image' && <div><Label>Height</Label><Input type="number" value={Math.round(selectedObject.height)} onChange={e => onUpdate({ height: parseInt(e.target.value) })} /></div>}
          </div>
        </>
      );
    
      return (
        <aside className="w-64 bg-secondary/30 border-l border-border p-4 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg capitalize">{selectedObject.type} Properties</h3>
            <Button variant="destructive" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {selectedObject.type === 'text' && (
            <>
              <div><Label>Text</Label><Textarea value={selectedObject.text} onChange={e => onUpdate({ text: e.target.value })} /></div>
              <div><Label>Font Size</Label><Input type="number" value={selectedObject.fontSize} onChange={e => onUpdate({ fontSize: parseInt(e.target.value) })} /></div>
              <div><Label>Color</Label><Input type="color" value={selectedObject.fill} onChange={e => onUpdate({ fill: e.target.value })} /></div>
              {commonProps}
            </>
          )}
          {selectedObject.type === 'image' && commonProps}
          {selectedObject.type === 'rect' && (
            <>
              <div><Label>Fill Color</Label><Input type="color" value={selectedObject.fill} onChange={e => onUpdate({ fill: e.target.value })} /></div>
              <div><Label>Stroke Color</Label><Input type="color" value={selectedObject.stroke} onChange={e => onUpdate({ stroke: e.target.value })} /></div>
              <div><Label>Stroke Width</Label><Input type="number" value={selectedObject.strokeWidth} onChange={e => onUpdate({ strokeWidth: parseInt(e.target.value) })} /></div>
              {commonProps}
            </>
          )}
        </aside>
      );
    };
    
    const PdfEditorPage = () => {
      const navigate = useNavigate();
      const [file, setFile] = useState(null);
      const [pdfDoc, setPdfDoc] = useState(null);
      const [pages, setPages] = useState([]);
      const [activePage, setActivePage] = useState(0);
      const [isProcessing, setIsProcessing] = useState(false);
      const [tool, setTool] = useState('select');
      const [selectedId, setSelectedId] = useState(null);
      const { toast } = useToast();
      const { objects, setObjects, updateObject, undo, redo, reset: resetStore, history, historyStep } = usePdfStore();
      const isDrawing = useRef(false);
      const stageRef = useRef(null);
    
      const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type === 'application/pdf') {
          handleFile(file);
        } else {
          toast({ title: 'Invalid File Type', description: 'Please select a valid PDF file.', variant: 'destructive' });
        }
      }, [toast]);
    
      const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true });
    
      const getPdfJsPage = async (pdfLibDoc, pageNum) => {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.js',
          import.meta.url,
        ).toString();
        const bytes = await pdfLibDoc.save();
        const loadingTask = pdfjs.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        return pdf.getPage(pageNum);
      };
    
      const handleFile = async (file) => {
        setFile(file);
        setIsProcessing(true);
        try {
          const arrayBuffer = await file.arrayBuffer();
          const doc = await PDFDocument.load(arrayBuffer);
          setPdfDoc(doc);
          
          const renderedPages = [];
          const extractedObjects = [];
          const scale = 1.5;
    
          for (let i = 0; i < doc.getPageCount(); i++) {
            const page = doc.getPage(i);
            
            const newPageCanvas = document.createElement('canvas');
            const context = newPageCanvas.getContext('2d');
            const pdfJsPage = await getPdfJsPage(doc, i + 1);
            const viewport = pdfJsPage.getViewport({ scale });
            newPageCanvas.height = viewport.height;
            newPageCanvas.width = viewport.width;
            const renderContext = { canvasContext: context, viewport: viewport };
            await pdfJsPage.render(renderContext).promise;
            renderedPages.push({ dataUrl: newPageCanvas.toDataURL(), width: newPageCanvas.width, height: newPageCanvas.height });
    
            const textContent = await pdfJsPage.getTextContent();
            textContent.items.forEach(item => {
              const tx = item.transform;
              const x = tx[4] * scale;
              const y = viewport.height - tx[5] * scale;
              const fontSize = Math.sqrt((tx[0] * tx[0]) + (tx[1] * tx[1])) * scale;
              
              extractedObjects.push({
                id: uuidv4(),
                type: 'text',
                page: i,
                x: x,
                y: y - fontSize,
                text: item.str,
                fontSize: fontSize,
                fill: 'rgba(0,0,0,0.01)', // Almost transparent
                fontFamily: item.fontName.includes('Bold') ? 'Helvetica-Bold' : 'Helvetica',
                width: item.width * scale,
                isOriginal: true,
              });
            });
          }
    
          setPages(renderedPages);
          setObjects(extractedObjects);
          setActivePage(0);
          usePdfStore.setState({ history: [extractedObjects], historyStep: 0 });
    
        } catch (e) {
          console.error(e);
          toast({ title: 'Error loading PDF', description: 'Could not load the PDF file. It might be corrupted or password-protected.', variant: 'destructive' });
        } finally {
          setIsProcessing(false);
        }
      };
    
      const addText = () => {
        const safeText = escapeHTML('Double click to edit');
        const newText = { id: uuidv4(), type: 'text', page: activePage, x: 50, y: 50, text: safeText, fontSize: 24, fill: 'black', fontFamily: 'Helvetica', width: 200 };
        setObjects(prev => [...prev, newText]);
        setSelectedId(newText.id);
      };
    
      const addImage = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target.result;
            img.onload = () => {
              const newImage = { id: uuidv4(), type: 'image', page: activePage, src: event.target.result, x: 50, y: 50, width: img.width > 200 ? 200 : img.width, height: img.width > 200 ? (img.height * 200 / img.width) : img.height };
              setObjects(prev => [...prev, newImage]);
              setSelectedId(newImage.id);
            }
          };
          reader.readAsDataURL(file);
        }
        e.target.value = null;
      };
      
      const addRect = () => {
        const newRect = { id: uuidv4(), type: 'rect', page: activePage, x: 50, y: 50, width: 100, height: 100, fill: 'rgba(0,0,255,0.5)', stroke: 'blue', strokeWidth: 2 };
        setObjects(prev => [...prev, newRect]);
        setSelectedId(newRect.id);
      };
    
      const handleMouseDown = (e) => {
        if (tool !== 'draw') return;
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        const newLine = { id: uuidv4(), type: 'line', page: activePage, points: [pos.x, pos.y], stroke: 'red', strokeWidth: 2, tension: 0.5, lineCap: 'round', lineJoin: 'round' };
        setObjects(prev => [...prev, newLine]);
      };
    
      const handleMouseMove = (e) => {
        if (!isDrawing.current || tool !== 'draw') return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        setObjects(prev => {
          let lastLine = prev[prev.length - 1];
          lastLine.points = lastLine.points.concat([point.x, point.y]);
          return [...prev.slice(0, -1), lastLine];
        });
      };
    
      const handleMouseUp = () => {
        isDrawing.current = false;
      };
    
      const addBlankPage = async () => {
        const newPageCanvas = document.createElement('canvas');
        const { width, height } = pages[0] || { width: 595, height: 842 }; // Default A4
        newPageCanvas.width = width;
        newPageCanvas.height = height;
        const ctx = newPageCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        const dataUrl = newPageCanvas.toDataURL();
        
        const newPageData = { dataUrl, width, height };
        setPages(p => [...p, newPageData]);
        
        pdfDoc.addPage([width, height]);
        setPdfDoc(pdfDoc);
        setActivePage(pages.length);
      };
    
      const deletePage = (index) => {
        if (pages.length <= 1) {
          toast({ title: "Cannot delete", description: "You cannot delete the last page.", variant: "destructive" });
          return;
        }
        pdfDoc.removePage(index);
        setPdfDoc(pdfDoc);
        setPages(p => p.filter((_, i) => i !== index));
        setObjects(o => o.filter(obj => obj.page !== index).map(obj => obj.page > index ? { ...obj, page: obj.page - 1 } : obj));
        if (activePage === index) {
          setActivePage(Math.max(0, index - 1));
        } else if (activePage > index) {
          setActivePage(activePage - 1);
        }
      };
    
      const reorderPages = (dragIndex, hoverIndex) => {
        const newPages = [...pages];
        const draggedPage = newPages[dragIndex];
        newPages.splice(dragIndex, 1);
        newPages.splice(hoverIndex, 0, draggedPage);
        setPages(newPages);
    
        pdfDoc.movePage(dragIndex, hoverIndex);
        setPdfDoc(pdfDoc);
    
        const newObjects = produce(objects, draft => {
          draft.forEach(obj => {
            if (obj.page === dragIndex) obj.page = -1; // Temp value
            else if (obj.page === hoverIndex) obj.page = dragIndex;
          });
          draft.forEach(obj => {
            if (obj.page === -1) obj.page = hoverIndex;
          });
        });
        setObjects(newObjects);
      };
    
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        } : null;
      };

      const downloadPdf = async () => {
        setIsProcessing(true);
        try {
          const newPdfDoc = await PDFDocument.load(await pdfDoc.save());
          const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
          const boldFont = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
    
          for (let i = 0; i < newPdfDoc.getPageCount(); i++) {
            const page = newPdfDoc.getPage(i);
            const pageObjects = objects.filter(obj => obj.page === i);
            
            const editedOriginals = pageObjects.filter(o => o.isOriginal && o.edited);
            for (const obj of editedOriginals) {
                const { width } = pages[i];
                const scale = page.getWidth() / width;
                page.drawRectangle({
                    x: obj.x * scale,
                    y: page.getHeight() - (obj.y + obj.fontSize) * scale,
                    width: obj.width * scale,
                    height: obj.fontSize * scale,
                    color: rgb(1, 1, 1),
                });
            }
    
            const drawableObjects = pageObjects.filter(o => !o.isOriginal || o.edited);
            for (const obj of drawableObjects) {
              const { width } = pages[i];
              const scale = page.getWidth() / width;
              
              if (obj.type === 'text') {
                const color = hexToRgb(obj.fill) || { r: 0, g: 0, b: 0 };
                page.drawText(obj.text, { 
                    x: obj.x * scale, 
                    y: page.getHeight() - (obj.y + obj.fontSize) * scale, 
                    font: obj.fontFamily === 'Helvetica-Bold' ? boldFont : font, 
                    size: obj.fontSize * scale, 
                    color: rgb(color.r, color.g, color.b) 
                });
              } else if (obj.type === 'image') {
                const imageBytes = await fetch(obj.src).then(res => res.arrayBuffer());
                const image = await (obj.src.includes('png') ? newPdfDoc.embedPng(imageBytes) : newPdfDoc.embedJpg(imageBytes));
                page.drawImage(image, { x: obj.x * scale, y: page.getHeight() - (obj.y + obj.height) * scale, width: obj.width * scale, height: obj.height * scale });
              } else if (obj.type === 'rect') {
                const strokeColor = hexToRgb(obj.stroke) || { r: 0, g: 0, b: 1 };
                const fillColorMatch = obj.fill.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
                let fillColor, fillOpacity;
                if (fillColorMatch) {
                    fillColor = rgb(parseInt(fillColorMatch[1])/255, parseInt(fillColorMatch[2])/255, parseInt(fillColorMatch[3])/255);
                    fillOpacity = parseFloat(fillColorMatch[4]);
                } else {
                    const hexFill = hexToRgb(obj.fill) || { r: 0, g: 0, b: 1 };
                    fillColor = rgb(hexFill.r, hexFill.g, hexFill.b);
                    fillOpacity = 1;
                }
                page.drawRectangle({ x: obj.x * scale, y: page.getHeight() - (obj.y + obj.height) * scale, width: obj.width * scale, height: obj.height * scale, borderColor: rgb(strokeColor.r, strokeColor.g, strokeColor.b), borderWidth: obj.strokeWidth, color: fillColor, opacity: fillOpacity });
              } else if (obj.type === 'line') {
                const strokeColor = hexToRgb(obj.stroke) || { r: 1, g: 0, b: 0 };
                const path = `M ${obj.points[0]*scale} ${page.getHeight() - obj.points[1]*scale} ` + obj.points.slice(2).map((p, idx) => idx % 2 === 0 ? `L ${p*scale}` : `${page.getHeight() - p*scale}`).join(' ');
                page.drawSvgPath(path, { borderColor: rgb(strokeColor.r, strokeColor.g, strokeColor.b), borderWidth: obj.strokeWidth * scale });
              }
            }
          }
    
          const pdfBytes = await newPdfDoc.save();
          const safeFilename = sanitizeFilename(file.name.replace('.pdf', ''));
          saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${safeFilename}-edited.pdf`);
          toast({ title: 'Download Started', description: 'Your edited PDF is being downloaded.' });
        } catch (e) {
          console.error(e);
          toast({ title: 'Error creating PDF', description: 'Could not save the PDF file.', variant: 'destructive' });
        } finally {
          setIsProcessing(false);
        }
      };
    
      const resetState = () => {
        setFile(null);
        setPdfDoc(null);
        setPages([]);
        setActivePage(0);
        resetStore();
      };
    
      const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) setSelectedId(null);
      };
    
      const PageThumbnail = ({ page, index, onClick, onDelete, onMove }) => {
        const ref = useRef(null);
        return (
          <div ref={ref} className={`relative border-2 p-1 cursor-pointer ${activePage === index ? 'border-primary' : 'border-transparent'}`}>
            <img src={page.dataUrl} alt={`Page ${index + 1}`} onClick={onClick} className="w-full h-auto" />
            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(index); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      };
      
      const CanvasImage = ({ dataUrl }) => {
        const [image] = useImage(dataUrl);
        return <KonvaImage image={image} />;
      };
    
      const selectedObject = objects?.find(o => o.id === selectedId);

      const handleDeleteSelected = () => {
        if (!selectedId) return;
        setObjects(objs => objs.filter(o => o.id !== selectedId));
        setSelectedId(null);
      };

      const howToUse = (
        <div className="prose dark:prose-invert">
          <h4>How to Use the PDF Editor</h4>
          <ol>
            <li><strong>Upload PDF:</strong> Drag and drop your PDF file onto the upload area, or click to select a file from your device.</li>
            <li><strong>Navigate Pages:</strong> Use the page thumbnails on the left sidebar to switch between different pages of your PDF.</li>
            <li><strong>Use Tools:</strong> Select a tool from the toolbar on the far left:
              <ul>
                <li><strong>Select (Mouse Pointer):</strong> Click to select, move, resize, or rotate objects on the page.</li>
                <li><strong>Text:</strong> Click "Add Text" or double-click existing text to edit. You can change font size and color in the properties panel on the right.</li>
                <li><strong>Image:</strong> Click "Add Image" to upload an image from your device.</li>
                <li><strong>Draw:</strong> Freehand draw on the page.</li>
                <li><strong>Rectangle:</strong> Add rectangular shapes.</li>
              </ul>
            </li>
            <li><strong>Edit Properties:</strong> When an object is selected, its properties (size, color, etc.) will appear in the right-hand panel for you to edit.</li>
            <li><strong>Manage Pages:</strong> Add a blank page using the "Add Page" button or delete a page using the trash icon on its thumbnail.</li>
            <li><strong>Undo/Redo:</strong> Use the undo and redo buttons in the header to reverse or re-apply actions.</li>
            <li><strong>Save & Download:</strong> Once you're finished, click "Save & Download" to get your edited PDF.</li>
          </ol>
        </div>
      );
    
      const faqSchema = {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Can I edit text in a PDF?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can add new text, edit existing text, change font size and color using our PDF editor." } },
          { "@type": "Question", "name": "Can I add images to my PDF?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, upload images from your device and place them anywhere on your PDF pages." } },
          { "@type": "Question", "name": "Does it work offline?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, all processing happens in your browser. Your files never leave your device." } }
        ]
      };

      return (
        <>
          <SEO path="/tools/pdf-editor" faqSchema={faqSchema} />
          <div className="flex flex-col h-screen bg-background text-foreground" {...getRootProps()}>
            <header className="flex-shrink-0 bg-secondary/50 border-b border-border">
              <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-xl font-bold text-primary">PDF Editor</h1>
                </div>
                <div className="flex items-center gap-2">
                  {file && (
                    <>
                      <Button onClick={undo} variant="ghost" size="icon" disabled={historyStep <= 0}><Undo className="h-5 w-5" /></Button>
                      <Button onClick={redo} variant="ghost" size="icon" disabled={historyStep >= history.length - 1}><Redo className="h-5 w-5" /></Button>
                      <Button onClick={downloadPdf} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Save & Download
                      </Button>
                      <Button onClick={resetState} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> New PDF</Button>
                    </>
                  )}
                </div>
              </div>
            </header>
    
            {!file ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <input {...getInputProps()} />
                <Card className="w-full max-w-2xl">
                  <CardHeader><CardTitle>Upload Your PDF to Start Editing</CardTitle></CardHeader>
                  <CardContent>
                    <div onClick={() => document.querySelector('input[type="file"]').click()} className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-lg text-muted-foreground">Drag & drop a PDF here, or click to select</p>
                      <p className="text-sm text-muted-foreground mt-2">Your files are processed locally and never leave your browser.</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="max-w-3xl mx-auto mt-8 w-full">
                  <ToolProCTA />
                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="how-to-use">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <Info className="h-5 w-5 mr-2" />
                          How to use this tool?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {howToUse}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                <aside className="w-16 md:w-20 bg-secondary/50 border-r border-border flex flex-col items-center py-4 space-y-2">
                  {[{ icon: MousePointer, name: 'select' }, { icon: Type, name: 'text' }, { icon: ImageIcon, name: 'image' }, { icon: Pen, name: 'draw' }, { icon: Square, name: 'rect' }].map(t => (
                    <Button key={t.name} variant={tool === t.name ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool(t.name)} className="h-12 w-12 flex-col text-xs">
                      <t.icon className="h-5 w-5 mb-1" />
                      {t.name}
                    </Button>
                  ))}
                  <div className="pt-4 border-t w-full flex flex-col items-center space-y-2">
                    <Button variant="ghost" size="icon" onClick={addText} className="h-12 w-12 flex-col text-xs"><Type className="h-5 w-5 mb-1" />Add Text</Button>
                    <Button variant="ghost" size="icon" onClick={() => document.getElementById('image-upload').click()} className="h-12 w-12 flex-col text-xs"><ImageIcon className="h-5 w-5 mb-1" />Add Image</Button>
                    <input type="file" id="image-upload" accept="image/png, image/jpeg" onChange={addImage} className="hidden" />
                    <Button variant="ghost" size="icon" onClick={addRect} className="h-12 w-12 flex-col text-xs"><Square className="h-5 w-5 mb-1" />Add Rect</Button>
                    <Button variant="ghost" size="icon" onClick={addBlankPage} className="h-12 w-12 flex-col text-xs"><FilePlus className="h-5 w-5 mb-1" />Add Page</Button>
                  </div>
                </aside>
    
                <aside className="w-48 bg-secondary/30 border-r border-border p-2 overflow-y-auto">
                  <h3 className="font-semibold text-center mb-2">Pages</h3>
                  <div className="space-y-2">
                    {pages.map((p, i) => <PageThumbnail key={i} index={i} page={p} onClick={() => setActivePage(i)} onDelete={deletePage} onMove={reorderPages} />)}
                  </div>
                </aside>
    
                <main className="flex-1 bg-muted/40 overflow-auto flex items-center justify-center p-4">
                  <AnimatePresence mode="wait">
                    <motion.div key={activePage} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="shadow-lg">
                      {pages[activePage] && (
                        <Stage
                          ref={stageRef}
                          width={pages[activePage].width}
                          height={pages[activePage].height}
                          onMouseDown={checkDeselect}
                          onTouchStart={checkDeselect}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseDown={handleMouseDown}
                        >
                          <Layer>
                            <CanvasImage dataUrl={pages[activePage].dataUrl} />
                          </Layer>
                          <Layer>
                            {objects.filter(o => o.page === activePage).map((obj) => {
                              const shapeProps = { ...obj, id: obj.id };
                              delete shapeProps.type;
                              delete shapeProps.page;
    
                              const isSelected = obj.id === selectedId;
                              const onSelect = () => setSelectedId(obj.id);
                              const onChange = (newAttrs) => updateObject(obj.id, newAttrs);
    
                              if (obj.type === 'image') return <URLImage key={obj.id} image={obj} shapeProps={shapeProps} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />;
                              if (obj.type === 'text') return <EditableText key={obj.id} shapeProps={shapeProps} isSelected={isSelected} onSelect={onSelect} onChange={onChange} onDblClick={() => {
                                if (obj.isOriginal) {
                                    updateObject(obj.id, { fill: 'black', edited: true });
                                }
                                const textNode = stageRef.current.findOne(`#${obj.id}`);
                                if (!textNode) return;
                                textNode.hide();
                                const textPosition = textNode.absolutePosition();
                                const stageBox = stageRef.current.container().getBoundingClientRect();
                                const areaPosition = {
                                    x: stageBox.left + textPosition.x,
                                    y: stageBox.top + textPosition.y,
                                };
                                const textarea = document.createElement('textarea');
                                document.body.appendChild(textarea);
                                textarea.value = obj.text;
                                textarea.style.position = 'absolute';
                                textarea.style.top = areaPosition.y + 'px';
                                textarea.style.left = areaPosition.x + 'px';
                                textarea.style.width = textNode.width() + 'px';
                                textarea.style.height = textNode.height() + 'px';
                                textarea.style.fontSize = textNode.fontSize() + 'px';
                                textarea.style.border = 'none';
                                textarea.style.padding = '0px';
                                textarea.style.margin = '0px';
                                textarea.style.overflow = 'hidden';
                                textarea.style.background = 'none';
                                textarea.style.outline = 'none';
                                textarea.style.resize = 'none';
                                textarea.style.lineHeight = textNode.lineHeight();
                                textarea.style.fontFamily = textNode.fontFamily();
                                textarea.style.transformOrigin = 'left top';
                                textarea.style.textAlign = textNode.align();
                                textarea.style.color = textNode.fill();
                                textarea.focus();
                                function removeTextarea() {
                                    textarea.parentNode.removeChild(textarea);
                                    window.removeEventListener('click', handleOutsideClick);
                                    textNode.show();
                                }
                                function handleOutsideClick(e) {
                                    if (e.target !== textarea) {
                                        if (textarea.value === '') {
                                            setObjects(objs => objs.filter(o => o.id !== obj.id));
                                        } else {
                                            updateObject(obj.id, { text: textarea.value });
                                        }
                                        removeTextarea();
                                    }
                                }
                                textarea.addEventListener('keydown', function (e) {
                                    if (e.keyCode === 13 && !e.shiftKey) {
                                        if (textarea.value === '') {
                                            setObjects(objs => objs.filter(o => o.id !== obj.id));
                                        } else {
                                            updateObject(obj.id, { text: textarea.value });
                                        }
                                        removeTextarea();
                                    }
                                    if (e.keyCode === 27) {
                                        removeTextarea();
                                    }
                                });
                                setTimeout(() => {
                                    window.addEventListener('click', handleOutsideClick);
                                });
                              }} />;
                              if (obj.type === 'rect') return <KonvaRect key={obj.id} {...shapeProps} draggable onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })} onClick={onSelect} onTap={onSelect} />;
                              if (obj.type === 'line') return <KonvaLine key={obj.id} {...shapeProps} />;
                              return null;
                            })}
                          </Layer>
                        </Stage>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </main>
                <PropertiesPanel selectedObject={selectedObject} onUpdate={(attrs) => updateObject(selectedId, attrs)} onDelete={handleDeleteSelected} />
              </div>
            )}
            <AnimatePresence>
              {isDragActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/50 flex items-center justify-center z-50">
                  <p className="text-2xl font-bold text-primary-foreground">Drop the PDF file to upload</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      );
    };
    
    export default PdfEditorPage;

import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Loader2, ArrowLeft, RefreshCw, FileImage, FileText, Image as ImageIcon, Scissors, Rows, Columns } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/cropImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

const AadhaarFormatterPage = () => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [croppedFront, setCroppedFront] = useState(null);
  const [croppedBack, setCroppedBack] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [layout, setLayout] = useState('vertical'); // 'vertical' or 'horizontal'

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentCropping, setCurrentCropping] = useState(null); // 'front' or 'back'
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const { toast } = useToast();

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageUpload = (e, side) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (side === 'front') {
          setFrontImage(event.target.result);
          setCroppedFront(null);
        } else {
          setBackImage(event.target.result);
          setCroppedBack(null);
        }
        setCurrentCropping(side);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a valid image file (JPEG, PNG, etc.).',
        variant: 'destructive',
      });
    }
  };

  const showCroppedImage = async () => {
    try {
      const imageToCrop = currentCropping === 'front' ? frontImage : backImage;
      if (!imageToCrop) {
          toast({ title: 'No Image', description: 'No image source to crop.', variant: 'destructive' });
          return;
      }
      const croppedImage = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels,
        rotation
      );
      if (currentCropping === 'front') {
        setCroppedFront(croppedImage);
      } else {
        setCroppedBack(croppedImage);
      }
      setCurrentCropping(null);
      setZoom(1);
      setRotation(0);
    } catch (e) {
      console.error(e);
      toast({ title: 'Crop Failed', description: 'Could not crop the image.', variant: 'destructive' });
    }
  };

  const processImages = async () => {
    if (!croppedFront && !croppedBack) {
      toast({ title: 'Missing Images', description: 'Please upload and crop at least one image.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);

    try {
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      const a4Width = 2480;
      const a4Height = 3508;
      finalCanvas.width = a4Width;
      finalCanvas.height = a4Height;
      finalCtx.fillStyle = 'white';
      finalCtx.fillRect(0, 0, a4Width, a4Height);

      const loadImage = (src) => new Promise((resolve, reject) => {
        if (!src) resolve(null);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      const [frontImg, backImg] = await Promise.all([loadImage(croppedFront), loadImage(croppedBack)]);

      const cardWidth = 1011 * 1.2; 
      const cardHeight = 638 * 1.2; 
      const margin = 100;
      
      const centerX = a4Width / 2;
      
      if (layout === 'vertical') {
        let currentY = margin;
        if (frontImg) {
            finalCtx.drawImage(frontImg, centerX - cardWidth / 2, currentY, cardWidth, cardHeight);
            currentY += cardHeight + margin;
        }
        if (backImg) {
            finalCtx.drawImage(backImg, centerX - cardWidth / 2, currentY, cardWidth, cardHeight);
        }
      } else { // horizontal
        const startY = a4Height / 2 - cardHeight / 2;
        if (frontImg && backImg) {
            const startX1 = a4Width / 2 - cardWidth - margin / 2;
            const startX2 = a4Width / 2 + margin / 2;
            finalCtx.drawImage(frontImg, startX1, startY, cardWidth, cardHeight);
            finalCtx.drawImage(backImg, startX2, startY, cardWidth, cardHeight);
        } else if (frontImg) {
            finalCtx.drawImage(frontImg, centerX - cardWidth / 2, startY, cardWidth, cardHeight);
        } else if (backImg) {
            finalCtx.drawImage(backImg, centerX - cardWidth / 2, startY, cardWidth, cardHeight);
        }
      }

      setResultImage(finalCanvas.toDataURL('image/jpeg', 1.0));
      toast({ title: 'Processing Complete', description: 'Your document is ready.' });
    } catch (error) {
      toast({ title: 'Processing Failed', description: error.message || 'Could not generate the document.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAsJpeg = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'aadhaar-formatted.jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsPdf = async () => {
    if (!resultImage) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const jpegImage = await pdfDoc.embedJpg(resultImage);
      const page = pdfDoc.addPage([595, 842]); // A4 size in points
      const { width, height } = page.getSize();
      page.drawImage(jpegImage, { x: 0, y: 0, width, height });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'aadhaar-formatted.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast({ title: 'PDF Creation Failed', description: 'Could not generate the PDF file.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFrontImage(null);
    setBackImage(null);
    setCroppedFront(null);
    setCroppedBack(null);
    setResultImage(null);
    setIsProcessing(false);
    if (frontInputRef.current) frontInputRef.current.value = "";
    if (backInputRef.current) backInputRef.current.value = "";
  };

  const ImagePlaceholder = ({ image, onUploadClick, onCropClick, side, croppedImage }) => (
    <div className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border rounded-lg p-4 gap-4">
      <div onClick={onUploadClick} className="w-full h-48 relative cursor-pointer hover:bg-accent transition-colors rounded-md overflow-hidden flex items-center justify-center">
        {image ? <img src={image} alt={`${side} side preview`} className="w-full h-full object-contain" /> : (
          <div className="text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Click to upload {side} side</p>
          </div>
        )}
      </div>
      {image && (
        <Button onClick={onCropClick} variant="outline" size="sm">
          <Scissors className="mr-2 h-4 w-4" /> Crop Image
        </Button>
      )}
      {croppedImage && (
        <div className="w-full mt-2">
          <p className="text-sm font-semibold text-center mb-2">Cropped Result:</p>
          <img src={croppedImage} alt={`Cropped ${side}`} className="w-full h-auto rounded-md border" />
        </div>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Aadhaar Card Formatter - Ashwheel Tools</title>
        <meta name="description" content="Manually crop your Aadhaar card front and back images and place them onto a single A4 page for easy printing. Download as JPEG or PDF. Works with one or both sides." />
        <meta name="keywords" content="aadhaar formatter, crop aadhaar, print aadhaar, e-aadhaar format, aadhaar pdf, aadhaar jpeg, online aadhaar tool" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Aadhaar Card Formatter</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Manual Document Formatter</CardTitle>
              <CardDescription>Upload front and/or back images, manually crop them, and arrange them on a print-ready A4 page.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!resultImage ? (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <ImagePlaceholder image={frontImage} onUploadClick={() => frontInputRef.current?.click()} onCropClick={() => frontImage && setCurrentCropping('front')} side="front" croppedImage={croppedFront} />
                        <input type="file" id="front-image-upload" name="front-image-upload" ref={frontInputRef} onChange={(e) => handleImageUpload(e, 'front')} accept="image/*" className="hidden" />
                      </div>
                      <div>
                        <ImagePlaceholder image={backImage} onUploadClick={() => backInputRef.current?.click()} onCropClick={() => backImage && setCurrentCropping('back')} side="back" croppedImage={croppedBack} />
                        <input type="file" id="back-image-upload" name="back-image-upload" ref={backInputRef} onChange={(e) => handleImageUpload(e, 'back')} accept="image/*" className="hidden" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Layout:</p>
                        <Button variant={layout === 'vertical' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLayout('vertical')}><Rows className="mr-2 h-4 w-4" /> Vertical</Button>
                        <Button variant={layout === 'horizontal' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLayout('horizontal')}><Columns className="mr-2 h-4 w-4" /> Horizontal</Button>
                      </div>
                      <Button onClick={processImages} disabled={isProcessing || (!croppedFront && !croppedBack)}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isProcessing ? "Generating..." : "Generate Document"}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="mb-6 border rounded-lg overflow-hidden bg-gray-100 p-2">
                      <img src={resultImage} alt="Formatted Aadhaar Card" className="w-full h-auto" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                      <Button onClick={resetState} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Start Over</Button>
                      <Button onClick={downloadAsJpeg} disabled={isProcessing}><FileImage className="mr-2 h-4 w-4" /> Download as JPEG</Button>
                      <Button onClick={downloadAsPdf} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Download as PDF
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="w-full max-w-4xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the Aadhaar Formatter</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Easily format your Aadhaar card for printing on an A4 sheet. This tool allows precise cropping and arrangement.</p>
                <ol>
                    <li><strong>Upload Images:</strong> Click on the "Upload front side" and "Upload back side" areas to select your Aadhaar images. You can upload one or both sides.</li>
                    <li><strong>Crop Precisely:</strong> After uploading, click the "Crop Image" button. A cropper tool will open. You can zoom, rotate, and drag the image to get the perfect crop. Click "Crop & Save" when done.</li>
                    <li><strong>Choose Layout:</strong> Select either a "Vertical" or "Horizontal" layout for how the front and back sides will be placed on the A4 page.</li>
                    <li><strong>Generate & Download:</strong> Click the "Generate Document" button. A preview of the A4 page will be shown. You can then download the final document as a high-quality JPEG or a print-ready PDF.</li>
                </ol>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={!!currentCropping} onOpenChange={(isOpen) => !isOpen && setCurrentCropping(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Crop Image - {currentCropping} side</DialogTitle>
          </DialogHeader>
          <div className="relative flex-1">
            <Cropper
              image={currentCropping === 'front' ? frontImage : backImage}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={85.6 / 54}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              showGrid={true}
              cropShape="rect"
              objectFit="contain"
            />
          </div>
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label htmlFor="zoom-slider" className="text-sm">Zoom</label>
              <Slider id="zoom-slider" name="zoom-slider" value={[zoom]} min={1} max={3} step={0.1} onValueChange={(val) => setZoom(val[0])} />
            </div>
            <div>
              <label htmlFor="rotation-slider" className="text-sm">Rotation</label>
              <Slider id="rotation-slider" name="rotation-slider" value={[rotation]} min={0} max={360} step={1} onValueChange={(val) => setRotation(val[0])} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrentCropping(null)}>Cancel</Button>
            <Button onClick={showCroppedImage}>Crop & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AadhaarFormatterPage;

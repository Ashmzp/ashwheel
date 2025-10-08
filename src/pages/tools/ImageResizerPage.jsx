
import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Loader2, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ImageResizerPage = () => {
  const [file, setFile] = useState(null);
  const [resizedFile, setResizedFile] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const { toast } = useToast();

  const [dpi, setDpi] = useState(300);
  const [width, setWidth] = useState(3.5);
  const [height, setHeight] = useState(4.5);
  const [unit, setUnit] = useState('cm');
  const [targetSizeKb, setTargetSizeKb] = useState(50);

  const onDrop = useCallback((acceptedFiles) => {
    const imageFile = acceptedFiles[0];
    if (imageFile && imageFile.type.startsWith('image/')) {
      setFile(Object.assign(imageFile, {
        preview: URL.createObjectURL(imageFile)
      }));
      setResizedFile(null);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select a valid image file (JPEG, PNG, etc.).',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': ['.jpeg', '.jpg', '.png', '.webp']}, multiple: false });

  const handleResize = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please upload an image first.', variant: 'destructive' });
      return;
    }
    if (width <= 0 || height <= 0 || dpi <= 0) {
        toast({ title: 'Invalid Dimensions', description: 'DPI, Width, and Height must be greater than 0.', variant: 'destructive' });
        return;
    }

    setIsResizing(true);
    setResizedFile(null);

    try {
        let targetWidth, targetHeight;
        switch (unit) {
            case 'cm':
                targetWidth = Math.round((width / 2.54) * dpi);
                targetHeight = Math.round((height / 2.54) * dpi);
                break;
            case 'inch':
                targetWidth = Math.round(width * dpi);
                targetHeight = Math.round(height * dpi);
                break;
            case 'px':
                targetWidth = Math.round(width);
                targetHeight = Math.round(height);
                break;
            default:
                throw new Error('Invalid unit selected');
        }

        const image = await imageCompression.loadImage(file.preview);
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(async (blob) => {
            let finalBlob = blob;
            if (targetSizeKb > 0 && blob.size / 1024 > targetSizeKb) {
                try {
                    const options = {
                        maxSizeMB: targetSizeKb / 1024,
                        useWebWorker: true,
                    };
                    const compressedFile = await imageCompression(new File([blob], file.name, { type: blob.type }), options);
                    finalBlob = compressedFile;
                } catch (compressionError) {
                    toast({
                        title: 'Compression Warning',
                        description: 'Could not compress to target size, providing resized image instead.',
                        variant: 'default',
                    });
                }
            }
            
            setResizedFile(Object.assign(new File([finalBlob], file.name, { type: finalBlob.type }), {
                preview: URL.createObjectURL(finalBlob)
            }));

            toast({
                title: 'Resize Successful!',
                description: `Image resized to ${formatBytes(finalBlob.size)}.`,
            });

        }, file.type);

    } catch (error) {
      toast({
        title: 'Resize Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsResizing(false);
    }
  };

  const handleDownload = () => {
    if (!resizedFile) return;
    const link = document.createElement('a');
    link.href = resizedFile.preview;
    const nameParts = file.name.split('.');
    const extension = nameParts.pop();
    const name = nameParts.join('.');
    link.download = `${name}-resized.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const reset = () => {
    setFile(null);
    setResizedFile(null);
  };

  return (
    <>
      <Helmet>
        <title>Image Resizer - Ashwheel</title>
        <meta name="description" content="Resize images to specific dimensions (cm, inch, px) and compress to a target file size in KB." />
      </Helmet>
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Image Resizer</CardTitle>
            <CardDescription className="text-center">Resize your image to specific dimensions and file size.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!file ? (
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors h-64 flex flex-col justify-center items-center ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                  <input {...getInputProps()} id="image-resizer-upload" name="image-resizer-upload" />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-foreground">Drag & drop an image here, or click to select</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative p-2 border rounded-lg w-fit mx-auto">
                    <img src={file.preview} alt="Original" className="w-auto h-auto rounded-md object-contain max-h-60" />
                    <p className="text-sm text-muted-foreground mt-2 text-center">Original Size: {formatBytes(file.size)}</p>
                    <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 rounded-full h-7 w-7" onClick={reset}>
                        <X className="h-4 w-4" />
                    </Button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <Label htmlFor="width">Width</Label>
                        <Input id="width" name="width" type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
                    </div>
                    <div>
                        <Label htmlFor="height">Height</Label>
                        <Input id="height" name="height" type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger id="unit" name="unit">
                            <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cm">Centimeters (cm)</SelectItem>
                            <SelectItem value="inch">Inches (inch)</SelectItem>
                            <SelectItem value="px">Pixels (px)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                  <Label htmlFor="dpi">DPI (for cm/inch)</Label>
                  <Input id="dpi" name="dpi" type="number" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} disabled={unit === 'px'} />
                </div>
                <div>
                  <Label htmlFor="targetSizeKb">Target Size (KB)</Label>
                  <Input id="targetSizeKb" name="targetSizeKb" type="number" value={targetSizeKb} onChange={(e) => setTargetSizeKb(Number(e.target.value))} />
                </div>
                <div className="md:col-span-2">
                    <Button onClick={handleResize} disabled={isResizing || !file} className="w-full">
                      {isResizing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resizing...</> : 'Resize Image'}
                    </Button>
                </div>
              </div>

              <AnimatePresence>
                {resizedFile && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-center">Resized Image</h3>
                    <div className="p-2 border rounded-lg bg-green-500/10 w-fit mx-auto">
                      <img src={resizedFile.preview} alt="Resized" className="w-auto h-auto rounded-md object-contain max-h-60" />
                    </div>
                    <p className="text-sm text-center">
                      New Size: <span className="font-bold text-green-600">{formatBytes(resizedFile.size)}</span>
                    </p>
                    <div className="flex justify-center">
                        <Button onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" /> Download Resized Image
                        </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full max-w-4xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the Image Resizer</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Perfectly resize and compress your images for any purpose, from social media posts to printing.</p>
                <ol>
                    <li><strong>Upload Image:</strong> Drag and drop your image or click to select a file.</li>
                    <li><strong>Set Dimensions:</strong> Enter your desired width and height. Choose the unit (centimeters, inches, or pixels). If using cm or inches, you can also set the DPI (dots per inch) for print quality.</li>
                    <li><strong>Set Target File Size:</strong> Enter the desired final file size in kilobytes (KB). The tool will attempt to compress the image to this size after resizing.</li>
                    <li><strong>Resize & Download:</strong> Click "Resize Image". The tool will process your image and provide a preview. Click "Download Resized Image" to save your file.</li>
                </ol>
            </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ImageResizerPage;

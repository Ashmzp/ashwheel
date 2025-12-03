import React, { useState, useCallback } from 'react';
import SEO from '@/components/SEO';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ImageCompressorPage = () => {
  const [file, setFile] = useState(null);
  const [targetSize, setTargetSize] = useState(500);
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const { toast } = useToast();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "Is image compression free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, completely free with unlimited compressions."}},
      {"@type": "Question", "name": "Will I lose image quality?", "acceptedAnswer": {"@type": "Answer", "text": "Our smart algorithm maintains the best possible quality while reducing file size."}}
    ]
  }

  const onDrop = useCallback((acceptedFiles) => {
    const imageFile = acceptedFiles[0];
    if (imageFile && imageFile.type.startsWith('image/')) {
      setFile(Object.assign(imageFile, {
        preview: URL.createObjectURL(imageFile)
      }));
      setCompressedFile(null);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select a valid image file (JPEG, PNG).',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': ['.jpeg', '.jpg', '.png', '.webp']} });

  const handleCompress = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please upload an image first.', variant: 'destructive' });
      return;
    }
    if (targetSize <= 0) {
      toast({ title: 'Invalid Size', description: 'Target size must be greater than 0 KB.', variant: 'destructive' });
      return;
    }

    setIsCompressing(true);
    setCompressedFile(null);

    const options = {
      maxSizeMB: targetSize / 1024,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.7,
    };
    
    try {
      const compressed = await imageCompression(file, options);
      setCompressedFile(Object.assign(compressed, {
        preview: URL.createObjectURL(compressed)
      }));
      toast({
        title: 'Compression Successful!',
        description: `Image compressed to ${formatBytes(compressed.size)}.`,
      });
    } catch (error) {
      toast({
        title: 'Compression Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile) return;
    const link = document.createElement('a');
    link.href = compressedFile.preview;
    const nameParts = file.name.split('.');
    const extension = nameParts.pop();
    const name = nameParts.join('.');
    link.download = `${name}-compressed.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const reset = () => {
    setFile(null);
    setCompressedFile(null);
  };

  return (
    <>
      <SEO path="/image-compressor" faqSchema={faqSchema} />
      <div className="container mx-auto p-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Image Compressor</CardTitle>
            <CardDescription className="text-center">Reduce image file size to a target value, right in your browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {!file ? (
                <div {...getRootProps()} className={`md:col-span-2 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors h-64 flex flex-col justify-center items-center ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                  <input {...getInputProps()} id="image-upload" name="image-upload" />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-foreground">Drag & drop an image here, or click to select</p>
                </div>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-lg font-semibold mb-2">Original Image</h3>
                    <div className="p-2 border rounded-lg">
                      <img src={file.preview} alt="Original" className="w-full h-auto rounded-md object-contain max-h-80" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">Size: {formatBytes(file.size)}</p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div>
                      <Label htmlFor="targetSize">Target Size (in KB)</Label>
                      <Input
                        id="targetSize"
                        name="targetSize"
                        type="number"
                        value={targetSize}
                        onChange={(e) => setTargetSize(Number(e.target.value))}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">The actual size may be slightly different to preserve quality.</p>
                    </div>

                    <div className="flex gap-2">
                       <Button onClick={handleCompress} disabled={isCompressing} className="w-full">
                          {isCompressing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Compressing...</> : <>Compress Image</>}
                        </Button>
                        <Button variant="outline" onClick={reset}><RefreshCw className="h-4 w-4" /></Button>
                    </div>

                    <AnimatePresence>
                      {compressedFile && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <h3 className="text-lg font-semibold">Compressed Image</h3>
                          <div className="p-2 border rounded-lg bg-green-500/10">
                            <img src={compressedFile.preview} alt="Compressed" className="w-full h-auto rounded-md object-contain max-h-80" />
                          </div>
                          <p className="text-sm text-center">
                            New Size: <span className="font-bold text-green-600">{formatBytes(compressedFile.size)}</span>
                          </p>
                          <Button onClick={handleDownload} className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Download Compressed Image
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full max-w-5xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the Image Compressor</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Optimize your images for the web or for sharing by reducing their file size without significant quality loss.</p>
                <ol>
                    <li><strong>Upload Your Image:</strong> Drag and drop your image file (JPEG, PNG, WEBP) into the upload area, or click to select it.</li>
                    <li><strong>Set Target Size:</strong> Enter your desired file size in kilobytes (KB) in the "Target Size" field. The tool will try to compress the image to be at or below this size.</li>
                    <li><strong>Compress:</strong> Click the "Compress Image" button. Our smart algorithm will reduce the file size while trying to maintain the best possible quality.</li>
                    <li><strong>Download:</strong> A preview of the compressed image and its new size will appear. Click "Download Compressed Image" to save it.</li>
                </ol>
            </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ImageCompressorPage;
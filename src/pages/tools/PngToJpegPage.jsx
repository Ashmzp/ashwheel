import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileImage, Download, Loader2, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';

const PngToJpegPage = () => {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(90);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const onDrop = useCallback((acceptedFiles) => {
    const pngFile = acceptedFiles.find(f => f.type === 'image/png');
    if (pngFile) {
      if (pngFile.size > MAX_FILE_SIZE) {
        toast({ title: 'File Too Large', description: 'Please select a file smaller than 10MB.', variant: 'destructive' });
        return;
      }
      setFile(pngFile);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PNG file.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'] },
    multiple: false,
  });

  const handleConvert = () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please upload a PNG file to convert.',
        variant: 'destructive',
      });
      return;
    }

    setIsConverting(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const originalFileName = file.name.substring(0, file.name.lastIndexOf('.'));
            link.download = `${originalFileName}-ashwheel.jpeg`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setIsConverting(false);
            setFile(null);
            toast({
              title: 'Conversion Successful!',
              description: 'Your JPEG file has been downloaded.',
            });
          },
          'image/jpeg',
          quality / 100
        );
      };
      img.onerror = () => {
        setIsConverting(false);
        toast({
          title: 'Image Load Error',
          description: 'Could not load the selected image. Please ensure it is a valid PNG.',
          variant: 'destructive',
        });
      };
    };
    reader.onerror = () => {
      setIsConverting(false);
      toast({
        title: 'File Read Error',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
    };
  };

  return (
    <>
      <Helmet>
        <title>PNG to JPEG Converter | Ashwheel</title>
        <meta name="description" content="Convert PNG images to high-quality JPEG files. Customize background color for transparency and adjust image quality. Free, fast, and easy to use." />
        <meta name="keywords" content="png to jpeg, png to jpg, convert png to jpeg, image converter, transparent png to jpg, png to jpg converter, image quality settings, convert image format" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-primary">PNG to JPEG Converter</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Easily convert your PNG files to high-quality JPEG format. Choose a background color for transparent areas and adjust the output quality. Max file size: 10MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                {...getRootProps()}
                className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} id="png-to-jpeg-upload" name="png-to-jpeg-upload" />
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                {isDragActive ? (
                  <p className="mt-2 text-primary">Drop the file here...</p>
                ) : (
                  <p className="mt-2 text-muted-foreground">Drag & drop a PNG file here, or click to select</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">Only .png files are accepted (Max 10MB)</p>
              </div>

              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 border rounded-lg bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileImage className="h-6 w-6 text-primary" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    Remove
                  </Button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quality" className="flex items-center gap-2">
                    Quality: <span className="font-bold">{quality}%</span>
                  </Label>
                  <Slider
                    id="quality"
                    name="quality"
                    min={10}
                    max={100}
                    step={1}
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">Lower quality results in smaller file size.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgColor" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Background Color
                  </Label>
                  <Input
                    id="bgColor"
                    name="bgColor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-10 p-1"
                  />
                  <p className="text-xs text-muted-foreground">Used for transparent areas in PNG. Default is white.</p>
                </div>
              </div>

              <Button onClick={handleConvert} disabled={!file || isConverting} className="w-full" size="lg">
                {isConverting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Download className="mr-2 h-5 w-5" />
                )}
                Convert & Download JPEG
              </Button>
              <div className="text-center">
                <Link to="/" className="text-sm text-primary hover:underline">
                  Back to all tools
                </Link>
              </div>
            </CardContent>
          </Card>
           <Card className="w-full mt-8">
            <CardHeader>
                <CardTitle>How to Use the PNG to JPEG Converter</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Convert your PNG images to the universally compatible JPEG format while controlling the output quality and background color.</p>
                <ol>
                    <li><strong>Upload PNG File:</strong> Drag and drop your .png file into the upload area, or click to select it from your device.</li>
                    <li><strong>Set Quality:</strong> Use the slider to adjust the quality of the output JPEG. Higher quality means a larger file size.</li>
                    <li><strong>Choose Background Color:</strong> If your PNG has transparent areas, pick a background color to fill them in the final JPEG. The default is white.</li>
                    <li><strong>Convert & Download:</strong> Click the "Convert & Download JPEG" button to process the image and save it to your device.</li>
                </ol>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default PngToJpegPage;
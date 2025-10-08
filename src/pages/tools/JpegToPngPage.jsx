
import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud, FileImage, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const JpegToPngPage = () => {
  const [files, setFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles) => {
    const jpegFiles = acceptedFiles.filter(
      (file) => file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')
    );
    if (jpegFiles.length !== acceptedFiles.length) {
      toast({
        title: 'Unsupported File Type',
        description: 'Only JPEG files (.jpg, .jpeg) are supported.',
        variant: 'destructive',
      });
    }
    setFiles((prevFiles) => [...prevFiles, ...jpegFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpeg', '.jpg'] },
  });

  const removeFile = (fileToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };
  
  const removeAllFiles = () => {
    setFiles([]);
    setConvertedFiles([]);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one JPEG file to convert.',
        variant: 'destructive',
      });
      return;
    }
    setIsConverting(true);
    setConvertedFiles([]);

    const conversionPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              const pngFile = new File([blob], `${file.name.split('.').slice(0, -1).join('.')}.png`, { type: 'image/png' });
              resolve({
                originalName: file.name,
                url: URL.createObjectURL(pngFile),
                name: pngFile.name
              });
            }, 'image/png');
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(conversionPromises);
      setConvertedFiles(results);
      toast({
        title: 'Conversion Successful',
        description: `${files.length} file(s) converted to PNG.`,
      });
    } catch (error) {
      toast({
        title: 'Conversion Failed',
        description: 'An error occurred during conversion. Please try again.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadFile = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const downloadAll = () => {
    convertedFiles.forEach(file => {
        downloadFile(file.url, file.name);
    });
  }

  return (
    <>
      <Helmet>
        <title>JPEG to PNG Converter - Ashwheel</title>
        <meta name="description" content="Free and easy online tool to convert JPEG images to PNG format with transparency support. No quality loss." />
      </Helmet>
      <div className="container mx-auto p-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">JPEG to PNG Converter</CardTitle>
              <CardDescription className="text-center text-lg">
                Convert your JPEG images to high-quality PNG format in seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                <input {...getInputProps()} id="jpeg-to-png-upload" name="jpeg-to-png-upload" />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold text-foreground">
                  {isDragActive ? 'Drop the files here...' : 'Drag & drop some files here, or click to select files'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Only .jpg and .jpeg files are accepted</p>
              </div>

              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Selected Files:</h3>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="flex items-center justify-between p-2 border rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <img src={file.preview} alt={file.name} className="h-10 w-10 object-cover rounded" />
                            <span className="text-sm font-medium truncate">{file.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFile(file)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button variant="destructive" onClick={removeAllFiles}>Remove All</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mt-6 flex justify-center">
                <Button onClick={handleConvert} disabled={isConverting || files.length === 0} size="lg">
                  {isConverting ? 'Converting...' : 'Convert to PNG'}
                </Button>
              </div>

              <AnimatePresence>
                {convertedFiles.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
                     <h3 className="text-lg font-semibold mb-2">Converted Files:</h3>
                     <div className="space-y-2">
                      {convertedFiles.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-2 border rounded-lg bg-green-500/10"
                        >
                          <div className="flex items-center gap-3">
                            <FileImage className="h-8 w-8 text-green-600" />
                            <span className="text-sm font-medium truncate">{file.name}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => downloadFile(file.url, file.name)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </motion.div>
                      ))}
                     </div>
                     <div className="flex justify-center mt-6">
                        <Button onClick={downloadAll} size="lg" className="bg-green-600 hover:bg-green-700">
                            <Download className="h-5 w-5 mr-2" />
                            Download All PNGs
                        </Button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          <Card className="w-full mt-8">
            <CardHeader>
                <CardTitle>How to Use the JPEG to PNG Converter</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Convert your JPEG images into PNG format, which is ideal for graphics with transparent backgrounds.</p>
                <ol>
                    <li><strong>Upload JPEG Files:</strong> Drag and drop your .jpg or .jpeg files into the upload area, or click to select them. You can upload multiple files at once.</li>
                    <li><strong>Convert:</strong> Click the "Convert to PNG" button. The tool will process all your uploaded images.</li>
                    <li><strong>Download:</strong> Once converted, you can download each PNG file individually or click "Download All PNGs" to get them all in a single click.</li>
                </ol>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default JpegToPngPage;

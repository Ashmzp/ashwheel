import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ArrowLeft, Loader2, Youtube } from 'lucide-react';
import { saveAs } from 'file-saver';
import { sanitizeURL } from '@/utils/sanitize';

const ThumbnailDownloaderPage = () => {
  const [url, setUrl] = useState('');
  const [thumbnails, setThumbnails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getYouTubeVideoId = (videoUrl) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = videoUrl.match(regex);
    return match ? match[1] : null;
  };

  const handleFetchThumbnails = () => {
    setIsLoading(true);
    setThumbnails(null);
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
      toast({
        title: 'Invalid YouTube URL',
        description: 'Please enter a valid YouTube video URL.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    const availableThumbnails = [
        { quality: 'Max Resolution', url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
        { quality: 'High (HD)', url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
        { quality: 'Medium', url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
        { quality: 'Standard', url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg` },
        { quality: 'Default', url: `https://img.youtube.com/vi/${videoId}/default.jpg` },
    ];
    setThumbnails(availableThumbnails);
    setIsLoading(false);
  };
  
  const handleDownload = async (thumbnailUrl, quality) => {
    try {
        // Validate URL before fetching
        const safeUrl = sanitizeURL(thumbnailUrl);
        if (!safeUrl || !safeUrl.includes('img.youtube.com')) {
          throw new Error('Invalid thumbnail URL');
        }
        const response = await fetch(safeUrl);
        if (!response.ok) {
            if(quality === 'Max Resolution') {
                const fallbackUrl = thumbnails.find(t => t.quality === 'High (HD)').url;
                toast({ title: 'Max Resolution Not Found', description: 'Downloading HD version instead.', variant: 'default' });
                handleDownload(fallbackUrl, 'High (HD)');
                return;
            }
            throw new Error(`Thumbnail not found or could not be loaded.`);
        }
        const blob = await response.blob();
        saveAs(blob, `youtube-thumbnail-${quality.toLowerCase().replace(/\s/g, '-')}.jpg`);
        toast({ title: 'Download Started', description: `Downloading ${quality} thumbnail.` });
    } catch(error) {
        console.error("Download Error:", error)
        toast({ title: 'Download Failed', description: error.message || 'Could not download image.', variant: 'destructive' });
    }
  };


  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I download a YouTube thumbnail?", "acceptedAnswer": { "@type": "Answer", "text": "Paste the YouTube video URL, click Fetch Thumbnails, and download your preferred resolution." } },
      { "@type": "Question", "name": "What resolutions are available?", "acceptedAnswer": { "@type": "Answer", "text": "We provide Max Resolution, HD, Medium, Standard, and Default thumbnail sizes." } },
      { "@type": "Question", "name": "Can I use thumbnails commercially?", "acceptedAnswer": { "@type": "Answer", "text": "Thumbnails are copyrighted by their creators. Use them according to YouTube's terms of service." } }
    ]
  };

  return (
    <>
      <SEO path="/tools/thumbnail-downloader" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary text-center">YouTube Thumbnail Downloader</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Download YouTube Video Thumbnails</CardTitle>
              <CardDescription>Paste the URL of any YouTube video below to download its thumbnail in various resolutions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <Input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleFetchThumbnails} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />}
                  Fetch Thumbnails
                </Button>
              </div>

              <AnimatePresence>
                {thumbnails && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="text-lg font-semibold mb-4 text-center">Available Thumbnails</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {thumbnails.map((thumb, index) => (
                        <motion.div
                          key={index}
                          className="border rounded-lg overflow-hidden group flex flex-col"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="relative">
                            <img src={thumb.url} alt={`${thumb.quality} thumbnail`} className="w-full h-auto aspect-video object-cover bg-muted" onError={(e) => e.currentTarget.src = 'https://placehold.co/480x360?text=Not+Available'}/>
                          </div>
                          <div className="p-3 bg-card flex-grow flex flex-col justify-between">
                            <p className="font-semibold">{thumb.quality}</p>
                            <Button onClick={() => handleDownload(thumb.url, thumb.quality)} className="w-full mt-2">
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
           <Card className="w-full max-w-4xl mt-8">
                <CardHeader>
                    <CardTitle>How to Use the YouTube Thumbnail Downloader</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Grab the perfect thumbnail from any YouTube video in just a few clicks.</p>
                    <ol>
                        <li><strong>Copy YouTube URL:</strong> Go to the YouTube video you want the thumbnail from and copy its URL.</li>
                        <li><strong>Paste the Link:</strong> Paste the copied URL into the input field on this page.</li>
                        <li><strong>Fetch Thumbnails:</strong> Click the "Fetch Thumbnails" button. The tool will display all available thumbnail resolutions for that video.</li>
                        <li><strong>Download:</strong> Click the "Download" button below the thumbnail quality you want to save.</li>
                    </ol>
                </CardContent>
            </Card>
        </main>
      </div>
    </>
  );
};

export default ThumbnailDownloaderPage;
import React, { useState } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { Link } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { ArrowLeft, Download, Loader2, Instagram as InstagramIcon, Music, Film } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';

    const InstagramDownloaderPage = () => {
      const { toast } = useToast();
      const [url, setUrl] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [mediaInfo, setMediaInfo] = useState(null);

      const handleFetch = async () => {
        if (!url) {
          toast({ title: 'Please enter an Instagram URL.', variant: 'destructive' });
          return;
        }
        setIsLoading(true);
        setMediaInfo(null);
        try {
          const { data, error } = await supabase.functions.invoke('media-downloader', {
            body: JSON.stringify({ url, type: 'instagram' }),
          });

          if (error) throw error;
          if (data.error) throw new Error(data.error);

          setMediaInfo(data);
        } catch (error) {
          toast({
            title: 'Error fetching media info',
            description: error.message || 'Please check the URL and try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      const handleDownload = (formatUrl) => {
        toast({
          title: "Opening Download Link...",
          description: "Your download will start in a new tab.",
        });
        window.open(formatUrl, '_blank');
      };

      return (
        <>
          <Helmet>
            <title>Instagram Reel & Video Downloader - Ashwheel Tools</title>
            <meta name="description" content="Save Instagram Reels, videos, and stories directly to your device. Free, anonymous, and high-resolution downloads." />
          </Helmet>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 sm:p-6">
            <header className="flex items-center justify-between mb-8">
              <Button variant="ghost" asChild>
                <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text flex items-center">
                <InstagramIcon className="mr-2 text-pink-500" />Instagram Downloader
              </h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center">
              <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                  <CardTitle>Download Instagram Reels & Videos</CardTitle>
                  <CardDescription>Paste the Reel or video link below to start.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      placeholder="https://www.instagram.com/reel/..."
                      className="flex-1"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button onClick={handleFetch} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {isLoading ? 'Fetching...' : 'Fetch Info'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {mediaInfo && (
                <Card className="w-full max-w-2xl shadow-lg mt-6">
                  <CardHeader className="flex flex-col md:flex-row items-center gap-4">
                    <img src={mediaInfo.thumbnail} alt={mediaInfo.title} className="w-full md:w-48 rounded-lg object-cover"/>
                    <div>
                      <CardTitle>{mediaInfo.title}</CardTitle>
                      <CardDescription>Select a format to download.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      {mediaInfo.formats.map((format, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => handleDownload(format.url)}
                        >
                          <div className="flex items-center">
                            {format.type === 'audio' ? <Music className="mr-2 h-4 w-4 text-green-500" /> : <Film className="mr-2 h-4 w-4 text-blue-500" />}
                            <span>{format.quality}</span>
                            <span className="text-muted-foreground ml-2">({format.format})</span>
                          </div>
                          <Download className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

                <Card className="w-full max-w-2xl mt-8">
                <CardHeader>
                    <CardTitle>How to Use the Instagram Downloader</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Save Instagram Reels, videos, and stories to your device with this simple tool.</p>
                    <ol>
                        <li><strong>Copy Link:</strong> Open the Instagram app or website, find the Reel or video you want, and copy its link.</li>
                        <li><strong>Paste Link:</strong> Paste the link into the input box on this page.</li>
                        <li><strong>Fetch and Download:</strong> Click "Fetch Info". Once the video details appear, choose your desired format and click to download.</li>
                    </ol>
                </CardContent>
              </Card>
            </main>
          </div>
        </>
      );
    };

    export default InstagramDownloaderPage;
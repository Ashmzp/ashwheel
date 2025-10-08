
import React, { useState } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { Link } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { ArrowLeft, Download, Loader2, Youtube as YoutubeIcon, Film, Music } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';

    const YoutubeDownloaderPage = () => {
      const { toast } = useToast();
      const [url, setUrl] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [videoInfo, setVideoInfo] = useState(null);

      const handleFetch = async () => {
        if (!url) {
          toast({ title: 'Please enter a YouTube URL.', variant: 'destructive' });
          return;
        }
        setIsLoading(true);
        setVideoInfo(null);
        try {
          const { data, error } = await supabase.functions.invoke('media-downloader', {
            body: JSON.stringify({ url, type: 'youtube' }),
          });

          if (error) throw error;
          
          if (data.error) throw new Error(data.error);

          setVideoInfo(data);
        } catch (error) {
          toast({
            title: 'Error fetching video info',
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
            <title>YouTube Video & Shorts Downloader - Ashwheel Tools</title>
            <meta name="description" content="Download YouTube videos and Shorts in high quality (MP4, MP3) for free. Fast, simple, and no software required." />
            <meta name="keywords" content="youtube video downloader, youtube shorts downloader, save youtube videos, download youtube shorts, youtube mp4, youtube mp3, video to mp3" />
          </Helmet>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 to-background p-4 sm:p-6">
            <header className="flex items-center justify-between mb-8">
              <Button variant="ghost" asChild>
                <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-red-600 flex items-center"><YoutubeIcon className="mr-2"/>YouTube Downloader</h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center">
              <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                  <CardTitle>Download YouTube Videos & Shorts</CardTitle>
                  <CardDescription>Paste the video link below and click "Fetch Info".</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      id="youtube-url"
                      name="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button onClick={handleFetch} className="bg-red-600 hover:bg-red-700 text-white" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {isLoading ? 'Fetching...' : 'Fetch Info'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {videoInfo && (
                <Card className="w-full max-w-2xl shadow-lg mt-6">
                  <CardHeader className="flex flex-col md:flex-row items-center gap-4">
                    <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-full md:w-48 rounded-lg object-cover"/>
                    <div>
                        <CardTitle>{videoInfo.title}</CardTitle>
                        <CardDescription>Select a format to download.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      {videoInfo.formats.map((format, index) => (
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
                    <CardTitle>How to Use the YouTube Downloader</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Save any YouTube video or Short to your device for offline viewing or listening.</p>
                    <ol>
                        <li><strong>Copy YouTube URL:</strong> Navigate to the YouTube video or Short you want to download and copy its URL from your browser's address bar.</li>
                        <li><strong>Paste Link:</strong> Paste the URL into the input field on this page.</li>
                        <li><strong>Fetch Info:</strong> Click the "Fetch Info" button. Our service will find the video and show you the available download options.</li>
                        <li><strong>Download:</strong> Choose your desired format (e.g., MP4 for video, MP3 for audio) and quality, then click to start the download.</li>
                    </ol>
                </CardContent>
              </Card>
            </main>
          </div>
        </>
      );
    };

    export default YoutubeDownloaderPage;

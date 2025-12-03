import React, { useState } from 'react';
    import SEO from '@/components/SEO';
    import { Link } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { ArrowLeft, Download, Loader2, Facebook as FacebookIcon, Music, Film } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';

    const FacebookDownloaderPage = () => {
      const { toast } = useToast();
      const [url, setUrl] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [mediaInfo, setMediaInfo] = useState(null);

      const handleFetch = async () => {
        if (!url) {
          toast({ title: 'Please enter a Facebook URL.', variant: 'destructive' });
          return;
        }
        setIsLoading(true);
        setMediaInfo(null);
        try {
          const { data, error } = await supabase.functions.invoke('media-downloader', {
            body: JSON.stringify({ url, type: 'facebook' }),
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

      const faqSchema = {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Can I download Facebook Reels?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, our tool supports downloading both Facebook videos and Reels in HD quality." } },
          { "@type": "Question", "name": "Is it safe to use?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, our downloader is completely safe and doesn't require any Facebook login or permissions." } },
          { "@type": "Question", "name": "What quality can I download?", "acceptedAnswer": { "@type": "Answer", "text": "You can download videos in various qualities including HD, depending on the original upload quality." } }
        ]
      };

      return (
        <>
          <SEO path="/tools/facebook-downloader" faqSchema={faqSchema} />
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-background p-4 sm:p-6">
            <header className="flex items-center justify-between mb-8">
              <Button variant="ghost" asChild>
                <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center">
                  <FacebookIcon className="mr-2" />Facebook Downloader
              </h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center">
              <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                  <CardTitle>Download Facebook Videos & Reels</CardTitle>
                  <CardDescription>Paste the video or Reel link below to download.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      placeholder="https://www.facebook.com/watch/?v=..."
                      className="flex-1"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button onClick={handleFetch} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
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
                    <CardTitle>How to Use the Facebook Downloader</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Save your favorite Facebook videos and Reels to watch offline anytime. Follow these simple steps:</p>
                    <ol>
                        <li><strong>Copy the Link:</strong> Go to the Facebook video or Reel you want to download and copy its URL from the address bar or share menu.</li>
                        <li><strong>Paste the Link:</strong> Paste the copied URL into the input box on this page.</li>
                        <li><strong>Fetch Info:</strong> Click the "Fetch Info" button. Our tool will process the link and display the video thumbnail and available download formats.</li>
                        <li><strong>Download:</strong> Choose your preferred quality and format from the list and click to start the download.</li>
                    </ol>
                </CardContent>
              </Card>
            </main>
          </div>
        </>
      );
    };

    export default FacebookDownloaderPage;
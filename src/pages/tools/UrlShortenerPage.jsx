import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const UrlShortenerPage = () => {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShorten = async () => {
    if (!longUrl) {
      toast({
        title: "Error",
        description: "Please enter a URL to shorten.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setShortUrl('');
    
    // This is a placeholder for a real URL shortener API
    // In a real application, you would call a backend service here.
    setTimeout(() => {
      const mockShortId = Math.random().toString(36).substring(2, 8);
      setShortUrl(`https://ashwh.in/${mockShortId}`);
      setIsLoading(false);
      toast({
        title: "Success!",
        description: "Your shortened URL is ready.",
      });
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Copied!",
      description: "Short URL copied to clipboard.",
    });
  };

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I shorten a URL?", "acceptedAnswer": { "@type": "Answer", "text": "Paste your long URL in the input field, click Shorten, and get your short link instantly." } },
      { "@type": "Question", "name": "Is it free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, our URL shortener is completely free with no registration required." } },
      { "@type": "Question", "name": "Do short links expire?", "acceptedAnswer": { "@type": "Answer", "text": "No, your shortened links are permanent and will work indefinitely." } }
    ]
  };

  return (
    <>
      <SEO path="/tools/url-shortener" faqSchema={faqSchema} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <LinkIcon className="w-8 h-8 text-primary" />
                URL Shortener
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">Paste a long URL to create a short link.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-grow space-y-2">
                  <Label htmlFor="long-url" className="sr-only">Long URL</Label>
                  <Input
                    id="long-url"
                    type="url"
                    placeholder="https://example.com/very/long/url/to/shorten"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleShorten} disabled={isLoading}>
                  {isLoading ? 'Shortening...' : 'Shorten'}
                </Button>
              </div>

              {shortUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-6"
                >
                  <Label htmlFor="short-url">Your short URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input id="short-url" value={shortUrl} readOnly className="bg-secondary" />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
          <Card className="w-full max-w-2xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the URL Shortener</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Make long, cumbersome web addresses short, clean, and easy to share.</p>
                <ol>
                    <li><strong>Paste Long URL:</strong> Copy the long URL you want to shorten and paste it into the input field.</li>
                    <li><strong>Shorten:</strong> Click the "Shorten" button.</li>
                    <li><strong>Copy & Share:</strong> Your new, short URL will appear. Click the copy button to copy it to your clipboard and share it anywhere.</li>
                </ol>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default UrlShortenerPage;
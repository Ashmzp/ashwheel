import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Youtube, Twitter, MapPin, Building, Link as LinkIcon, Rss as ThreadsIcon, AlertTriangle } from 'lucide-react';
import AnimatedLogo from '@/components/AnimatedLogo';

const iconMap = {
  facebook: { icon: Facebook, text: 'Follow on Facebook', color: 'bg-blue-600 hover:bg-blue-700' },
  instagram: { icon: Instagram, text: 'Follow on Instagram', color: 'bg-pink-500 hover:bg-pink-600' },
  youtube: { icon: Youtube, text: 'Subscribe on YouTube', color: 'bg-red-600 hover:bg-red-700' },
  twitter: { icon: Twitter, text: 'Follow on Twitter', color: 'bg-blue-400 hover:bg-blue-500' },
  threads: { icon: ThreadsIcon, text: 'Follow on Threads', color: 'bg-black hover:bg-gray-800' },
  googleMaps: { icon: MapPin, text: 'View on Google Maps', color: 'bg-green-600 hover:bg-green-700' },
  justdial: { icon: Building, text: 'Find on Justdial', color: 'bg-orange-500 hover:bg-orange-600' },
};

const MagicQrShowPage = () => {
  const [searchParams] = useSearchParams();
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedString = atob(data);
        const parsedData = JSON.parse(decodedString);
        
        const socialLinks = Object.entries(parsedData.social || {})
          .map(([key, value]) => ({
            key,
            url: value,
            ...iconMap[key],
          }))
          .filter(link => link.icon);

        const customLinks = (parsedData.custom || []).map(link => ({
          ...link,
          icon: LinkIcon,
          text: link.name,
          color: 'bg-gray-700 hover:bg-gray-800',
        }));

        setLinks([...socialLinks, ...customLinks]);

      } catch (e) {
        console.error('Failed to decode or parse data:', e);
        setError('The QR code is invalid or corrupted. Please try scanning again.');
      }
    } else {
      setError('No data found in the QR code. Please generate a new one.');
    }
  }, [searchParams]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
  
  return (
    <>
      <Helmet>
        <title>Your Links | Ashwheel</title>
        <meta name="description" content="Here are all the important links, accessible from one place." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <AnimatedLogo className="h-20 w-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Your Links</h1>
                <p className="text-muted-foreground">Click a link below to connect.</p>
              </div>

              {error ? (
                 <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg flex flex-col items-center">
                   <AlertTriangle className="h-8 w-8 mb-2" />
                   <p>{error}</p>
                 </div>
              ) : (
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {links.map((link) => {
                    const LinkIconComponent = link.icon;
                    return (
                      <motion.a
                        key={link.key}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variants={itemVariants}
                        className="w-full"
                      >
                         <Button className={`w-full h-14 text-lg rounded-lg shadow-md transition-transform transform hover:scale-105 ${link.color}`}>
                           <LinkIconComponent className="mr-3 h-6 w-6" /> {link.text}
                         </Button>
                      </motion.a>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
          <p className="text-center text-xs text-gray-500 mt-6">
            Powered by <a href="https://ashwheel.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Ashwheel</a>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default MagicQrShowPage;
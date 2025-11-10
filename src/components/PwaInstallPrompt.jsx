import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };
  
  const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isInStandaloneMode()) {
        setIsVisible(true);
      }
    };

    if (isIos() && !isInStandaloneMode()) {
        // For iOS, we just show the button which will trigger a toast.
        setIsVisible(true);
    } else {
        // For other OS, we listen for the prompt event.
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      if (!isIos()) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    };
  }, []);

  const handleInstallClick = () => {
    if (isIos()) {
      toast({
        title: 'Install App on iOS',
        description: (
          <div className="flex flex-col gap-2">
            <span>To install, tap the Share button in Safari.</span>
            <div className="flex items-center gap-1">
                <Share className="h-4 w-4" />
                <span>Then tap 'Add to Home Screen'.</span>
            </div>
          </div>
        ),
        duration: 8000,
      });
      return;
    }

    if (!deferredPrompt) {
      toast({
        title: 'App Already Installed or Not Supported',
        description: 'You can manage the app from your browser settings.',
        variant: 'secondary',
      });
      return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        toast({ title: 'App Installed!', description: 'Ashwheel is now available on your device.' });
      } else {
        toast({ title: 'Install Canceled', description: 'You can install the app later from the browser menu.', variant: 'secondary' });
      }
      setDeferredPrompt(null);
      setIsVisible(false);
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <Button onClick={handleInstallClick} size="lg" className="shadow-lg bg-gradient-to-r from-primary to-blue-500 text-white hover:from-primary/90 hover:to-blue-500/90">
        <Download className="mr-2 h-5 w-5" />
        Install App
      </Button>
    </div>
  );
};

export default PwaInstallPrompt;
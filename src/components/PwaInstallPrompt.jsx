import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if the app is not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          toast({ title: "App Installed!", description: "Ashwheel is now available on your device." });
        } else {
          toast({ title: "Install Canceled", description: "You can install the app later from the browser menu.", variant: "secondary" });
        }
        setDeferredPrompt(null);
        setIsVisible(false);
      });
    }
  }, [deferredPrompt, toast]);

  if (!isVisible) return null;

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
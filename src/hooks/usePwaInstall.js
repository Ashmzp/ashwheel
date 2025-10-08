import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const usePwaInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [lastPromptTime, setLastPromptTime] = useLocalStorage('pwa-last-prompt-time', 0);
  const [isDeclined, setIsDeclined] = useLocalStorage('pwa-install-declined', false);

  const PROMPT_DELAY = 1000 * 60 * 60 * 24; // 24 hours

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      
      const now = new Date().getTime();
      if (!isDeclined && (now - lastPromptTime > PROMPT_DELAY)) {
        setIsInstallable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isDeclined, lastPromptTime]);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
      setIsInstallable(false);
      setInstallPrompt(null);
    } else {
      console.log('PWA installation dismissed');
      setIsDeclined(true);
      setLastPromptTime(new Date().getTime());
      setIsInstallable(false);
    }
  }, [installPrompt, setIsDeclined, setLastPromptTime]);

  const handleDismiss = useCallback(() => {
    setIsInstallable(false);
    setIsDeclined(true);
    setLastPromptTime(new Date().getTime());
  }, [setIsDeclined, setLastPromptTime]);

  return { isInstallable, handleInstall, handleDismiss };
};
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useOpenCV = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const scriptId = 'opencv-js';

    // If script is already loaded and window.cv is ready, we're done.
    if (document.getElementById(scriptId) && window.cv && window.cv.Mat) {
        setIsReady(true);
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://docs.opencv.org/4.5.2/opencv.js';
    script.async = true;

    script.onload = () => {
      // opencv.js requires a short delay for the `cv` object to be ready.
      const checkCv = () => {
        if (window.cv && window.cv.Mat) {
          setIsReady(true);
        } else {
          setTimeout(checkCv, 100);
        }
      };
      checkCv();
    };

    script.onerror = () => {
      const errorMessage = "OpenCV.js failed to load. Please check your internet connection or try again.";
      setError(errorMessage);
       toast({
        title: 'AI Engine Error',
        description: errorMessage,
        variant: 'destructive',
      });
    };

    // Avoid adding duplicate scripts
    if (!document.getElementById(scriptId)) {
        document.body.appendChild(script);
    }
    
    return () => {
        // Cleanup function to remove the script if the component unmounts
        const existingScript = document.getElementById(scriptId);
        if(existingScript) {
            // In a single-page app, it might be better to leave it, 
            // but for correctness, here's how you'd remove it.
            // document.body.removeChild(existingScript);
        }
    }
  }, [toast]);

  return { isReady, error };
};
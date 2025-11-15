import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { BrowserRouter } from 'react-router-dom';
    import App from '@/App';
    import '@/index.css';
    import 'react-date-range/dist/styles.css';
    import 'react-date-range/dist/theme/default.css';
    import { Toaster } from "@/components/ui/toaster";
    import { NewAuthProvider } from '@/contexts/NewSupabaseAuthContext';
    import { HelmetProvider } from 'react-helmet-async';
    import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    const pdfjsWorker = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url,
    );

    try {
      GlobalWorkerOptions.workerSrc = pdfjsWorker.toString();
    } catch (error) {
      GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${GlobalWorkerOptions.version}/pdf.worker.min.js`;
    }


    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          refetchOnReconnect: false, // Prevent auto-refresh on reconnect
          refetchOnMount: false, // Don't refetch if data is cached
          retry: 1,
          staleTime: 1000 * 60 * 30, // 30 minutes - data stays fresh
          cacheTime: 1000 * 60 * 60, // 1 hour - cache retention
          networkMode: 'online', // Only fetch when online
        },
        mutations: {
          retry: 1,
          networkMode: 'online',
        },
      },
    });

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <HelmetProvider>
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <NewAuthProvider>
                <App />
                <Toaster />
              </NewAuthProvider>
            </QueryClientProvider>
          </BrowserRouter>
        </HelmetProvider>
      </React.StrictMode>
    );
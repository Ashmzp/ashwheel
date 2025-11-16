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
          refetchOnReconnect: false,
          refetchOnMount: false,
          refetchInterval: false,
          refetchIntervalInBackground: false,
          retry: 0,
          staleTime: Infinity, // Never consider data stale
          gcTime: 1000 * 60 * 60 * 24, // 24 hours cache retention
          networkMode: 'online',
        },
        mutations: {
          retry: 1,
          networkMode: 'online',
        },
      },
    });

    ReactDOM.createRoot(document.getElementById('root')).render(
      <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true }}>
          <QueryClientProvider client={queryClient}>
            <NewAuthProvider>
              <App />
              <Toaster />
            </NewAuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
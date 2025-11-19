import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import AppRoutes from '@/AppRoutes';
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineIndicator from '@/components/OfflineIndicator';

import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import PublicHeader from '@/components/Layout/PublicHeader';
import MobileSidebar from '@/components/Layout/MobileSidebar';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

function App() {
  const { user, loading, loadingUserData } = useAuth();
  const location = useLocation();

  const isPrintRoute = location.pathname.startsWith('/print');
  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/admin-login' ||
    location.pathname === '/auth/callback';

  // Memoize once → prevents re-renders
  const mainContent = useMemo(() => <AppRoutes />, []);

  // PRINT PAGES (simple)
  if (isPrintRoute) {
    return (
      <div className="bg-white">
        {mainContent}
      </div>
    );
  }

  // 🎯 CORE FIX:
  // Layout NEVER switches → no blink
  const isPublic = !user || isAuthRoute;

  return (
    <ErrorBoundary>
      {/* Public Routes Layout */}
      {isPublic ? (
        <div className="flex flex-col min-h-screen">
          <PublicHeader />
          <div className="flex-1">
            <ErrorBoundary>{mainContent}</ErrorBoundary>
          </div>
          <Footer />
          <PwaInstallPrompt />
          <OfflineIndicator />
        </div>
      ) : (
        // Private App Layout
        <>
          <MobileSidebar />
          <div className="flex h-screen bg-secondary/40">
            <div className="hidden lg:flex">
              <Sidebar />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto">
                <ErrorBoundary>{mainContent}</ErrorBoundary>
              </main>
            </div>
          </div>
          <PwaInstallPrompt />
          <OfflineIndicator />
        </>
      )}
    </ErrorBoundary>
  );
}

export default App;
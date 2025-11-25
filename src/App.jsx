import React from 'react';
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
    location.pathname === '/signup' ||
    location.pathname === '/auth/callback';

  // Check if current route is a public route (tools, static pages, home)
  const isPublicRoute =
    location.pathname === '/' ||
    location.pathname.startsWith('/tools/') ||
    location.pathname === '/about' ||
    location.pathname === '/contact' ||
    location.pathname === '/feedback' ||
    location.pathname === '/privacy-policy' ||
    location.pathname === '/terms-conditions' ||
    location.pathname === '/ashwheel-pro';

  // PRINT PAGES (minimal layout)
  if (isPrintRoute) {
    return (
      <div className="bg-white">
        <div className="flex-1">
          <ErrorBoundary><AppRoutes /></ErrorBoundary>
        </div>
        <Footer />
        <PwaInstallPrompt />
        <OfflineIndicator />
      </div>
    );
  }

  // AUTH PAGES (PublicHeader for login/signup/admin-login pages)
  if (isAuthRoute) {
    return (
      <>
        <PublicHeader />
        <main className="min-h-screen">
          <ErrorBoundary><AppRoutes /></ErrorBoundary>
        </main>
        <PwaInstallPrompt />
        <OfflineIndicator />
      </>
    );
  }

  // PUBLIC PAGES (PublicHeader + Footer for non-authenticated users)
  if (!user && isPublicRoute) {
    return (
      <>
        <PublicHeader />
        <main className="min-h-screen">
          <ErrorBoundary><AppRoutes /></ErrorBoundary>
        </main>
        <Footer />
        <PwaInstallPrompt />
        <OfflineIndicator />
      </>
    );
  }

  // PRIVATE APP LAYOUT (Sidebar + Header for authenticated users)
  return (
    <>
      <MobileSidebar />
      <div className="flex h-screen bg-secondary/40">
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary><AppRoutes /></ErrorBoundary>
          </main>
        </div>
      </div>
      <PwaInstallPrompt />
      <OfflineIndicator />
    </>
  );
}

export default App;
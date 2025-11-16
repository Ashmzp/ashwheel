import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import AppRoutes from '@/AppRoutes';

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

  // IMPORTANT: Memoized, will not remount UI
  const mainContent = useMemo(() => <AppRoutes />, []);

  // Layout always mounted → no flicker
  if (isPrintRoute) {
    return (
      <div className="bg-white">
        {mainContent}
      </div>
    );
  }

  // Public pages but layout should NOT flicker
  if (!user || loading || loadingUserData || isAuthRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicHeader />
        <div className="flex-1">{mainContent}</div>
        <Footer />
        <PwaInstallPrompt />
      </div>
    );
  }

  // App Layout — always mounted
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
            {mainContent}
          </main>
        </div>
      </div>
      <PwaInstallPrompt />
    </>
  );
}

export default App;
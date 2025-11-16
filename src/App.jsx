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


const LoadingFallback = () => null;

const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <PublicHeader />
    <div className="flex-1">{children}</div>
    <Footer />
    <PwaInstallPrompt />
  </div>
);

function App() {
  const { user, loading, loadingUserData } = useAuth();
  const location = useLocation();

  const isPrintRoute = useMemo(() => location.pathname.startsWith('/print'), [location.pathname]);
  const isAuthRoute = useMemo(() => 
    location.pathname === '/login' ||
    location.pathname === '/admin-login' ||
    location.pathname === '/auth/callback',
    [location.pathname]
  );

  const mainContent = <AppRoutes />;

  const showLayout = user && !loading && !loadingUserData && !isPrintRoute && !isAuthRoute;

  if (showLayout) {
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

  if (isPrintRoute) {
      return (
        <div className="bg-white">
            {mainContent}
        </div>
      );
  }

  return (
    <PublicLayout>
      {mainContent}
    </PublicLayout>
  );
}

export default App;
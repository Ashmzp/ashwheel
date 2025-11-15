import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import SeoWrapper from '@/components/SeoWrapper';
import AppRoutes from '@/AppRoutes';
import { getSeoProps } from '@/config/seoConfig';
import useHydration from '@/hooks/useHydration';
import ScrollToTop from '@/components/ScrollToTop';

const Sidebar = lazy(() => import('@/components/Layout/Sidebar'));
const Header = lazy(() => import('@/components/Layout/Header'));
const Footer = lazy(() => import('@/components/Layout/Footer'));
const PublicHeader = lazy(() => import('@/components/Layout/PublicHeader'));
const MobileSidebar = lazy(() => import('@/components/Layout/MobileSidebar'));
const PwaInstallPrompt = lazy(() => import('@/components/PwaInstallPrompt'));


const LoadingFallback = () => (
    <div className="flex justify-center items-center h-screen w-full bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
);

const PublicLayout = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <Footer />
      <PwaInstallPrompt />
    </div>
  </Suspense>
);

function App() {
  const { user, loading, loadingUserData } = useAuth();
  const location = useLocation();
  const isHydrated = useHydration();

  const isPrintRoute = location.pathname.startsWith('/print');
  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/admin-login' ||
    location.pathname === '/auth/callback';
  
  const seoProps = getSeoProps(location.pathname);

  if (!isHydrated) {
    return <LoadingFallback />;
  }

  const mainContent = (
    <Suspense fallback={<LoadingFallback />}>
        <ScrollToTop />
        <SeoWrapper {...seoProps}>
            <AppRoutes />
        </SeoWrapper>
    </Suspense>
  );

  const showLayout = user && !loading && !loadingUserData && !isPrintRoute && !isAuthRoute;

  if (showLayout) {
    return (
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
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
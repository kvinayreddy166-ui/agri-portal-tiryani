import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, AuthProvider } from '../shared/context/AuthContext';
import { LanguageProvider } from '../shared/context/LanguageContext';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { AgronixBrandMark } from '../shared/components/ui/AgronixBrandMark';
import { OfflineScreen } from '../shared/components/ui/OfflineScreen';
import { confirmDiscardIfDirty } from '../features/officers-toolkit/inspection/useDirtyGuard';
import { BrowserRouter, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SEO, OrganizationSchema } from '../shared/components/seo/SEO';
import { UpdateBanner } from '../shared/components/UpdateBanner';
import {
  INACTIVITY_SIGN_OUT_MS,
  PUBLIC_AUTH_ROUTES,
  PUBLIC_PAGES,
  PUBLIC_VIEW_PAGES,
  VALID_PAGES,
  getPageBackFallback,
  pageToPath,
  resolvePageFromLocation,
} from './router/paths';
import {
  useAppBootReady,
  useAppScrollRestoration,
  useInitialBackFallback,
} from './router/navigation';
import { AppVersionBadge, GlobalAppLoader, PageLoader, SafeSuspense } from './router/loading';
import { PageSwitch, PublicPageSwitch } from './router/PageSwitch';
import { Layout, Login } from './router/lazyPages';

function AppContent() {
  const { user, loading, authChecked, appReady, isAdminUser, isTestUser, isDealerUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [isHydrated, setIsHydrated] = useState(false);
  const [forceAppShell, setForceAppShell] = useState(false);
  const currentPathIsPublic = PUBLIC_AUTH_ROUTES.has(location.pathname) || location.pathname.startsWith('/officer-toolkit/') || location.pathname === '/' || location.pathname === '/login';
  const hideCalculatorLogo =
    location.pathname === '/officer-toolkit/fertilizer-calculator' ||
    location.pathname === '/officer-toolkit/acreage-calculator' ||
    location.pathname === '/fertilizer-calculator' ||
    location.pathname === '/acreage-calculator';
  const isOfficerToolkitRoute =
    location.pathname === '/officer-toolkit' || location.pathname.startsWith('/officer-toolkit/');
  useAppScrollRestoration(location, navigationType);
  useInitialBackFallback(location, loading, Boolean(user));

  // Wait for hydration to complete before rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (authChecked && appReady && isHydrated) {
      setForceAppShell(false);
      return;
    }

    const timer = window.setTimeout(() => {
      console.warn('App startup took too long. Showing portal shell instead of keeping the full-page loader.');
      setForceAppShell(true);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [appReady, authChecked, isHydrated]);

  const validPages = useMemo(() => VALID_PAGES, []);
  const getPageFromLocation = useCallback(() => resolvePageFromLocation(location), [location]);
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation());
  const pageRef = useRef(currentPage);

  const returnToLoginPage = useCallback(() => {
    pageRef.current = 'dashboard';
    setCurrentPage('dashboard');
    window.localStorage.removeItem('tiryani-post-login-page');
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    returnToLoginPage();
    void signOut();
  }, [returnToLoginPage, signOut]);

  const navigateToPage = useCallback(
    (page: string, options: { replace?: boolean } = {}) => {
      if (!validPages.has(page)) return;
      if (page !== pageRef.current && !confirmDiscardIfDirty()) return;
      setCurrentPage(page);
      navigate(pageToPath(page), {
        replace: options.replace,
        state: { tiryaniPage: page, from: pageRef.current },
      });
    },
    [navigate, validPages]
  );

  useEffect(() => {
    pageRef.current = currentPage;
    window.localStorage.setItem('tiryani-current-page', currentPage);
  }, [currentPage]);

  const handleBack = useCallback(() => {
    if (!confirmDiscardIfDirty()) return;
    const fallbackPage = getPageBackFallback(currentPage, isDealerUser);
    navigate(pageToPath(fallbackPage), { replace: true });
  }, [currentPage, isDealerUser, navigate]);

  useEffect(() => {
    const nextPage = getPageFromLocation();
    setCurrentPage(nextPage);
  }, [getPageFromLocation]);

  useEffect(() => {
    if ((location.pathname === '/' || location.pathname === '/login') && !location.search && user) {
      const page = isDealerUser ? 'dealer-portal' : 'dashboard';
      navigate(pageToPath(page), { replace: true, state: { tiryaniPage: page } });
    }
  }, [isDealerUser, location.pathname, location.search, navigate, user]);

  useEffect(() => {
    if (user && isDealerUser && currentPage === 'dashboard') {
      navigateToPage('dealer-portal', { replace: true });
    }
  }, [currentPage, isDealerUser, navigateToPage, user]);

  useEffect(() => {
    if (!user) return;

    let timeoutId = 0;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleSignOut();
      }, INACTIVITY_SIGN_OUT_MS);
    };

    const activityEvents = ['click', 'keydown', 'mousemove', 'pointerdown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [handleSignOut, user]);

  useEffect(() => {
    const isDefaultAuthRoute = location.pathname === '/' || location.pathname === '/login';

    if (user && isDealerUser && isDefaultAuthRoute) {
      navigateToPage('dealer-portal', { replace: true });
      return;
    }

    if (user && isAdminUser && isDefaultAuthRoute) {
      window.localStorage.removeItem('tiryani-post-login-page');
      navigateToPage('dashboard', { replace: true });
    }
  }, [location.pathname, user, isAdminUser, isDealerUser, navigateToPage]);

  useEffect(() => {
    if (
      loading ||
      user ||
      currentPage === 'dashboard' ||
      PUBLIC_VIEW_PAGES.has(currentPage) ||
      location.pathname === '/officer-toolkit' ||
      PUBLIC_AUTH_ROUTES.has(location.pathname) ||
      location.pathname.startsWith('/officer-toolkit/')
    ) return;
    navigateToPage('dashboard', { replace: true });
  }, [currentPage, loading, location.pathname, navigateToPage, user]);

  useEffect(() => {
    if (loading || user) return;
    // This effect is no longer needed since PUBLIC_AUTH_ROUTES handles all officer-toolkit routes
    // Keeping it empty to prevent any unintended redirects
  }, [loading, location.pathname, navigate, user]);

  const shellReady = isHydrated && (authChecked || currentPathIsPublic || forceAppShell) && (appReady || currentPathIsPublic || forceAppShell);
  useAppBootReady(shellReady);

  // Show loader during initial load or hydration (must be after all hooks). Public/officer toolkit routes are allowed to render even if auth is slow.
  if (!shellReady) {
    return <GlobalAppLoader hideLogo={hideCalculatorLogo} />;
  }

  if (!user) {
    if (PUBLIC_PAGES.has(currentPage)) {
      return (
        <PublicPageSwitch
          currentPage={currentPage}
          onPublicShellHome={() => navigateToPage('dashboard')}
        />
      );
    }

    return (
      <SafeSuspense fallback={<PageLoader hideLogo={hideCalculatorLogo} />}>
        <Login />
      </SafeSuspense>
    );
  }

  return (
    <SafeSuspense fallback={<PageLoader hideLogo={hideCalculatorLogo} />}>
      <Layout currentPage={currentPage} onNavigate={navigateToPage} onBack={handleBack} onSignOut={handleSignOut}>
        <PageSwitch currentPage={currentPage} isAdminUser={isAdminUser} isTestUser={isTestUser} />
        {isOfficerToolkitRoute && <AgronixBrandMark />}
      </Layout>
    </SafeSuspense>
  );
}

function languageSectionFromPath(pathname: string) {
  const normalized = pathname.replace(/^\/+|\/+$/g, '') || 'login';
  return normalized.replace(/\/+ /g, ':').replace(/\/+/g, ':');
}

function LanguageScope({ children }: { children: React.ReactNode }) {
  const { user, dealerId } = useAuth();
  const location = useLocation();
  const userKey = dealerId || user?.id || user?.email || 'public';
  const sectionKey = languageSectionFromPath(location.pathname);

  return (
    <LanguageProvider userKey={userKey} sectionKey={sectionKey}>
      {children}
    </LanguageProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <LanguageScope>
              <SEO />
              <OrganizationSchema />
              <OfflineScreen />
              <UpdateBanner />
              <AppContent />
              <AppVersionBadge />
            </LanguageScope>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;

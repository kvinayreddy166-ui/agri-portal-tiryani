import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, AuthProvider } from "../shared/context/AuthContext";
import { LanguageProvider } from "../shared/context/LanguageContext";
import { ThemeProvider } from "../shared/context/ThemeContext";
import { GlobalMobileDatePickerProvider } from "../shared/components/ui/DateInput";
import { confirmDiscardIfDirty } from "../features/officers-toolkit/inspection/useDirtyGuard";
import { BrowserRouter, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SEO, OrganizationSchema } from "../shared/components/seo/SEO";
const OfflineScreen = lazy(() => import("../shared/components/ui/OfflineScreen").then((m) => ({ default: m.OfflineScreen })));
const UpdateBanner = lazy(() => import("../shared/components/UpdateBanner").then((m) => ({ default: m.UpdateBanner })));
import {
  PUBLIC_AUTH_ROUTES,
  PUBLIC_PAGES,
  PUBLIC_VIEW_PAGES,
  VALID_PAGES,
  getPageBackFallback,
  pageToPath,
  resolvePageFromLocation
} from "./router/paths";
import {
  useAppBootReady,
  useAppScrollRestoration,
  useInitialBackFallback
} from "./router/navigation";
import { GlobalAppLoader, PageLoader, SafeSuspense } from "./router/loading";
import { PageSwitch, PublicPageSwitch } from "./router/PageSwitch";
import { Layout, Login } from "./router/lazyPages";
import { safeStorage } from "../shared/lib/safeStorage";
import { OfficerCloudSyncService } from "../features/officers-toolkit/services/officerCloudSyncService";
function AppContent() {
  const { user, loading, authChecked, appReady, isAdminUser, isTestUser, isDealerUser, isOfficerUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [isHydrated, setIsHydrated] = useState(true);
  const [forceAppShell, setForceAppShell] = useState(false);
  const currentPathIsPublic = PUBLIC_AUTH_ROUTES.has(location.pathname) || location.pathname.startsWith("/officer-toolkit/") || location.pathname === "/" || location.pathname === "/login" || location.pathname === "/disclaimer" || location.pathname === "/privacy-policy" || location.pathname === "/terms-conditions";
  const hideCalculatorLogo = location.pathname === "/officer-toolkit/fertilizer-calculator" || location.pathname === "/officer-toolkit/acreage-calculator" || location.pathname === "/fertilizer-calculator" || location.pathname === "/acreage-calculator";
  useAppScrollRestoration(location, navigationType);
  useInitialBackFallback(location, loading, Boolean(user));
  useEffect(() => {
    if (user) OfficerCloudSyncService.initOfflineSyncRetry();
  }, [user]);
  useEffect(() => {
    window.__TIRYANI_REACT_MOUNTED__ = true;
    setIsHydrated(true);
  }, []);
  useEffect(() => {
    if (authChecked && appReady && isHydrated) {
      setForceAppShell(false);
      return;
    }
    const timer = window.setTimeout(() => {
      console.warn("App startup took too long. Showing portal shell instead of keeping the full-page loader.");
      setForceAppShell(true);
    }, 8e3);
    return () => window.clearTimeout(timer);
  }, [appReady, authChecked, isHydrated]);
  const validPages = useMemo(() => VALID_PAGES, []);
  const getPageFromLocation = useCallback(() => resolvePageFromLocation(location), [location]);
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation());
  const pageRef = useRef(currentPage);
  const navigateToPage = useCallback(
    (page, options = {}) => {
      if (!validPages.has(page)) return;
      if (page !== pageRef.current && !confirmDiscardIfDirty()) return;
      setCurrentPage(page);
      navigate(pageToPath(page), {
        replace: options.replace,
        state: { tiryaniPage: page, from: pageRef.current }
      });
    },
    [navigate, validPages]
  );
  useEffect(() => {
    pageRef.current = currentPage;
    safeStorage.setItem("tiryani-current-page", currentPage);
  }, [currentPage]);
  const handleBack = useCallback(() => {
    if (!confirmDiscardIfDirty()) return;
    if (isAdminUser || isTestUser) {
      const idx = window.history.state?.idx;
      if (typeof idx === "number" && idx > 0) {
        navigate(-1);
        return;
      }
    }
    const fallbackPage = getPageBackFallback(currentPage, isDealerUser);
    navigate(pageToPath(fallbackPage), { replace: true });
  }, [currentPage, isAdminUser, isTestUser, isDealerUser, navigate]);
  useEffect(() => {
    const nextPage = getPageFromLocation();
    setCurrentPage(nextPage);
  }, [getPageFromLocation]);
  useEffect(() => {
    if ((location.pathname === "/" || location.pathname === "/login") && !location.search && user) {
      const page = isDealerUser ? "dealer-portal" : "dashboard";
      navigate(pageToPath(page), { replace: true, state: { tiryaniPage: page } });
    }
  }, [isDealerUser, location.pathname, location.search, navigate, user]);
  useEffect(() => {
    if (user && isDealerUser && currentPage === "dashboard") {
      navigateToPage("dealer-portal", { replace: true });
    }
  }, [currentPage, isDealerUser, navigateToPage, user]);
  useEffect(() => {
    const isDefaultAuthRoute = location.pathname === "/" || location.pathname === "/login";
    if (user && isDealerUser && isDefaultAuthRoute) {
      navigateToPage("dealer-portal", { replace: true });
      return;
    }
    if (user && !isDealerUser && isDefaultAuthRoute) {
      safeStorage.removeItem("tiryani-post-login-page");
      navigateToPage("dashboard", { replace: true });
    }
  }, [location.pathname, user, isDealerUser, navigateToPage]);
  useEffect(() => {
    if (loading || user || currentPage === "dashboard" || PUBLIC_VIEW_PAGES.has(currentPage) || PUBLIC_PAGES.has(currentPage) || location.pathname === "/officer-toolkit" || PUBLIC_AUTH_ROUTES.has(location.pathname) || location.pathname.startsWith("/officer-toolkit/") || location.pathname === "/disclaimer" || location.pathname === "/privacy-policy" || location.pathname === "/terms-conditions") return;
    navigateToPage("dashboard", { replace: true });
  }, [currentPage, loading, location.pathname, navigateToPage, user]);
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    if (user) {
      wasAuthenticatedRef.current = true;
      return;
    }
    if (!wasAuthenticatedRef.current) return;
    wasAuthenticatedRef.current = false;
    if (location.pathname !== "/login" && location.pathname !== "/") {
      navigate("/login", { replace: true });
    }
  }, [location.pathname, navigate, user]);
  useEffect(() => {
    if (loading || user) return;
  }, [loading, location.pathname, navigate, user]);
  const shellReady = isHydrated && (authChecked || currentPathIsPublic || forceAppShell) && (appReady || currentPathIsPublic || forceAppShell);
  useAppBootReady(shellReady);
  if (!shellReady) {
    return /* @__PURE__ */ React.createElement(GlobalAppLoader, { hideLogo: hideCalculatorLogo });
  }
  const officerPathNeedsAuth = location.pathname === "/officer-toolkit/my-records" || location.pathname === "/officer-toolkit/enforcement-tracker" || location.pathname === "/enforcement-tracker";
  if (!user && loading && officerPathNeedsAuth) {
    return /* @__PURE__ */ React.createElement(GlobalAppLoader, { hideLogo: hideCalculatorLogo });
  }
  if (!user) {
    if (PUBLIC_PAGES.has(currentPage)) {
      return /* @__PURE__ */ React.createElement(
        PublicPageSwitch,
        {
          currentPage,
          onPublicShellHome: () => navigateToPage("dashboard")
        }
      );
    }
    return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, { hideLogo: hideCalculatorLogo }) }, /* @__PURE__ */ React.createElement(Login, null));
  }
  return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, { hideLogo: hideCalculatorLogo }) }, /* @__PURE__ */ React.createElement(Layout, { currentPage, onNavigate: navigateToPage, onBack: handleBack }, /* @__PURE__ */ React.createElement(PageSwitch, { currentPage, isAdminUser, isTestUser, isOfficerUser, onNavigate: navigateToPage })));
}
function languageSectionFromPath(pathname) {
  const normalized = pathname.replace(/^\/+|\/+$/g, "") || "login";
  return normalized.replace(/\/+ /g, ":").replace(/\/+/g, ":");
}
function LanguageScope({ children }) {
  const { user, dealerId } = useAuth();
  const location = useLocation();
  const userKey = dealerId || user?.id || user?.email || "public";
  const sectionKey = languageSectionFromPath(location.pathname);
  return /* @__PURE__ */ React.createElement(LanguageProvider, { userKey, sectionKey }, children);
}
function App() {
  return /* @__PURE__ */ React.createElement(HelmetProvider, null, /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AuthProvider, null, /* @__PURE__ */ React.createElement(BrowserRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true } }, /* @__PURE__ */ React.createElement(LanguageScope, null, /* @__PURE__ */ React.createElement(SEO, null), /* @__PURE__ */ React.createElement(OrganizationSchema, null), /* @__PURE__ */ React.createElement(Suspense, { fallback: null }, /* @__PURE__ */ React.createElement(OfflineScreen, null), /* @__PURE__ */ React.createElement(UpdateBanner, null)), /* @__PURE__ */ React.createElement(GlobalMobileDatePickerProvider, null), /* @__PURE__ */ React.createElement(AppContent, null))))));
}
export default App;

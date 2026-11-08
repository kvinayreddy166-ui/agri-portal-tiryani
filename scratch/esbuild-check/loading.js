import React, { Component, Suspense, useEffect, useState } from "react";
import { PortalLogo } from "../../shared/components/ui/PortalLogo";
import { Spinner } from "../../shared/components/ui/Spinner";
import { APP_BUILD_LABEL, clearAppCacheAndReload } from "../../shared/lib/appVersion";
import { isRecoverableChunkError, recoverFromStaleAssets } from "../../shared/lib/pwaRecovery";
const BOOT_SLOW_ERROR_CODE = "AGRX-BOOT-001";
export function GlobalAppLoader({ hideLogo = false }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8e3);
    return () => window.clearTimeout(timer);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#f2f7f3] p-6 text-center dark:bg-slate-950" }, !hideLogo && /* @__PURE__ */ React.createElement(PortalLogo, { size: "xl" }), /* @__PURE__ */ React.createElement(Spinner, { size: "xl", className: "text-emerald-700 dark:text-emerald-400", label: "Loading AGRONIX" }), !hideLogo && /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-slate-600 dark:text-slate-400" }, "Loading AGRONIX..."), slow && /* @__PURE__ */ React.createElement("div", { className: "max-w-md rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm dark:border-amber-900 dark:bg-slate-900" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-black text-slate-950 dark:text-white" }, "App is taking longer than expected."), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300" }, "A stale deployment cache or slow connection may be blocking startup."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => void clearAppCacheAndReload(),
      className: "mt-3 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
    },
    "Clear cache & reload"
  ), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-xs font-bold text-slate-500 dark:text-slate-400" }, "App Version: ", APP_BUILD_LABEL, " \xB7 Error Code: ", BOOT_SLOW_ERROR_CODE)));
}
export function PageLoader({ hideLogo = false }) {
  return /* @__PURE__ */ React.createElement(GlobalAppLoader, { hideLogo });
}
const RELOAD_ATTEMPT_KEY = "agronix-lazy-reload-attempt";
class LazyLoadBoundary extends Component {
  state = { error: null, showUpdateScreen: false };
  static getDerivedStateFromError(error) {
    return { error, showUpdateScreen: isRecoverableChunkError(error.message) };
  }
  componentDidCatch(error) {
    console.error("Page failed to load:", error);
    if (isRecoverableChunkError(error.message)) {
      void this.attemptAutomaticRecovery();
    }
  }
  async attemptAutomaticRecovery() {
    try {
      const lastAttempt = window.sessionStorage.getItem(RELOAD_ATTEMPT_KEY);
      if (lastAttempt && Date.now() - Number(lastAttempt) < 3e4) {
        this.setState({ showUpdateScreen: true });
        return;
      }
      window.sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(Date.now()));
      await recoverFromStaleAssets();
    } catch {
      this.setState({ showUpdateScreen: true });
    }
  }
  handleRefreshNow = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      const registrations = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((registrations || []).map((registration) => registration.unregister()));
      window.sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
      const url = new URL(window.location.href);
      url.searchParams.set("v", String(Date.now()));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  };
  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    if (this.state.showUpdateScreen) {
      return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f2f7f3] p-6 text-center dark:bg-slate-950" }, /* @__PURE__ */ React.createElement(PortalLogo, { size: "lg" }), /* @__PURE__ */ React.createElement("div", { className: "mt-8 max-w-md" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-black text-slate-900 dark:text-white" }, "AGRONIX"), /* @__PURE__ */ React.createElement("p", { className: "mt-4 text-base font-bold text-slate-700 dark:text-slate-200" }, "A new version of AGRONIX is available."), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400" }, "Please refresh the application to continue.")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: this.handleRefreshNow,
          className: "mt-8 rounded-xl bg-emerald-700 px-8 py-3 text-base font-bold text-white hover:bg-emerald-800 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
        },
        "Refresh Now"
      ));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#f2f7f3] p-6 text-center dark:bg-slate-950" }, /* @__PURE__ */ React.createElement(PortalLogo, { size: "xl" }), /* @__PURE__ */ React.createElement("div", { className: "max-w-md rounded-2xl border border-red-200 bg-white/95 p-5 shadow-sm dark:border-red-900 dark:bg-slate-900" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-black text-slate-950 dark:text-white" }, "Something went wrong"), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300" }, "The page could not load. Please try refreshing."), /* @__PURE__ */ React.createElement("div", { className: "mt-4 flex flex-wrap justify-center gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => window.location.reload(), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500" }, "Retry"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => void clearAppCacheAndReload(), className: "rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700" }, "Clear cache and reload"))));
  }
}
export function SafeSuspense({ children, fallback }) {
  return /* @__PURE__ */ React.createElement(LazyLoadBoundary, { fallback }, /* @__PURE__ */ React.createElement(Suspense, { fallback: fallback || /* @__PURE__ */ React.createElement(PageLoader, null) }, children));
}
export function PublicReadOnlyShell({
  title,
  onHome,
  children
}) {
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-[#f2f7f3] dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("header", { className: "sticky top-0 z-40 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-700 text-white shadow-lg" }, /* @__PURE__ */ React.createElement("div", { className: "mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 items-center gap-3" }, /* @__PURE__ */ React.createElement(PortalLogo, { size: "sm" }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h1", { className: "truncate text-sm font-black sm:text-base font-[var(--font-stylish)]" }, "AGRONIX"), /* @__PURE__ */ React.createElement("p", { className: "truncate text-xs font-semibold text-emerald-100" }, title, " - Public view"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onHome,
      className: "shrink-0 rounded-lg bg-white/15 px-3 py-2 text-sm font-black transition hover:bg-white/25"
    },
    "Login"
  ))), /* @__PURE__ */ React.createElement("main", { className: "mx-auto max-w-7xl p-4 md:p-6 lg:p-8" }, /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, children)));
}

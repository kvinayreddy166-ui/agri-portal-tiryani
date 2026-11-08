import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Moon,
  Sun,
  Globe,
  Check,
  LogOut,
  Settings
} from "lucide-react";
import { PortalLogo } from "../shared/components/ui/PortalLogo";
import { ConfirmDialog } from "../shared/components/ui/ConfirmDialog";
import { useAuth } from "../shared/context/AuthContext";
import { useLanguage } from "../shared/context/LanguageContext";
import { useTheme } from "../shared/context/ThemeContext";
import { useBackButtonOverlay } from "../shared/hooks/useBackButtonOverlay";
import { OfficerProfileAutofill } from "../features/auth/components/OfficerProfileAutofill";
import { MODULE_MENU_ITEMS, getVisibleModuleItems, moduleSections, translateMenu } from "../shared/data/modules";
import { MobileBottomNav } from "../shared/components/navigation/MobileBottomNav";
import { recordRecentModule } from "../shared/lib/modulePrefs";
export function Layout({ children, currentPage, onNavigate, onBack }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const sidebarOverlay = useBackButtonOverlay("app-sidebar", () => setSidebarOpen(false));
  const profileOverlay = useBackButtonOverlay("profile-menu", () => setProfileOpen(false));
  const langOverlay = useBackButtonOverlay("lang-menu", () => setLangOpen(false));
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const signOutOverlay = useBackButtonOverlay("app-signout", () => setShowSignOutConfirm(false));
  const handleOpenSignOut = () => {
    profileOverlay.releaseOverlay();
    setProfileOpen(false);
    sidebarOverlay.releaseOverlay();
    setSidebarOpen(false);
    signOutOverlay.pushOverlay();
    setShowSignOutConfirm(true);
  };
  const handleCancelSignOut = () => {
    signOutOverlay.closeOverlay();
    setShowSignOutConfirm(false);
  };
  const handleConfirmSignOut = () => {
    signOutOverlay.releaseOverlay();
    setShowSignOutConfirm(false);
    void signOut();
  };
  const { user, isAdminUser, isDealerUser, isOfficerUser, officerProfile, dealerName, signOut } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const pageMeta = useMemo(() => getPageMeta(currentPage, t), [currentPage, t]);
  const hidePortalLogo = currentPage === "fertilizer-calculator" || currentPage === "acreage-calculator";
  const isOfficer = isOfficerUser || !isAdminUser && !isDealerUser;
  const handleNavigation = (page) => {
    const replaceDrawerEntry = sidebarOpen;
    sidebarOverlay.releaseOverlay();
    setSidebarOpen(false);
    onNavigate(page, { replace: replaceDrawerEntry });
  };
  const toggleSidebar = () => {
    if (sidebarOpen) {
      sidebarOverlay.closeOverlay();
      return;
    }
    sidebarOverlay.pushOverlay();
    setSidebarOpen(true);
  };
  const toggleProfile = () => {
    if (profileOpen) {
      profileOverlay.closeOverlay();
      return;
    }
    profileOverlay.pushOverlay();
    setProfileOpen(true);
  };
  const toggleLangMenu = () => {
    if (langOpen) {
      langOverlay.closeOverlay();
      return;
    }
    langOverlay.pushOverlay();
    setLangOpen(true);
  };
  const selectLanguage = (lang) => {
    if (language !== lang) toggleLanguage();
    langOverlay.closeOverlay();
  };
  const userMeta = user?.user_metadata ?? {};
  const profileName = officerProfile?.full_name || userMeta.full_name || userMeta.name || userMeta.display_name || user?.email?.split("@")[0] || "User";
  const profileRole = officerProfile?.designation || userMeta.designation || (isAdminUser ? t("Administrator", "\u0C28\u0C3F\u0C30\u0C4D\u0C35\u0C3E\u0C39\u0C15\u0C41\u0C21\u0C41") : isDealerUser ? dealerName || t("Dealer", "\u0C21\u0C40\u0C32\u0C30\u0C4D") : isOfficer ? t("Agricultural Officer", "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C3F") : t("View access", "\u0C1A\u0C42\u0C21\u0C47 \u0C2A\u0C4D\u0C30\u0C35\u0C47\u0C36\u0C02"));
  const menuItemIds = useMemo(() => new Set(MODULE_MENU_ITEMS.map((item) => item.id)), []);
  useEffect(() => {
    if (menuItemIds.has(currentPage)) recordRecentModule(currentPage);
  }, [currentPage, menuItemIds]);
  const visibleMenuItems = isDealerUser ? [] : getVisibleModuleItems(isAdminUser, isOfficerUser);
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-[#f2f7f3] dark:bg-slate-950" }, /* @__PURE__ */ React.createElement(OfficerProfileAutofill, null), /* @__PURE__ */ React.createElement("header", { className: "sticky top-0 z-50 border-b border-emerald-900/30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white shadow-lg" }, /* @__PURE__ */ React.createElement("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" }), /* @__PURE__ */ React.createElement("div", { className: "relative flex min-w-0 items-center justify-between gap-2 px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-5 lg:px-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-1 items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: toggleSidebar,
      className: `group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:scale-90 ${sidebarOpen ? "border-white/40 bg-white text-emerald-800 shadow-md" : "border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/20"}`,
      "aria-label": sidebarOpen ? t("Close menu", "\u0C2E\u0C46\u0C28\u0C42 \u0C2E\u0C42\u0C38\u0C3F\u0C35\u0C47\u0C2F\u0C02\u0C21\u0C3F") : t("Open menu", "\u0C2E\u0C46\u0C28\u0C42 \u0C24\u0C46\u0C30\u0C35\u0C02\u0C21\u0C3F"),
      "aria-expanded": sidebarOpen
    },
    /* @__PURE__ */ React.createElement("span", { className: "absolute left-1/2 top-1/2 h-[14px] w-[18px] -translate-x-1/2 -translate-y-1/2", "aria-hidden": true }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `absolute left-0 h-[2px] rounded-full bg-current transition-all duration-300 ease-out ${sidebarOpen ? "top-1/2 w-full -translate-y-1/2 rotate-45" : "top-0 w-5/6"}`
      }
    ), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-current transition-all duration-200 ${sidebarOpen ? "opacity-0" : "opacity-100"}`
      }
    ), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `absolute left-0 h-[2px] rounded-full bg-current transition-all duration-300 ease-out ${sidebarOpen ? "top-1/2 w-full -translate-y-1/2 -rotate-45" : "bottom-0 w-4/6"}`
      }
    ))
  ), /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 items-center gap-2" }, !hidePortalLogo && /* @__PURE__ */ React.createElement(PortalLogo, { size: "xs" }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h1", { className: "truncate text-sm font-black tracking-tight sm:text-base text-gold-300 font-[var(--font-stylish)]" }, t("Agronix", "\u0C24\u0C3F\u0C30\u0C4D\u0C2F\u0C3E\u0C28\u0C3F \u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D")), /* @__PURE__ */ React.createElement("p", { className: "truncate text-[10px] font-semibold text-emerald-100" }, t("Information Management System", "\u0C38\u0C2E\u0C3E\u0C1A\u0C3E\u0C30 \u0C28\u0C3F\u0C30\u0C4D\u0C35\u0C39\u0C23 \u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C4D\u0C25"))))), /* @__PURE__ */ React.createElement("div", { className: "relative flex shrink-0 items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: toggleTheme,
      className: "flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90",
      "aria-label": isDark ? "Light mode" : "Dark mode",
      title: isDark ? t("Light mode", "\u0C32\u0C48\u0C1F\u0C4D \u0C2E\u0C4B\u0C21\u0C4D") : t("Dark mode", "\u0C21\u0C3E\u0C30\u0C4D\u0C15\u0C4D \u0C2E\u0C4B\u0C21\u0C4D")
    },
    isDark ? /* @__PURE__ */ React.createElement(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ React.createElement(Moon, { className: "h-4 w-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: toggleLangMenu,
      className: "flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90",
      "aria-label": t("Change language", "\u0C2D\u0C3E\u0C37 \u0C2E\u0C3E\u0C30\u0C4D\u0C1A\u0C02\u0C21\u0C3F"),
      "aria-expanded": langOpen,
      "aria-haspopup": "menu",
      title: t("Change language", "\u0C2D\u0C3E\u0C37 \u0C2E\u0C3E\u0C30\u0C4D\u0C1A\u0C02\u0C21\u0C3F")
    },
    /* @__PURE__ */ React.createElement(Globe, { className: "h-4 w-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: toggleProfile,
      className: "relative flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90",
      "aria-label": t("Profile menu", "\u0C2A\u0C4D\u0C30\u0C4A\u0C2B\u0C48\u0C32\u0C4D \u0C2E\u0C46\u0C28\u0C42"),
      "aria-expanded": profileOpen,
      "aria-haspopup": "menu"
    },
    /* @__PURE__ */ React.createElement("span", { className: "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-[11px] font-black text-emerald-950 ring-2 ring-white/25" }, user?.email?.charAt(0).toUpperCase()),
    profileOpen && /* @__PURE__ */ React.createElement("span", { className: "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-400", "aria-hidden": true })
  )), langOpen && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-40", onClick: langOverlay.closeOverlay, "aria-hidden": true }), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "animate-pop-in absolute right-0 top-full z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white",
      role: "menu"
    },
    [
      { id: "en", label: "English", sub: "Default" },
      { id: "te", label: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", sub: "Telugu" }
    ].map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.id,
        type: "button",
        role: "menuitem",
        onClick: () => selectLanguage(opt.id),
        className: "flex w-full items-center justify-between gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-slate-800"
      },
      /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "block" }, opt.label), /* @__PURE__ */ React.createElement("span", { className: "block text-[10px] font-semibold text-slate-400" }, opt.sub)),
      language === opt.id && /* @__PURE__ */ React.createElement(Check, { className: "h-4 w-4 shrink-0 text-emerald-600" })
    ))
  )), profileOpen && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-40", onClick: profileOverlay.closeOverlay, "aria-hidden": true }), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "animate-pop-in absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white",
      role: "menu"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-sm font-black text-emerald-950 ring-2 ring-emerald-100 dark:ring-slate-700" }, user?.email?.charAt(0).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-sm font-black" }, profileName), /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400" }, profileRole))),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        role: "menuitem",
        onClick: () => {
          profileOverlay.closeOverlay();
          handleNavigation("settings");
        },
        className: "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-slate-800"
      },
      /* @__PURE__ */ React.createElement(Settings, { className: "h-4 w-4 shrink-0 text-slate-400" }),
      t("Settings", "\u0C38\u0C46\u0C1F\u0C4D\u0C1F\u0C3F\u0C02\u0C17\u0C41\u0C32\u0C41")
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        role: "menuitem",
        onClick: handleOpenSignOut,
        className: "flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-[13px] font-bold text-red-600 transition hover:bg-red-50 dark:border-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
      },
      /* @__PURE__ */ React.createElement(LogOut, { className: "h-4 w-4 shrink-0" }),
      t("Sign Out", "\u0C38\u0C48\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D")
    )
  ))))), sidebarOpen && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "animate-overlay-in fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[3px]",
      onClick: sidebarOverlay.closeOverlay,
      "aria-hidden": true
    }
  ), /* @__PURE__ */ React.createElement(
    "aside",
    {
      className: `fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col overflow-hidden rounded-r-3xl border-r border-emerald-100 bg-white text-slate-900 shadow-2xl shadow-slate-950/25 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-slate-800 dark:bg-slate-950 dark:text-white ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "relative border-b border-slate-200 bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 px-3.5 pb-3 pt-[calc(1rem_+_env(safe-area-inset-top))] text-white dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 items-center gap-2.5" }, /* @__PURE__ */ React.createElement(PortalLogo, { size: "sm" }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h2", { className: "truncate text-base font-black tracking-tight text-gold-300 font-[var(--font-stylish)]" }, t("Agronix", "\u0C24\u0C3F\u0C30\u0C4D\u0C2F\u0C3E\u0C28\u0C3F")), /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-emerald-100" }, t("Information Management System", "\u0C38\u0C2E\u0C3E\u0C1A\u0C3E\u0C30 \u0C28\u0C3F\u0C30\u0C4D\u0C35\u0C39\u0C23 \u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C4D\u0C25")))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: sidebarOverlay.closeOverlay,
        className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/25",
        "aria-label": t("Close menu", "\u0C2E\u0C46\u0C28\u0C42 \u0C2E\u0C42\u0C38\u0C3F\u0C35\u0C47\u0C2F\u0C02\u0C21\u0C3F")
      },
      /* @__PURE__ */ React.createElement(X, { className: "h-4 w-4" })
    ))),
    /* @__PURE__ */ React.createElement("nav", { className: "flex-1 overflow-y-auto overscroll-y-contain px-2.5 py-3" }, moduleSections(visibleMenuItems, t).map((section) => /* @__PURE__ */ React.createElement("div", { key: section.title, className: "mb-3 last:mb-0" }, /* @__PURE__ */ React.createElement("p", { className: "mb-1.5 px-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-gold-600 dark:text-gold-400" }, t(section.title, translateMenu(section.title))), /* @__PURE__ */ React.createElement("div", { className: "space-y-0.5" }, section.items.map((item) => {
      const isActive = currentPage === item.id || item.id === "crops" && currentPage.startsWith("crop-");
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: item.id,
          type: "button",
          onClick: () => handleNavigation(item.id),
          className: `group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-bold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 ${isActive ? "bg-emerald-800 text-white shadow-lg shadow-emerald-950/25 before:absolute before:left-0.5 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-gold-400 before:content-['']" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-emerald-200"}`
        },
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:bg-slate-800 dark:group-hover:text-emerald-200"}`
          },
          /* @__PURE__ */ React.createElement(item.icon, { className: "h-4 w-4" })
        ),
        /* @__PURE__ */ React.createElement("span", { className: "min-w-0 flex-1 truncate" }, t(item.label, translateMenu(item.label))),
        /* @__PURE__ */ React.createElement(
          ChevronRight,
          {
            className: `h-4 w-4 shrink-0 transition ${isActive ? "text-gold-300" : "text-slate-300 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-600"}`
          }
        )
      );
    }))))),
    /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-200 bg-slate-50 p-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900/70" }, /* @__PURE__ */ React.createElement("div", { className: "mb-2 flex items-center gap-2.5 rounded-xl border border-white bg-white px-2.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-black text-white shadow-sm" }, profileName.charAt(0).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-xs font-black text-slate-900 dark:text-white" }, profileName), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-emerald-700 dark:text-emerald-300" }, profileRole)), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleOpenSignOut,
        className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400",
        title: t("Sign Out", "\u0C38\u0C48\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D"),
        "aria-label": t("Sign Out", "\u0C38\u0C48\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D")
      },
      /* @__PURE__ */ React.createElement(LogOut, { className: "h-4 w-4" })
    )))
  ), /* @__PURE__ */ React.createElement("main", { className: "min-h-[calc(100vh-3rem)] max-w-full overflow-x-hidden pb-20 lg:pb-0" }, /* @__PURE__ */ React.createElement("div", { className: "mx-auto w-full max-w-7xl overflow-x-hidden p-3 sm:p-4 md:p-5 lg:p-6" }, currentPage !== "dashboard" && currentPage !== "dealer-portal" && /* @__PURE__ */ React.createElement("div", { className: "mb-4 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onBack,
      className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-slate-800 dark:hover:text-emerald-300",
      "aria-label": t("Back", "\u0C35\u0C46\u0C28\u0C41\u0C15\u0C15\u0C41"),
      title: t("Back", "\u0C35\u0C46\u0C28\u0C41\u0C15\u0C15\u0C41")
    },
    /* @__PURE__ */ React.createElement(ChevronLeft, { className: "h-5 w-5" })
  ), /* @__PURE__ */ React.createElement("nav", { className: "flex min-w-0 flex-wrap items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400", "aria-label": "Breadcrumb" }, pageMeta.breadcrumbs.map((item, index) => {
    const isLink = Boolean(item.page && item.page !== currentPage);
    const isCurrent = !isLink && index === pageMeta.breadcrumbs.length - 1;
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: `${item.label}-${index}` }, index > 0 && /* @__PURE__ */ React.createElement(ChevronRight, { className: "h-3.5 w-3.5 text-slate-400" }), isLink ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onNavigate(item.page),
        className: "rounded-md px-1.5 py-1 text-emerald-700 transition-colors hover:bg-emerald-50 hover:underline hover:underline-offset-2 dark:text-emerald-300 dark:hover:bg-slate-800"
      },
      t(item.label, translateMenu(item.label))
    ) : /* @__PURE__ */ React.createElement(
      "span",
      {
        "aria-current": isCurrent ? "page" : void 0,
        className: `rounded-md px-1.5 py-1 ${isCurrent ? "font-extrabold text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`
      },
      t(item.label, translateMenu(item.label))
    ));
  }))), children)), !isDealerUser && /* @__PURE__ */ React.createElement(MobileBottomNav, { currentPage, onNavigate: (page) => handleNavigation(page) }), /* @__PURE__ */ React.createElement(
    ConfirmDialog,
    {
      open: showSignOutConfirm,
      title: t("Sign Out of Agronix?", "\u0C05\u0C17\u0C4D\u0C30\u0C4B\u0C28\u0C3F\u0C15\u0C4D\u0C38\u0C4D \u0C28\u0C41\u0C02\u0C21\u0C3F \u0C38\u0C48\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C3E\u0C32\u0C3E?"),
      message: t(
        "Are you sure you want to sign out? You will need to sign in again to access the portal.",
        "\u0C2E\u0C40\u0C30\u0C41 \u0C16\u0C1A\u0C4D\u0C1A\u0C3F\u0C24\u0C02\u0C17\u0C3E \u0C38\u0C48\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C3E\u0C32\u0C28\u0C41\u0C15\u0C41\u0C02\u0C1F\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C30\u0C3E? \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D\u200C\u0C28\u0C41 \u0C2F\u0C3E\u0C15\u0C4D\u0C38\u0C46\u0C38\u0C4D \u0C1A\u0C47\u0C2F\u0C21\u0C3E\u0C28\u0C3F\u0C15\u0C3F \u0C2E\u0C40\u0C30\u0C41 \u0C2E\u0C33\u0C4D\u0C32\u0C40 \u0C38\u0C48\u0C28\u0C4D \u0C07\u0C28\u0C4D \u0C1A\u0C47\u0C2F\u0C3E\u0C32\u0C4D\u0C38\u0C3F \u0C09\u0C02\u0C1F\u0C41\u0C02\u0C26\u0C3F."
      ),
      confirmLabel: t("Sign Out", "\u0C38\u0C48\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D"),
      cancelLabel: t("Cancel", "\u0C30\u0C26\u0C4D\u0C26\u0C41 \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F"),
      icon: /* @__PURE__ */ React.createElement(LogOut, { className: "h-5 w-5", "aria-hidden": "true" }),
      onConfirm: handleConfirmSignOut,
      onCancel: handleCancelSignOut
    }
  ));
}
function getPageMeta(page, t) {
  const dashboard = { label: t("Dashboard", "\u0C21\u0C4D\u0C2F\u0C3E\u0C37\u0C4D\u200C\u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C4D"), page: "dashboard" };
  const farmCalculators = { label: t("Farm Calculators", "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D\u0C32\u0C41"), page: "farm-calculators" };
  const inspectionsHub = { label: t("Inspection & Enforcement", "\u0C24\u0C28\u0C3F\u0C16\u0C40 & \u0C05\u0C2E\u0C32\u0C41"), page: "inspection-enforcement" };
  if (page.startsWith("quality-")) {
    const title = qualityTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: t("Quality Control", "\u0C28\u0C3E\u0C23\u0C4D\u0C2F\u0C24 \u0C28\u0C3F\u0C2F\u0C02\u0C24\u0C4D\u0C30\u0C23"), page: "quality" }]
    };
  }
  if (page.startsWith("subsidy-")) {
    const title = subsidyTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: t("Subsidy & Schemes", "\u0C38\u0C2C\u0C4D\u0C38\u0C3F\u0C21\u0C40 & \u0C2A\u0C25\u0C15\u0C3E\u0C32\u0C41"), page: "subsidy" }]
    };
  }
  if (page.startsWith("knowledge-")) {
    const knowledgeTitles = {
      "knowledge-library": "Document Library",
      "knowledge-upload": "Upload Document",
      "knowledge-categories": "Categories",
      "knowledge-queue": "Processing Queue",
      "knowledge-analytics": "Query Analytics",
      "knowledge-settings": "Settings",
      "knowledge-assistant": "Knowledge Assistant",
      "knowledge-search": "Search Documents",
      "knowledge-viewer": "Document Viewer"
    };
    return {
      title: t(knowledgeTitles[page] ?? "Knowledge Base", "\u0C1C\u0C4D\u0C1E\u0C3E\u0C28 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02"),
      breadcrumbs: [dashboard, { label: t("Knowledge Base", "\u0C1C\u0C4D\u0C1E\u0C3E\u0C28 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02"), page: "knowledge" }]
    };
  }
  const meta = {
    "stock-analytics": { title: t("Command Center", "\u0C15\u0C2E\u0C3E\u0C02\u0C21\u0C4D \u0C38\u0C46\u0C02\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard] },
    "stock-receipts-sales": { title: t("Stock Receipts & Sales", "\u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D \u0C30\u0C38\u0C40\u0C1F\u0C4D\u0C32\u0C41 & \u0C05\u0C2E\u0C4D\u0C2E\u0C15\u0C3E\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "dealer-portal": { title: t("Stock Analytics", "\u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D \u0C35\u0C3F\u0C36\u0C4D\u0C32\u0C47\u0C37\u0C23\u0C32\u0C41"), breadcrumbs: [dashboard] },
    dealers: { title: t("Dealers Directory", "\u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32 \u0C21\u0C48\u0C30\u0C46\u0C15\u0C4D\u0C1F\u0C30\u0C40"), breadcrumbs: [dashboard] },
    "farmer-database": { title: t("Farmer Database", "\u0C30\u0C48\u0C24\u0C41\u0C32 \u0C21\u0C47\u0C1F\u0C3E\u0C2C\u0C47\u0C38\u0C4D"), breadcrumbs: [dashboard] },
    "officer-toolkit": { title: t("Officer Toolkit", "\u0C06\u0C2B\u0C40\u0C38\u0C30\u0C4D \u0C1F\u0C42\u0C32\u0C4D\u200C\u0C15\u0C3F\u0C1F\u0C4D"), breadcrumbs: [dashboard] },
    "field-tools": { title: t("Field Tools Hub", "\u0C15\u0C4D\u0C37\u0C47\u0C24\u0C4D\u0C30 \u0C2A\u0C30\u0C3F\u0C15\u0C30\u0C3E\u0C32 \u0C39\u0C2C\u0C4D"), breadcrumbs: [dashboard] },
    "government-portals": { title: t("Government Portals", "\u0C2A\u0C4D\u0C30\u0C2D\u0C41\u0C24\u0C4D\u0C35 \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D\u0C38\u0C4D"), breadcrumbs: [dashboard] },
    "officer-records": { title: t("Saved Records & Storage", "\u0C38\u0C47\u0C35\u0C4D \u0C1A\u0C47\u0C38\u0C3F\u0C28 \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41 & \u0C38\u0C4D\u0C1F\u0C4B\u0C30\u0C47\u0C1C\u0C4D"), breadcrumbs: [dashboard] },
    knowledge: { title: t("Knowledge Base", "\u0C1C\u0C4D\u0C1E\u0C3E\u0C28 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02"), breadcrumbs: [dashboard] },
    forms: { title: t("Smart Sampling", "\u0C38\u0C4D\u0C2E\u0C3E\u0C30\u0C4D\u0C1F\u0C4D \u0C38\u0C3E\u0C02\u0C2A\u0C4D\u0C32\u0C3F\u0C02\u0C17\u0C4D"), breadcrumbs: [dashboard] },
    "forms-library": { title: t("Forms & Library", "\u0C2B\u0C3E\u0C30\u0C3E\u0C32\u0C41 & \u0C32\u0C48\u0C2C\u0C4D\u0C30\u0C30\u0C40"), breadcrumbs: [dashboard] },
    "acreage-calculator": { title: t("Area Calculator", "\u0C0E\u0C15\u0C30\u0C3E\u0C32 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    agrochemicals: { title: t("Agrochemicals Database", "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C30\u0C38\u0C3E\u0C2F\u0C28\u0C3E\u0C32 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02"), breadcrumbs: [dashboard] },
    "farm-calculators": { title: t("Farm Calculators", "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "crop-doctor": { title: t("Crop Doctor", "\u0C2A\u0C02\u0C1F \u0C21\u0C3E\u0C15\u0C4D\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard] },
    "fertilizer-calculator": { title: t("Fertilizer Calculator", "\u0C0E\u0C30\u0C41\u0C35\u0C41\u0C32 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    "pesticide-calculator": { title: t("Pesticide Calculator", "\u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41\u0C32 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    "plant-population-calculator": { title: t("Plant Population Calculator", "\u0C2E\u0C4A\u0C15\u0C4D\u0C15\u0C32 \u0C1C\u0C28\u0C3E\u0C2D\u0C3E \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    "seed-rate-calculator": { title: t("Seed Rate Calculator", "\u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28 \u0C2E\u0C4B\u0C24\u0C3E\u0C26\u0C41 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    "irrigation-calculator": { title: t("Irrigation Calculator", "\u0C28\u0C40\u0C1F\u0C3F\u0C2A\u0C3E\u0C30\u0C41\u0C26\u0C32 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    "profitability-calculator": { title: t("Profit Calculator", "\u0C32\u0C3E\u0C2D\u0C26\u0C3E\u0C2F\u0C15\u0C24 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    "soil-health-meter": { title: t("Soil Health Meter", "\u0C2E\u0C1F\u0C4D\u0C1F\u0C3F \u0C06\u0C30\u0C4B\u0C17\u0C4D\u0C2F \u0C2E\u0C40\u0C1F\u0C30\u0C4D"), breadcrumbs: [dashboard, farmCalculators] },
    "acts-and-orders": { title: t("Acts & Orders", "\u0C1A\u0C1F\u0C4D\u0C1F\u0C3E\u0C32\u0C41 & \u0C09\u0C24\u0C4D\u0C24\u0C30\u0C4D\u0C35\u0C41\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "seed-dealer-inspection": { title: t("Seed Dealer Inspection", "\u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28 \u0C21\u0C40\u0C32\u0C30\u0C4D \u0C24\u0C28\u0C3F\u0C16\u0C40"), breadcrumbs: [dashboard, inspectionsHub] },
    "fertilizer-dealer-inspection": { title: t("Fertilizer Dealer Inspection", "\u0C0E\u0C30\u0C41\u0C35\u0C41\u0C32 \u0C21\u0C40\u0C32\u0C30\u0C4D \u0C24\u0C28\u0C3F\u0C16\u0C40"), breadcrumbs: [dashboard, inspectionsHub] },
    "insecticide-dealer-inspection": { title: t("Pesticide Dealer Inspection", "\u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41\u0C32 \u0C21\u0C40\u0C32\u0C30\u0C4D \u0C24\u0C28\u0C3F\u0C16\u0C40"), breadcrumbs: [dashboard, inspectionsHub] },
    "inspection-enforcement": { title: t("Inspection & Enforcement", "\u0C24\u0C28\u0C3F\u0C16\u0C40 & \u0C05\u0C2E\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "enforcement-tracker": { title: t("Enforcement Tracker", "\u0C0E\u0C28\u0C4D\u200C\u0C2B\u0C4B\u0C30\u0C4D\u0C38\u0C4D\u200C\u0C2E\u0C46\u0C02\u0C1F\u0C4D \u0C1F\u0C4D\u0C30\u0C3E\u0C15\u0C30\u0C4D"), breadcrumbs: [dashboard] },
    "license-services": { title: t("License Services", "\u0C32\u0C48\u0C38\u0C46\u0C28\u0C4D\u0C38\u0C4D \u0C38\u0C47\u0C35\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "tour-diary": { title: t("Tour Diary", "\u0C1F\u0C42\u0C30\u0C4D \u0C21\u0C48\u0C30\u0C40"), breadcrumbs: [dashboard] },
    "officer-contacts": { title: t("Officer Contacts", "\u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C41\u0C32 \u0C2A\u0C30\u0C3F\u0C1A\u0C2F\u0C3E\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "officer-contacts-admin": { title: t("Officer Contacts Admin", "\u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C41\u0C32 \u0C2A\u0C30\u0C3F\u0C1A\u0C2F\u0C3E\u0C32 \u0C28\u0C3F\u0C30\u0C4D\u0C35\u0C39\u0C23"), breadcrumbs: [dashboard, { label: t("Officer Contacts", "\u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C41\u0C32 \u0C2A\u0C30\u0C3F\u0C1A\u0C2F\u0C3E\u0C32\u0C41"), page: "officer-contacts" }] },
    "gos-circulars": { title: t("GOs & Circulars", "\u0C1C\u0C3F.\u0C13.\u0C32\u0C41 & \u0C38\u0C30\u0C4D\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C30\u0C4D\u0C32\u0C41"), breadcrumbs: [dashboard] },
    quality: { title: t("Quality Control", "\u0C28\u0C3E\u0C23\u0C4D\u0C2F\u0C24 \u0C28\u0C3F\u0C2F\u0C02\u0C24\u0C4D\u0C30\u0C23"), breadcrumbs: [dashboard] },
    "farm-mechanization": { title: t("Farm Mechanization", "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C2F\u0C3E\u0C02\u0C24\u0C4D\u0C30\u0C40\u0C15\u0C30\u0C23"), breadcrumbs: [dashboard] },
    excel: { title: t("Office Records", "\u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C3E\u0C32\u0C2F \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "file-directory": { title: t("Document Repository", "\u0C2A\u0C24\u0C4D\u0C30\u0C3E\u0C32 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02"), breadcrumbs: [dashboard] },
    subsidy: { title: t("Subsidy & Schemes", "\u0C38\u0C2C\u0C4D\u0C38\u0C3F\u0C21\u0C40 & \u0C2A\u0C25\u0C15\u0C3E\u0C32\u0C41"), breadcrumbs: [dashboard] },
    analytics: { title: t("Reports", "\u0C28\u0C3F\u0C35\u0C47\u0C26\u0C3F\u0C15\u0C32\u0C41"), breadcrumbs: [dashboard] },
    settings: { title: t("Settings", "\u0C38\u0C46\u0C1F\u0C4D\u0C1F\u0C3F\u0C02\u0C17\u0C41\u0C32\u0C41"), breadcrumbs: [dashboard] },
    "all-modules": { title: t("All Modules", "\u0C05\u0C28\u0C4D\u0C28\u0C3F \u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D\u200C\u0C32\u0C41"), breadcrumbs: [dashboard] }
  };
  return meta[page] || { title: t("Dashboard", "\u0C21\u0C4D\u0C2F\u0C3E\u0C37\u0C4D\u200C\u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C4D"), breadcrumbs: [{ label: t("Dashboard", "\u0C21\u0C4D\u0C2F\u0C3E\u0C37\u0C4D\u200C\u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C4D") }] };
}
function qualityTitle(page) {
  const titles = {
    "quality-seeds": "Seeds",
    "quality-pesticides": "Pesticides",
    "quality-fertilizers": "Fertilizers"
  };
  return titles[page] || "Quality Control";
}
function subsidyTitle(page) {
  const titles = {
    "subsidy-nfsm": "NFSM",
    "subsidy-state-seed": "State Seed Cell"
  };
  return titles[page] || "Subsidy & Schemes";
}

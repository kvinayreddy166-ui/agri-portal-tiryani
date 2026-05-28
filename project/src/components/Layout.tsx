import React, { useState, ReactNode } from 'react';
import {
  Menu, X, LayoutDashboard, Package, Users, Leaf, FileDown,
  Upload, BarChart3, Settings, LogOut, ChevronDown, TrendingUp, Globe2, ShieldCheck, Tractor, ScrollText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: 'Stock Management', icon: Package, adminOnly: true },
  { id: 'dealers', label: 'Dealer Management', icon: Users, adminOnly: true },
  { id: 'dealer-stock', label: 'Dealer Stock Tracking', icon: TrendingUp },
  {
    id: 'crops',
    label: 'Crop Management',
    icon: Leaf,
    submenu: [
      { id: 'cotton', label: 'Cotton' },
      { id: 'paddy', label: 'Paddy' },
      { id: 'maize', label: 'Maize' },
      { id: 'pulses', label: 'Pulses' },
      { id: 'oilseeds', label: 'Oilseeds' },
    ],
  },
  { id: 'forms', label: 'Forms & Downloads', icon: FileDown },
  { id: 'gos-circulars', label: 'GOs & Circulars', icon: ScrollText },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: ShieldCheck,
    submenu: [
      { id: 'seeds', label: 'Seeds' },
      { id: 'pesticides', label: 'Pesticides' },
      { id: 'fertilizers', label: 'Fertilizers' },
    ],
  },
  { id: 'farm-mechanization', label: 'Farm Mechanization', icon: Tractor },
  { id: 'excel', label: 'Office Files', icon: Upload },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { user, signOut, isAdminUser } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  const visibleMenuItems = menuItems.filter((item) => !item.adminOnly || isAdminUser);

  return (
    <div className="min-h-screen bg-[#eef6f0]">
      <header className="sticky top-0 z-50 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 transition hover:bg-white/20"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-1 shadow-md">
                <img src="/images/agri-emblem.png" alt="" className="h-9 w-9 rounded-lg" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-black tracking-tight sm:text-base">
                  {t('Tiryani Agriculture Portal', 'తిర్యాని వ్యవసాయ పోర్టల్')}
                </h1>
                <p className="truncate text-[10px] font-medium text-emerald-100 sm:text-xs">
                  {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold transition hover:bg-white/25 sm:text-sm"
            >
              <Globe2 className="h-4 w-4" />
              {language === 'en' ? 'తెలుగు' : 'EN'}
            </button>
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-block sm:text-xs ${
                isAdminUser ? 'bg-amber-200 text-amber-950' : 'bg-cyan-200 text-cyan-950'
              }`}
            >
              {isAdminUser ? t('Admin', 'అడ్మిన్') : t('Test User', 'టెస్ట్')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-emerald-900/30 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 pt-[4.25rem] text-white shadow-2xl transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleMenuItems.map((item) => (
            <div key={item.id}>
              {item.submenu ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition ${
                      currentPage.startsWith(item.id === 'crops' ? 'crop' : item.id) || openMenu === item.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-emerald-100 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-semibold">{t(item.label, translateMenu(item.label))}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition ${openMenu === item.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openMenu === item.id && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-emerald-500/50 pl-3">
                      {item.submenu.map((subitem) => (
                        <button
                          key={subitem.id}
                          type="button"
                          onClick={() => handleNavigation(getSubmenuPageId(item.id, subitem.id))}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                            currentPage === getSubmenuPageId(item.id, subitem.id)
                              ? 'bg-white/15 font-bold text-white'
                              : 'text-emerald-200/90 hover:bg-white/5'
                          }`}
                        >
                          {t(subitem.label, translateMenu(subitem.label))}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavigation(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    currentPage === item.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {t(item.label, translateMenu(item.label))}
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.email}</p>
              <p className="text-[10px] text-emerald-300">
                {isAdminUser ? t('Administrator', 'నిర్వాహకుడు') : t('View access', 'చూడే ప్రవేశం')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/90 py-2.5 text-sm font-bold transition hover:bg-red-500"
          >
            <LogOut className="h-4 w-4" />
            {t('Sign Out', 'సైన్ అవుట్')}
          </button>
        </div>
      </aside>

      <main className="min-h-[calc(100vh-4.25rem)]">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function translateMenu(label: string) {
  const labels: Record<string, string> = {
    Dashboard: 'డ్యాష్ బోర్డ్',
    'Stock Management': 'స్టాక్ నిర్వహణ',
    'Dealer Management': 'డీలర్ నిర్వహణ',
    'Dealer Stock Tracking': 'డీలర్ స్టాక్ ట్రాకింగ్',
    'Crop Management': 'పంట నిర్వహణ',
    'Forms & Downloads': 'ఫారాలు & డౌన్లోడ్లు',
    'GOs & Circulars': 'జీ.ఓలు & సర్క్యులర్లు',
    'Quality Control': 'నాణ్యత నియంత్రణ',
    'Farm Mechanization': 'వ్యవసాయ యాంత్రీకరణ',
    'Office Files': 'కార్యాలయ ఫైళ్లు',
    Seeds: 'విత్తనాలు',
    Pesticides: 'పురుగుమందులు',
    Fertilizers: 'ఎరువులు',
    Analytics: 'విశ్లేషణలు',
    Settings: 'సెట్టింగులు',
    Cotton: 'పత్తి',
    Paddy: 'వరి',
    Maize: 'మొక్కజొన్న',
    Pulses: 'పప్పుధాన్యాలు',
    Oilseeds: 'నూనె గింజలు',
  };
  return labels[label] ?? label;
}

function getSubmenuPageId(menuId: string, subitemId: string) {
  if (menuId === 'crops') return `crop-${subitemId}`;
  if (menuId === 'quality') return `quality-${subitemId}`;
  return `${menuId}-${subitemId}`;
}

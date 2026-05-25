import React, { useState, ReactNode } from 'react';
import {
  Menu, X, LayoutDashboard, Package, Users, Leaf, FileDown,
  Upload, BarChart3, Settings, LogOut, ChevronDown, TrendingUp, Globe2, ShieldCheck, Tractor
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
  { id: 'stock', label: 'Stock Management', icon: Package },
  { id: 'dealers', label: 'Dealer Management', icon: Users },
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
    ]
  },
  { id: 'forms', label: 'Forms & Downloads', icon: FileDown },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: ShieldCheck,
    submenu: [
      { id: 'seeds', label: 'Seeds' },
      { id: 'pesticides', label: 'Pesticides' },
      { id: 'fertilizers', label: 'Fertilizers' },
    ]
  },
  { id: 'farm-mechanization', label: 'Farm Mechanization', icon: Tractor },
  { id: 'excel', label: 'Excel Uploads', icon: Upload },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white p-1 shadow-sm">
                <img src="/images/agri-emblem.png" alt="Agriculture emblem" className="h-9 w-9 rounded-full" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-lg tracking-tight">{t('Tiryani Portal', 'తిర్యాని పోర్టల్')}</h1>
                <p className="text-xs opacity-90">{t('Agriculture Management', 'వ్యవసాయ నిర్వహణ')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-bold transition hover:bg-white/25"
            >
              <Globe2 className="h-4 w-4" />
              {language === 'en' ? 'తెలుగు' : 'English'}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <span className="text-xs bg-gradient-to-r from-yellow-200 to-orange-200 text-gray-900 px-2 py-1 rounded-full font-semibold">
                {isAdminUser ? t('Admin', 'అడ్మిన్') : t('Test User', 'టెస్ట్ వినియోగదారు')}
              </span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 pt-20
        bg-gradient-to-b from-slate-900 via-emerald-900 to-slate-900 text-white
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        overflow-y-auto
      `}>
        <div className="h-full flex flex-col pt-4">
          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                        currentPage.startsWith(item.id === 'crops' ? 'crop' : item.id) || openMenu === item.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                          : 'text-emerald-100 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                    <span className="font-medium">{t(item.label, translateMenu(item.label))}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openMenu === item.id && (
                      <div className="mt-2 ml-8 space-y-1 pl-4 border-l-2 border-emerald-400">
                        {item.submenu.map((subitem) => (
                          <button
                            key={subitem.id}
                            onClick={() => handleNavigation(getSubmenuPageId(item.id, subitem.id))}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                              currentPage === getSubmenuPageId(item.id, subitem.id)
                                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold'
                                : 'text-emerald-200 hover:bg-white/5'
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
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg font-semibold'
                        : 'text-emerald-100 hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{t(item.label, translateMenu(item.label))}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-emerald-700">
            <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-lg bg-white/5">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.email}</p>
                <p className="text-emerald-300 text-xs">
                  {isAdminUser ? t('Administrator', 'నిర్వాహకుడు') : t('Test User', 'టెస్ట్ వినియోగదారు')}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg rounded-lg transition-all font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              {t('Sign Out', 'సైన్ అవుట్')}
            </button>
          </div>

          <div className="px-4 py-3 border-t border-emerald-700 text-xs text-emerald-300 text-center">
            <p className="font-semibold">{t('Department of Agriculture', 'వ్యవసాయ శాఖ')}</p>
            <p>{t('Tiryani Mandal', 'తిర్యాని మండలం')}</p>
          </div>
        </div>
      </aside>

      <main className="min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
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
    'Quality Control': 'నాణ్యత నియంత్రణ',
    'Farm Mechanization': 'వ్యవసాయ యాంత్రీకరణ',
    Seeds: 'విత్తనాలు',
    Pesticides: 'పురుగుమందులు',
    Fertilizers: 'ఎరువులు',
    'Excel Uploads': 'ఎక్సెల్ అప్లోడ్లు',
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
  const getSubmenuPageId = (menuId: string, subitemId: string) => {
    if (menuId === 'crops') return `crop-${subitemId}`;
    if (menuId === 'quality') return `quality-${subitemId}`;
    return `${menuId}-${subitemId}`;
  };

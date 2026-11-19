import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, UploadCloud, Tags, ListChecks, BarChart3, Settings, BookOpen, Search } from 'lucide-react';
import { useKnowledgeNav, KNOWLEDGE_PATHS, type KnowledgePage } from '../hooks/useKnowledgeNav';
import { useLanguage } from '../../../shared/context/LanguageContext';

interface NavItem {
  id: KnowledgePage;
  labelEn: string;
  labelTe: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { id: 'dashboard', labelEn: 'Dashboard', labelTe: 'డ్యాష్‌బోర్డ్', icon: LayoutDashboard },
  { id: 'library', labelEn: 'Document Library', labelTe: 'పత్రాల లైబ్రరీ', icon: FolderOpen, adminOnly: true },
  { id: 'upload', labelEn: 'Upload Document', labelTe: 'పత్రాన్ని అప్‌లోడ్ చేయండి', icon: UploadCloud, adminOnly: true },
  { id: 'categories', labelEn: 'Categories', labelTe: 'వర్గాలు', icon: Tags, adminOnly: true },
  { id: 'queue', labelEn: 'Processing Queue', labelTe: 'ప్రాసెసింగ్ క్యూ', icon: ListChecks, adminOnly: true },
  { id: 'analytics', labelEn: 'Query Analytics', labelTe: 'ప్రశ్నల విశ్లేషణ', icon: BarChart3, adminOnly: true },
  { id: 'settings', labelEn: 'Settings', labelTe: 'సెట్టింగ్‌లు', icon: Settings, adminOnly: true },
  { id: 'assistant', labelEn: 'Knowledge Assistant', labelTe: 'నాలెడ్జ్ అసిస్టెంట్', icon: BookOpen },
  { id: 'search', labelEn: 'Search Documents', labelTe: 'పత్రాలలో వెతకండి', icon: Search },
];

interface KnowledgeNavProps {
  isAdmin: boolean;
}

export function KnowledgeNav({ isAdmin }: KnowledgeNavProps) {
  const { t } = useLanguage();
  const go = useKnowledgeNav();
  const location = useLocation();
  const visible = items.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="portal-card modern-card mb-4 overflow-x-auto p-2">
      <div className="flex min-w-max items-center gap-1.5">
        {visible.map((item) => {
          const path = KNOWLEDGE_PATHS[item.id];
          const active = location.pathname === path || (item.id === 'dashboard' && location.pathname === '/knowledge');
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-emerald-700 text-white shadow'
                  : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelEn, item.labelTe)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

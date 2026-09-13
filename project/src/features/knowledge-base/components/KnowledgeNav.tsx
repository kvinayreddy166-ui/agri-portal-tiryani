import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, UploadCloud, Tags, ListChecks, BarChart3, Settings, BookOpen, Search } from 'lucide-react';
import { useKnowledgeNav, KNOWLEDGE_PATHS, type KnowledgePage } from '../hooks/useKnowledgeNav';

interface NavItem {
  id: KnowledgePage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'library', label: 'Document Library', icon: FolderOpen, adminOnly: true },
  { id: 'upload', label: 'Upload Document', icon: UploadCloud, adminOnly: true },
  { id: 'categories', label: 'Categories', icon: Tags, adminOnly: true },
  { id: 'queue', label: 'Processing Queue', icon: ListChecks, adminOnly: true },
  { id: 'analytics', label: 'Query Analytics', icon: BarChart3, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  { id: 'assistant', label: 'Knowledge Assistant', icon: BookOpen },
  { id: 'search', label: 'Search Documents', icon: Search },
];

interface KnowledgeNavProps {
  isAdmin: boolean;
}

export function KnowledgeNav({ isAdmin }: KnowledgeNavProps) {
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
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

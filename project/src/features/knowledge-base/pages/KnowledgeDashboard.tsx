import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Loader2, AlertTriangle, ScanLine, Layers, Search, UploadCloud, Clock } from 'lucide-react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { ModernStatCard } from '../../../shared/components/ui/ModernCard';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { useKnowledgeNav } from '../hooks/useKnowledgeNav';
import { fetchDashboardStats } from '../services/knowledgeService';
import type { DashboardStats } from '../types/index';

export function KnowledgeDashboard() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const go = useKnowledgeNav();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchDashboardStats()
      .then((s) => { if (active) setStats(s); })
      .catch((e) => { if (active) setError((e as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow={t('Knowledge Base', 'నాలెడ్జ్ బేస్')}
        title={t('Dashboard', 'డ్యాష్‌బోర్డ్')}
        description={t('Overview of the AGRONIX Knowledge Base — documents, processing and queries.', 'AGRONIX నాలెడ్జ్ బేస్ అవలోకనం — పత్రాలు, ప్రాసెసింగ్ మరియు ప్రశ్నలు.')}
      />
      {isAdminUser && (
        <div className="mb-4 flex justify-end">
          <button onClick={() => go('upload')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
            <UploadCloud className="h-4 w-4" /> {t('Upload Document', 'పత్రాన్ని అప్‌లోడ్ చేయండి')}
          </button>
        </div>
      )}
      <KnowledgeNav isAdmin={isAdminUser} />

      {error && (
        <div className="portal-card modern-card mb-4 border-red-200 p-4 text-sm font-semibold text-red-700">
          {t('Could not load dashboard:', 'డ్యాష్‌బోర్డ్ లోడ్ చేయడం విఫలమైంది:')} {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <ModernStatCard compact label={t('Total Documents', 'మొత్తం పత్రాలు')} value={stats?.totalDocuments ?? 0} icon={FileText} gradient="from-emerald-500 to-emerald-600" />
        <ModernStatCard compact label={t('Active', 'క్రియాశీలకంగా ఉన్నవి')} value={stats?.activeDocuments ?? 0} icon={CheckCircle2} gradient="from-green-500 to-emerald-600" />
        <ModernStatCard compact label={t('Processing', 'ప్రాసెసింగ్‌లో ఉన్నవి')} value={stats?.processing ?? 0} icon={Loader2} gradient="from-blue-500 to-cyan-600" />
        <ModernStatCard compact label={t('Failed', 'విఫలమైనవి')} value={stats?.failed ?? 0} icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
        <ModernStatCard compact label={t('OCR Required', 'OCR అవసరం')} value={stats?.ocrRequired ?? 0} icon={ScanLine} gradient="from-amber-500 to-orange-600" />
        <ModernStatCard compact label={t('Total Chunks', 'మొత్తం చంక్స్')} value={stats?.totalChunks ?? 0} icon={Layers} gradient="from-teal-600 to-emerald-700" />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
        <ModernStatCard compact label={t('Total Queries', 'మొత్తం ప్రశ్నలు')} value={stats?.totalQueries ?? 0} icon={Search} gradient="from-sky-600 to-blue-700" />
        <ModernStatCard compact label={t('Unanswered', 'సమాధానం లేనివి')} value={stats?.unansweredQuestions ?? 0} icon={AlertTriangle} gradient="from-amber-500 to-yellow-600" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="portal-card modern-card p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('Recent Uploads', 'ఇటీవలి అప్‌లోడ్‌లు')}</h3>
          {stats?.recentUploads.length ? (
            <ul className="space-y-2">
              {stats.recentUploads.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-700 dark:text-slate-200">{d.title}</span>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">{t('No documents uploaded yet.', 'ఇంకా పత్రాలు ఏవీ అప్‌లోడ్ చేయబడలేదు.')}</p>}
        </div>

        <div className="portal-card modern-card p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('Recent Queries', 'ఇటీవలి ప్రశ్నలు')}</h3>
          {stats?.recentQueries.length ? (
            <ul className="space-y-2">
              {stats.recentQueries.map((q) => (
                <li key={q.id} className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-700 dark:text-slate-200">{q.query}</span>
                  <QualityBadge q={q.retrieval_quality} />
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">{t('No queries yet.', 'ఇంకా ప్రశ్నలు ఏవీ లేవు.')}</p>}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    OCR_REQUIRED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    UPLOADED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  const cls = map[status] ?? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${cls}`}>{status}</span>;
}

function QualityBadge({ q }: { q: string | null }) {
  const map: Record<string, string> = {
    STRONG: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    PARTIAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    LIMITED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    NONE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  const cls = (q && map[q]) ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${cls}`}>{q ?? '—'}</span>;
}

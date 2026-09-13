import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Loader2, AlertTriangle, ScanLine, Layers, Search, UploadCloud, Clock } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { ModernStatCard } from '../../../components/ui/ModernCard';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { useKnowledgeNav } from '../hooks/useKnowledgeNav';
import { fetchDashboardStats } from '../services/knowledgeService';
import type { DashboardStats } from '../types';

export function KnowledgeDashboard() {
  const { isAdminUser } = useAuth();
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
        eyebrow="Knowledge Base"
        title="Dashboard"
        description="Overview of the AGRONIX Knowledge Base — documents, processing and queries."
        actions={isAdminUser ? (
          <button onClick={() => go('upload')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
            <UploadCloud className="h-4 w-4" /> Upload Document
          </button>
        ) : undefined}
      />
      <KnowledgeNav isAdmin={isAdminUser} />

      {error && (
        <div className="portal-card modern-card mb-4 border-red-200 p-4 text-sm font-semibold text-red-700">
          Could not load dashboard: {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <ModernStatCard label="Total Documents" value={stats?.totalDocuments ?? 0} icon={FileText} gradient="from-emerald-500 to-teal-600" />
        <ModernStatCard label="Active" value={stats?.activeDocuments ?? 0} icon={CheckCircle2} gradient="from-green-500 to-emerald-600" />
        <ModernStatCard label="Processing" value={stats?.processing ?? 0} icon={Loader2} gradient="from-blue-500 to-cyan-600" />
        <ModernStatCard label="Failed" value={stats?.failed ?? 0} icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
        <ModernStatCard label="OCR Required" value={stats?.ocrRequired ?? 0} icon={ScanLine} gradient="from-amber-500 to-orange-600" />
        <ModernStatCard label="Total Chunks" value={stats?.totalChunks ?? 0} icon={Layers} gradient="from-violet-500 to-purple-600" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
        <ModernStatCard label="Total Queries" value={stats?.totalQueries ?? 0} icon={Search} gradient="from-indigo-500 to-blue-600" />
        <ModernStatCard label="Unanswered" value={stats?.unansweredQuestions ?? 0} icon={AlertTriangle} gradient="from-amber-500 to-yellow-600" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="portal-card modern-card p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Recent Uploads</h3>
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
          ) : <p className="text-sm text-slate-500">No documents uploaded yet.</p>}
        </div>

        <div className="portal-card modern-card p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Recent Queries</h3>
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
          ) : <p className="text-sm text-slate-500">No queries yet.</p>}
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

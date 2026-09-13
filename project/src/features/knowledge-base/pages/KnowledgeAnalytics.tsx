import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { ModernStatCard } from '../../../components/ui/ModernCard';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { fetchQueryAnalytics } from '../services/knowledgeService';

export function KnowledgeAnalytics() {
  const { isAdminUser } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchQueryAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueryAnalytics().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!isAdminUser) return <div className="portal-card modern-card p-6 text-center font-bold text-slate-600">Admin access required.</div>;

  return (
    <div>
      <PageHeader eyebrow="Knowledge Base" title="Query Analytics" description="Understand what users ask and where retrieval falls short." />
      <KnowledgeNav isAdmin={isAdminUser} />

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ModernStatCard label="Total Queries" value={data?.totalQueries ?? 0} icon={BarChart3} gradient="from-indigo-500 to-blue-600" />
            <ModernStatCard label="Unanswered" value={data?.unanswered ?? 0} icon={HelpCircle} gradient="from-red-500 to-rose-600" />
            <ModernStatCard label="Partial Matches" value={data?.partial ?? 0} icon={AlertTriangle} gradient="from-amber-500 to-orange-600" />
            <ModernStatCard label="Avg Response" value={`${data?.averageResponseTime ?? 0}ms`} icon={Clock} gradient="from-emerald-500 to-teal-600" />
          </div>

          <div className="portal-card modern-card mt-4 p-4">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Recent Queries</h3>
            {data?.recent.length ? (
              <ul className="space-y-2">
                {data.recent.map((q) => (
                  <li key={q.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-semibold text-slate-700 dark:text-slate-200">{q.query}</span>
                    <span className="text-xs text-slate-400">{q.retrieval_quality ?? '—'}</span>
                    <span className="text-xs text-slate-400">{q.response_time_ms ? `${q.response_time_ms}ms` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No queries logged yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}

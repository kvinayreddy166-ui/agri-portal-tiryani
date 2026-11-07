import React, { useCallback, useEffect, useState } from 'react';
import { ListChecks, Loader2, RefreshCw, AlertTriangle, RotateCw } from 'lucide-react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { useToast } from '../../../shared/components/ui/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { fetchProcessingJobs, processDocument } from '../services/knowledgeService';
import type { ProcessingJob } from '../types/index';

export function KnowledgeProcessingQueue() {
  const { isAdminUser } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setJobs(await fetchProcessingJobs());
    } catch (e) {
      toast.showReset('Load failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const retry = async (job: ProcessingJob) => {
    try {
      await processDocument(job.document_id);
      toast.showInfo('Reprocessing started', 'Tracking progress here.');
      load();
    } catch (e) {
      toast.showReset('Retry failed', (e as Error).message);
    }
  };

  if (!isAdminUser) return <div className="portal-card modern-card p-6 text-center font-bold text-slate-600">Admin access required.</div>;

  return (
    <div>
      <PageHeader eyebrow="Knowledge Base" title="Processing Queue" description="Track document processing jobs. Auto-refreshes every 5 seconds."
        actions={<button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className="h-4 w-4" /> Refresh</button>} />
      <KnowledgeNav isAdmin={isAdminUser} />

      {loading && jobs.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
      ) : jobs.length === 0 ? (
        <div className="portal-card modern-card p-10 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-500">No processing jobs yet. Upload a document to begin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="portal-card modern-card flex items-center gap-2.5 p-2.5 sm:p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xs">
                <ListChecks className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="truncate text-[13px] font-bold leading-5 text-slate-800 dark:text-slate-100 sm:text-sm">Document: {job.document_id.slice(0, 8)}…</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : job.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{job.status}</span>
                    {(job.status === 'FAILED' || job.status === 'OCR_REQUIRED') && (
                      <button onClick={() => retry(job)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200"><RotateCw className="h-3 w-3" /> Retry</button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">{job.current_step ?? job.status} • {job.processed_chunks}/{job.total_chunks} chunks</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full bg-emerald-600 transition-[width]" style={{ width: `${job.progress}%` }} />
                </div>
                {job.error_message && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-50 p-1.5 text-[11px] font-semibold leading-4 text-red-700 dark:bg-red-950/30">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {job.error_message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

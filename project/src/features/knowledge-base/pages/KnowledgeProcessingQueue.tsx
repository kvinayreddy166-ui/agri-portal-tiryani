import React, { useCallback, useEffect, useState } from 'react';
import { ListChecks, Loader2, RefreshCw, AlertTriangle, RotateCw } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { fetchProcessingJobs, processDocument } from '../services/knowledgeService';
import type { ProcessingJob } from '../types';

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
        actions={<button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>} />
      <KnowledgeNav isAdmin={isAdminUser} />

      {loading && jobs.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
      ) : jobs.length === 0 ? (
        <div className="portal-card modern-card p-10 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-500">No processing jobs yet. Upload a document to begin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="portal-card modern-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">Document: {job.document_id.slice(0, 8)}…</p>
                  <p className="text-xs text-slate-500">{job.current_step ?? job.status} • {job.processed_chunks}/{job.total_chunks} chunks</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : job.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{job.status}</span>
                  {(job.status === 'FAILED' || job.status === 'OCR_REQUIRED') && (
                    <button onClick={() => retry(job)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-200"><RotateCw className="h-3 w-3" /> Retry</button>
                  )}
                </div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-emerald-600 transition-all" style={{ width: `${job.progress}%` }} />
              </div>
              {job.error_message && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700 dark:bg-red-950/30">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {job.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

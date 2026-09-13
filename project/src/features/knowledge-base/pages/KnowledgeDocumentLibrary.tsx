import React, { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Loader2, RefreshCw, Eye, Power, PowerOff, Trash2, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { useKnowledgeNav } from '../hooks/useKnowledgeNav';
import {
  deleteDocument,
  fetchDocuments,
  toggleDocumentActive,
} from '../services/knowledgeService';
import { DOCUMENT_TYPES, type DocumentType, type KnowledgeDocument } from '../types';
import { formatFileSize } from '../utils';
import { StatusBadge } from './KnowledgeDashboard';

export function KnowledgeDocumentLibrary() {
  const { isAdminUser } = useAuth();
  const go = useKnowledgeNav();
  const toast = useToast();

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { documents: docs, total: t } = await fetchDocuments({
        page, pageSize, search: search || undefined, status: statusFilter || undefined,
        documentType: (typeFilter || undefined) as DocumentType | undefined, includeInactive: true,
      });
      setDocuments(docs);
      setTotal(t);
    } catch (e) {
      toast.showReset('Load failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, typeFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!confirm(`Delete "${doc.title}"? This removes it from the Knowledge Base (chunks are removed).`)) return;
    try {
      await deleteDocument(doc.id);
      toast.showDeleted('Document deleted', doc.title);
      load();
    } catch (e) {
      toast.showReset('Delete failed', (e as Error).message);
    }
  };

  const handleToggle = async (doc: KnowledgeDocument) => {
    try {
      await toggleDocumentActive(doc.id, !doc.is_active);
      toast.showSuccess(doc.is_active ? 'Document deactivated' : 'Document activated', doc.title);
      load();
    } catch (e) {
      toast.showReset('Update failed', (e as Error).message);
    }
  };

  if (!isAdminUser) {
    return <div className="portal-card modern-card p-6 text-center font-bold text-slate-600">Admin access required.</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Knowledge Base" title="Document Library" description="Manage all documents in the Knowledge Base." />
      <KnowledgeNav isAdmin={isAdminUser} />

      <div className="portal-card modern-card mb-3 flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-300 px-2 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900">
          <option value="">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="OCR_REQUIRED">OCR Required</option>
          <option value="UPLOADED">Uploaded</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-300 px-2 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900">
          <option value="">All types</option>
          {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={load} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="portal-card modern-card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
        ) : documents.length === 0 ? (
          <div className="p-10 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-500">No documents have been added to the Knowledge Base yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <tr>
                  <th className="p-3">Document</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Authority</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Chunks</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800 dark:text-slate-100">{d.title}</p>
                          <p className="truncate text-xs text-slate-400">{d.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-semibold">{d.document_type}</td>
                    <td className="p-3 text-xs font-semibold">{d.authority ?? '—'}</td>
                    <td className="p-3 text-xs font-semibold">{d.document_date ?? '—'}</td>
                    <td className="p-3 text-xs font-semibold">{d.chunk_count ?? 0}</td>
                    <td className="p-3 text-xs font-semibold">{formatFileSize(d.file_size)}</td>
                    <td className="p-3"><StatusBadge status={d.status} /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <IconBtn title="View" onClick={() => go('viewer', { documentId: d.id })}><Eye className="h-4 w-4" /></IconBtn>
                        <IconBtn title={d.is_active ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(d)}>
                          {d.is_active ? <PowerOff className="h-4 w-4 text-amber-600" /> : <Power className="h-4 w-4 text-green-600" />}
                        </IconBtn>
                        <IconBtn title="Delete" onClick={() => handleDelete(d)}><Trash2 className="h-4 w-4 text-red-600" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > pageSize && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-bold text-slate-600">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick} className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800">
      {children}
    </button>
  );
}

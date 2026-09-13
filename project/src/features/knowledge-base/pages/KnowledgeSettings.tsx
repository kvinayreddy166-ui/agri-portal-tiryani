import React, { useEffect, useState } from 'react';
import { Settings, Loader2, Plus, Trash2, Lightbulb } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { createSuggestedQuestion, deleteSuggestedQuestion, fetchAllSuggestedQuestions } from '../services/knowledgeService';
import type { SuggestedQuestion } from '../types';

export function KnowledgeSettings() {
  const { isAdminUser } = useAuth();
  const toast = useToast();
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQ, setNewQ] = useState('');
  const [newCat, setNewCat] = useState('');

  const load = async () => {
    setLoading(true);
    try { setQuestions(await fetchAllSuggestedQuestions()); } catch (e) { toast.showReset('Load failed', (e as Error).message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newQ.trim()) return;
    try {
      await createSuggestedQuestion({ question: newQ.trim(), category: newCat.trim() || undefined });
      setNewQ(''); setNewCat('');
      toast.showSuccess('Suggested question added');
      load();
    } catch (e) { toast.showReset('Add failed', (e as Error).message); }
  };

  const remove = async (q: SuggestedQuestion) => {
    try { await deleteSuggestedQuestion(q.id); toast.showDeleted('Removed', q.question); load(); } catch (e) { toast.showReset('Delete failed', (e as Error).message); }
  };

  if (!isAdminUser) return <div className="portal-card modern-card p-6 text-center font-bold text-slate-600">Admin access required.</div>;

  return (
    <div>
      <PageHeader eyebrow="Knowledge Base" title="Settings" description="Manage suggested questions shown to users in the Knowledge Assistant." />
      <KnowledgeNav isAdmin={isAdminUser} />

      <div className="portal-card modern-card mb-4 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300"><Lightbulb className="h-4 w-4" /> Add Suggested Question</h3>
        <div className="flex flex-wrap gap-2">
          <input className="min-w-[200px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900" placeholder="Question text" value={newQ} onChange={(e) => setNewQ(e.target.value)} />
          <input className="w-40 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900" placeholder="Category (optional)" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"><Plus className="h-4 w-4" /> Add</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className="portal-card modern-card flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{q.question}</p>
                {q.category && <p className="text-xs text-slate-500">{q.category}</p>}
              </div>
              <button onClick={() => remove(q)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="portal-card modern-card mt-6 p-4 text-xs font-semibold text-slate-500">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase text-emerald-700 dark:text-emerald-300"><Settings className="h-4 w-4" /> AI Provider Configuration</h3>
        <p>The Knowledge Base uses a free-first AI provider (Ollama by default). Configuration is server-side via Supabase secrets:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><code>OLLAMA_BASE_URL</code> — base URL of your Ollama server</li>
          <li><code>OLLAMA_CHAT_MODEL</code> — chat model (default: llama3.2)</li>
          <li><code>OLLAMA_EMBEDDING_MODEL</code> — embedding model (default: bge-m3, 1024 dims)</li>
          <li><code>RAG_EMBEDDING_DIM</code> — must match the embedding model dimension</li>
        </ul>
        <p className="mt-2">If Ollama is unavailable, keyword search still works and the assistant returns retrieved sources without an AI answer.</p>
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Search as SearchIcon, Loader2, FileText, BookOpen } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { useKnowledgeNav } from '../hooks/useKnowledgeNav';
import { fetchCategories, searchKnowledge } from '../services/knowledgeService';
import type { KnowledgeCategory, RetrievedChunk, SearchFilters } from '../types';

export function KnowledgeSearch() {
  const { isAdminUser } = useAuth();
  const go = useKnowledgeNav();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'keyword' | 'semantic' | 'hybrid'>('hybrid');
  const [results, setResults] = useState<RetrievedChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => { fetchCategories().then(setCategories).catch(() => {}); }, []);

  const run = useCallback(async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setQuery(text);
    setLoading(true);
    setSearched(true);
    try {
      const filters: SearchFilters = categoryFilter ? { category: categoryFilter } : {};
      const res = await searchKnowledge(text, filters, mode, 10);
      setResults(res.chunks);
    } catch (e) {
      console.warn('search failed', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, mode, categoryFilter]);

  return (
    <div>
      <PageHeader eyebrow="Knowledge Base" title="Search Documents" description="Find exact text with keyword search or meaning-based semantic search." />
      <KnowledgeNav isAdmin={isAdminUser} />

      <div className="portal-card modern-card mb-3 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <SearchIcon className="absolute left-2 top-3 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-8 pr-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
              placeholder="e.g. Form D, Section 7, FCO 1985, seed licence..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
            />
          </div>
          <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="rounded-xl border border-slate-300 px-2 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">
            <option value="hybrid">Hybrid</option>
            <option value="keyword">Keyword</option>
            <option value="semantic">Semantic</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-slate-300 px-2 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => run()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />} Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
      ) : searched && results.length === 0 ? (
        <div className="portal-card modern-card p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-500">No relevant documents were found. Try different keywords or another search mode.</p>
        </div>
      ) : !searched ? null : (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.chunkId} className="portal-card modern-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button onClick={() => go('viewer', { documentId: r.documentId, page: r.pageNumber ?? 1 })} className="flex items-center gap-2 text-left">
                    <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="truncate font-bold text-emerald-800 hover:underline dark:text-emerald-300">{r.documentTitle}</span>
                  </button>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {r.documentType}
                    {r.pageNumber && ` · Page ${r.pageNumber}${r.pageEndNumber && r.pageEndNumber !== r.pageNumber ? `-${r.pageEndNumber}` : ''}`}
                    {r.sectionHeading && ` · ${r.sectionHeading}`}
                    {r.referenceNumber && ` · ${r.referenceNumber}`}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{(r.combinedScore * 100).toFixed(0)}%</span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm font-medium text-slate-600 dark:text-slate-300">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

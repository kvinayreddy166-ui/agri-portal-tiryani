import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Send, Loader2, Search, Sparkles, ThumbsUp, ThumbsDown, FileText, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { useKnowledgeNav } from '../hooks/useKnowledgeNav';
import { askQuestion, fetchCategories, fetchSuggestedQuestions, qualityLabel, submitFeedback } from '../services/knowledgeService';
import type { AskResult, KnowledgeCategory, SuggestedQuestion } from '../types/index';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  result?: AskResult;
  feedback?: 'helpful' | 'not_helpful';
}

const QUALITY_STYLE: Record<string, { dot: string; text: string }> = {
  STRONG: { dot: 'bg-green-500', text: 'text-green-700 dark:text-green-300' },
  PARTIAL: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  LIMITED: { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  NONE: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
};

export function KnowledgeAssistant() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const go = useKnowledgeNav();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [suggested, setSuggested] = useState<SuggestedQuestion[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuggestedQuestions().then(setSuggested).catch(() => {});
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  const ask = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);
    setStatus(t('Searching Knowledge Base...', 'నాలెడ్జ్ బేస్‌లో వెతుకుతోంది...'));
    try {
      const filters = categoryFilter ? { category: categoryFilter } : {};
      setStatus(t('Found relevant documents. Generating answer...', 'సంబంధిత పత్రాలు లభించాయి. సమాధానాన్ని రూపొందిస్తోంది...'));
      const result = await askQuestion(trimmed, filters);
      setMessages((prev) => [...prev, { role: 'assistant', text: result.answer, result }]);
      setStatus('');
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', text: t(`Sorry, something went wrong: ${(e as Error).message}`, `క్షమించండి, లోపం సంభవించింది: ${(e as Error).message}`) }]);
      setStatus('');
    } finally {
      setLoading(false);
    }
  }, [loading, categoryFilter, t]);

  const handleFeedback = async (msgIndex: number, feedback: 'helpful' | 'not_helpful', result: AskResult) => {
    try {
      await submitFeedback(result.queryId, feedback);
      setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, feedback } : m)));
      toast.showSuccess(t('Thank you for your feedback', 'మీ అభిప్రాయానికి ధన్యవాదాలు'));
    } catch (e) {
      toast.showReset(t('Feedback failed', 'అభిప్రాయం సమర్పణ విఫలమైంది'), (e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="AGRONIX" title={t('Knowledge Assistant', 'నాలెడ్జ్ అసిస్టెంట్')} description={t('Ask questions from official Acts, Rules, Circulars, Government Orders and Department Documents.', 'అధికారిక చట్టాలు, నిబంధనలు, సర్క్యులర్లు, జీవోలు మరియు శాఖ పత్రాల నుండి ప్రశ్నలు అడగండి.')} />
      <KnowledgeNav isAdmin={isAdminUser} />

      <div className="portal-card modern-card mb-3 flex flex-wrap items-center gap-2 p-2">
        <Search className="h-4 w-4 text-slate-400" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
          <option value="">{t('All categories', 'అన్ని వర్గాలు')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div ref={scrollRef} className="portal-card modern-card mb-3 max-h-[55vh] min-h-[300px] overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <BookOpen className="h-12 w-12 text-emerald-500" />
            <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">{t('Ask a question about official agriculture documents.', 'అధికారిక వ్యవసాయ పత్రాల గురించి ప్రశ్న అడగండి.')}</p>
            <div className="mt-4 grid w-full max-w-md gap-2 sm:grid-cols-2">
              {suggested.slice(0, 6).map((s) => (
                <button key={s.id} onClick={() => ask(s.question)} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {s.question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase opacity-70">
                    {m.role === 'user' ? t('You', 'మీరు') : <><Sparkles className="h-3 w-3" /> AGRONIX</>}
                  </div>
                  <div className="whitespace-pre-wrap font-semibold leading-relaxed">{m.text}</div>

                  {m.result && m.result.citations.length > 0 && (
                    <div className="mt-3 border-t border-black/10 pt-2">
                      <p className="mb-1 text-[10px] font-black uppercase opacity-70">{t('Sources', 'మూలాలు')}</p>
                      <div className="space-y-1.5">
                        {m.result.citations.map((c) => (
                          <button key={c.sourceId} onClick={() => go('viewer', { documentId: c.documentId, page: c.pageNumber ?? 1 })} className="flex w-full items-start gap-2 rounded-lg bg-white/70 p-2 text-left text-xs font-semibold hover:bg-white dark:bg-slate-900/50">
                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="min-w-0">
                              <span className="font-bold">{c.sourceId} · {c.documentTitle}</span>
                              {c.pageNumber && <span className="opacity-70"> — {t('Page', 'పేజీ')} {c.pageNumber}{c.pageEndNumber && c.pageEndNumber !== c.pageNumber ? `-${c.pageEndNumber}` : ''}</span>}
                              {c.sectionHeading && <span className="opacity-70"> · {c.sectionHeading}</span>}
                              {c.referenceNumber && <span className="opacity-70"> · {c.referenceNumber}</span>}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.result && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${QUALITY_STYLE[m.result.retrievalQuality]?.text ?? ''}`}>
                        <span className={`h-2 w-2 rounded-full ${QUALITY_STYLE[m.result.retrievalQuality]?.dot ?? ''}`} />
                        {qualityLabel(m.result.retrievalQuality)}
                      </span>
                      {m.role === 'assistant' && m.result.retrievalQuality !== 'NONE' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleFeedback(i, 'helpful', m.result!)} className={`rounded-lg p-1 ${m.feedback === 'helpful' ? 'bg-green-200 text-green-700' : 'hover:bg-white/50'}`} title={t('Helpful', 'సహాయకరం')}><ThumbsUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleFeedback(i, 'not_helpful', m.result!)} className={`rounded-lg p-1 ${m.feedback === 'not_helpful' ? 'bg-red-200 text-red-700' : 'hover:bg-white/50'}`} title={t('Not helpful', 'సహాయకరం కాదు')}><ThumbsDown className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> {status}
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="portal-card modern-card flex items-center gap-2 p-2"
      >
        <input
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
          placeholder={t('Ask about Acts, Rules, Circulars...', 'చట్టాలు, నిబంధనలు, సర్క్యులర్ల గురించి అడగండి...')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t('Send', 'పంపండి')}
        </button>
      </form>

      <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
        <AlertTriangle className="mr-1 inline h-3 w-3" />
        {t('Information is based on documents in the AGRONIX Knowledge Base. Verify the latest official document before taking statutory or legal action.', 'సమాచారం AGRONIX నాలెడ్జ్ బేస్‌లోని పత్రాలపై ఆధారపడి ఉంటుంది. చట్టపరమైన లేదా నియంత్రణ చర్యలు తీసుకునే ముందు తాజా అధికారిక పత్రాన్ని పరిశీలించండి.')}
      </p>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}

import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileText,
  FlaskConical,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { fcoClauseCards, type FcoClause, type FcoClauseCard } from '../data/fcoClauses';
import { fertilizerForms, type FertilizerFormEntry } from '../../sampling-hub/data/fertilizerForms';
import { fertilizerSchedules } from '../../sampling-hub/data/fertilizerSchedules';
import { safeStorage } from '../../../shared/lib/safeStorage';
import { useLanguage } from '../../../shared/context/LanguageContext';

export type FcoExplorerSection = 'clauses' | 'forms' | 'schedules' | 'duties';

type TaskShortcut = {
  id: string;
  label: string;
  icon: React.ElementType;
  action: 'clauses' | 'forms' | 'duties' | 'card';
  cardId?: string;
};

const SUGGESTED_SEARCHES = ['stop sale', 'dealer registration', 'drawal of sample', 'Form O', 'non-standard fertiliser', 'price display', 'inspector powers', 'seizure'];
const RECENT_KEY = 'fco-explorer-recent-searches';
const RESULT_LIMIT = 6;

type ResultKind = 'clauses' | 'definitions' | 'forms' | 'schedules';

function clauseSearchText(clause: FcoClause) {
  return [clause.clauseNo, clause.clauseLabel, clause.title, clause.category, clause.summary, clause.legalText, clause.plainEnglish, clause.keywords.join(' ')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function readRecentSearches(): string[] {
  try {
    const parsed = JSON.parse(safeStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as string[]).filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function FcoExplorer({
  onOpenCard,
  onOpenSection,
  onViewForm,
}: {
  onOpenCard: (cardId: string) => void;
  onOpenSection: (section: FcoExplorerSection, presetSearch?: string) => void;
  onViewForm: (form: FertilizerFormEntry) => void;
}) {
  const { t } = useLanguage();
  const [term, setTerm] = useState('');
  const [kind, setKind] = useState<'all' | ResultKind>('all');
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches());
  const searchRef = useRef<HTMLInputElement>(null);

  const taskShortcuts: TaskShortcut[] = useMemo(() => [
    { id: 'find-clause', label: t('Find a Clause', 'క్లాజును వెతకండి'), icon: Search, action: 'clauses' },
    { id: 'inspector-powers', label: t('Inspector Powers', 'ఇన్‌స్పెక్టర్ అధికారాలు'), icon: ShieldCheck, action: 'card', cardId: 'card-enforcement' },
    { id: 'draw-sample', label: t('Draw a Sample', 'నమూనా సేకరణ'), icon: FlaskConical, action: 'card', cardId: 'card-sample-analysis' },
    { id: 'dealer-check', label: t('Check Dealer Requirements', 'డీలర్ నిబంధనలు'), icon: Store, action: 'card', cardId: 'card-dealer-registration' },
    { id: 'find-form', label: t('Find a Form', 'ఫారమ్‌ను వెతకండి'), icon: FileText, action: 'forms' },
    { id: 'product-req', label: t('Check Product Requirements', 'ఉత్పత్తి నిబంధనలు'), icon: PackageCheck, action: 'card', cardId: 'card-restrictions' },
    { id: 'enforcement', label: t('Enforcement Procedure', 'అమలు ప్రక్రియ'), icon: ClipboardList, action: 'duties' },
    { id: 'browse', label: t('Browse Full Order', 'పూర్తి ఉత్తర్వును చూడండి'), icon: BookOpen, action: 'clauses' },
  ], [t]);

  const resultFilters = useMemo(() => [
    { id: 'all' as const, label: t('All', 'అన్నీ') },
    { id: 'clauses' as const, label: t('Clauses', 'క్లాజులు') },
    { id: 'definitions' as const, label: t('Definitions', 'నిర్వచనాలు') },
    { id: 'forms' as const, label: t('Forms', 'ఫారాలు') },
    { id: 'schedules' as const, label: t('Schedules', 'షెడ్యూళ్లు') },
  ], [t]);

  const query = term.trim().toLowerCase();

  const clauseResults = useMemo(() => {
    if (!query) return [] as Array<{ card: FcoClauseCard; clause: FcoClause }>;
    const hits: Array<{ card: FcoClauseCard; clause: FcoClause }> = [];
    fcoClauseCards.forEach((card) => {
      card.clauses.forEach((clause) => {
        if (clauseSearchText(clause).includes(query)) hits.push({ card, clause });
      });
    });
    return hits;
  }, [query]);

  const definitionResults = useMemo(
    () => clauseResults.filter(({ card }) => card.id === 'card-title-definitions'),
    [clauseResults]
  );
  const clauseOnlyResults = useMemo(
    () => clauseResults.filter(({ card }) => card.id !== 'card-title-definitions'),
    [clauseResults]
  );

  const formResults = useMemo(() => {
    if (!query) return [] as FertilizerFormEntry[];
    return fertilizerForms.filter((form) =>
      [form.formNo, form.title, form.category, form.clause, form.description, form.keywords.join(' ')].filter(Boolean).join(' ').toLowerCase().includes(query)
    );
  }, [query]);

  const scheduleResults = useMemo(() => {
    if (!query) return [] as typeof fertilizerSchedules;
    return fertilizerSchedules.filter((schedule) =>
      [schedule.scheduleNo, schedule.title, schedule.subtitle, schedule.parts.map((p) => p.label).join(' '), schedule.keywords.join(' ')].join(' ').toLowerCase().includes(query)
    );
  }, [query]);

  const saveRecent = (value: string) => {
    const next = [value, ...recent.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 5);
    setRecent(next);
    try { safeStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const pickSearchTerm = (value: string) => {
    setTerm(value);
    saveRecent(value);
    searchRef.current?.focus();
  };


  const showResults = query.length >= 2;
  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const handleTask = (task: TaskShortcut) => {
    if (task.action === 'card' && task.cardId) return onOpenCard(task.cardId);
    onOpenSection(task.action === 'card' ? 'clauses' : task.action);
  };

  return (
    <section className="space-y-4">
      {/* Search & Quick Access Guide */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('FCO Quick Search & Navigator', 'FCO త్వరిత శోధన & నావిగేటర్')}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('Instantly find statutory clauses, specifications, official forms, and inspection duties.', 'చట్టబద్ధమైన క్లాజులు, ప్రమాణాలు, అధికారిక ఫారాలు మరియు తనిఖీ విధులను తక్షణమే కనుగొనండి.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenSection('clauses')}
              className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800"
            >
              {t('39 Clauses', '39 క్లాజులు')}
            </button>
            <button
              type="button"
              onClick={() => onOpenSection('forms')}
              className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800"
            >
              {t('28 Forms', '28 ఫారాలు')}
            </button>
            <button
              type="button"
              onClick={() => onOpenSection('schedules')}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800"
            >
              {t('VIII Schedules', 'VIII షెడ్యూళ్లు')}
            </button>
          </div>
        </div>

        <div className="relative mt-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-indigo-950/40">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && term.trim()) saveRecent(term.trim()); }}
              placeholder={t('Search clauses, sections, keywords...', 'క్లాజులు, సెక్షన్లు, కీలకపదాలను వెతకండి...')}
              className="w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
            {term && (
              <button type="button" onClick={() => setTerm('')} aria-label={t('Clear search', 'శోధనను క్లియర్ చేయండి')} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={() => term.trim() && saveRecent(term.trim())} aria-label={t('Search', 'శోధించండి')} className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-black text-white transition hover:bg-indigo-700 sm:px-3">
              <Search className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">{t('Search', 'వెతకండి')}</span>
            </button>
          </div>

          {/* Recent + suggested */}
          {!showResults && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {recent.length > 0 && (
                <>
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('Recent:', 'ఇటీవలివి:')}</span>
                  {recent.map((item) => (
                    <button key={item} type="button" onClick={() => pickSearchTerm(item)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {item}
                    </button>
                  ))}
                  <span className="mx-1 h-3 w-px bg-slate-200 dark:bg-slate-700" />
                </>
              )}
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('Try:', 'ఉదాహరణ:')}</span>
              {SUGGESTED_SEARCHES.slice(0, 5).map((item) => (
                <button key={item} type="button" onClick={() => pickSearchTerm(item)} className="rounded-full border border-indigo-100 bg-indigo-50/60 px-2.5 py-1 text-[10px] font-bold text-indigo-700 transition hover:border-indigo-300 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
                  {item}
                </button>
              ))}
            </div>
          )}

          {/* Grouped results */}
          {showResults && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2 dark:border-slate-800">
                {resultFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setKind(filter.id)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black transition ${
                      kind === filter.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {(kind === 'all' || kind === 'definitions') && definitionResults.length > 0 && (
                  <ResultGroup title={t('Definitions', 'నిర్వచనాలు')}>
                    {definitionResults.slice(0, RESULT_LIMIT).map(({ card, clause }) => (
                      <ResultRow
                        key={clause.id}
                        chip={t('Definition', 'నిర్వచనం')}
                        title={`${clause.clauseLabel ?? 'Clause'} ${clause.clauseNo} — ${clause.title}`}
                        context={clause.plainEnglish || clause.summary}
                        onOpen={() => { saveRecent(term.trim()); onOpenCard(card.id); }}
                      />
                    ))}
                  </ResultGroup>
                )}
                {(kind === 'all' || kind === 'clauses') && clauseOnlyResults.length > 0 && (
                  <ResultGroup title={t('Clauses', 'క్లాజులు')}>
                    {clauseOnlyResults.slice(0, RESULT_LIMIT).map(({ card, clause }) => (
                      <ResultRow
                        key={clause.id}
                        chip={card.cardTitle}
                        title={`${clause.clauseLabel ?? 'Clause'} ${clause.clauseNo} — ${clause.title}`}
                        context={clause.plainEnglish || clause.summary}
                        onOpen={() => { saveRecent(term.trim()); onOpenCard(card.id); }}
                      />
                    ))}
                  </ResultGroup>
                )}
                {(kind === 'all' || kind === 'forms') && formResults.length > 0 && (
                  <ResultGroup title={t('Forms', 'ఫారాలు')}>
                    {formResults.slice(0, RESULT_LIMIT).map((form) => (
                      <ResultRow
                        key={form.id}
                        chip={form.category}
                        title={`${form.formNo} — ${form.title}`}
                        context={form.description}
                        onOpen={() => { saveRecent(term.trim()); onViewForm(form); }}
                      />
                    ))}
                  </ResultGroup>
                )}
                {(kind === 'all' || kind === 'schedules') && scheduleResults.length > 0 && (
                  <ResultGroup title={t('Schedules', 'షెడ్యూళ్లు')}>
                    {scheduleResults.slice(0, RESULT_LIMIT).map((schedule) => (
                      <ResultRow
                        key={schedule.id}
                        chip={t('Schedule', 'షెడ్యూల్')}
                        title={`${schedule.scheduleNo} — ${schedule.title}`}
                        context={schedule.subtitle}
                        onOpen={() => { saveRecent(term.trim()); onOpenSection('schedules', schedule.title); }}
                      />
                    ))}
                  </ResultGroup>
                )}
                {clauseResults.length === 0 && formResults.length === 0 && scheduleResults.length === 0 && (
                  <p className="p-4 text-center text-xs font-semibold text-slate-500">
                    {t('No matches — try a clause number, keyword or form name.', 'సరిపోలినవి ఏవీ లేవు — క్లాజు నంబర్, కీలకపదం లేదా ఫారమ్ పేరుతో వెతకండి.')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hero actions */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { label: t('Search FCO', 'FCO శోధన'), icon: Search, run: focusSearch, primary: true },
            { label: t('Clauses', 'క్లాజులు'), icon: BookOpen, run: () => onOpenSection('clauses') },
            { label: t('Forms', 'ఫారాలు'), icon: FileText, run: () => onOpenSection('forms') },
            { label: t('Schedules', 'షెడ్యూళ్లు'), icon: ClipboardList, run: () => onOpenSection('schedules') },
            { label: t('Powers & Duties', 'అధికారాలు & విధులు'), icon: ShieldCheck, run: () => onOpenSection('duties') },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.run}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black transition ${
                action.primary
                  ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-700'
              }`}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* What do you want to do? */}
      <div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{t('What do you want to do?', 'మీరు ఏమి చేయాలనుకుంటున్నారు?')}</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {taskShortcuts.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => handleTask(task)}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition group-hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/50">
                <task.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-[11px] font-bold leading-tight text-slate-800 dark:text-slate-200">{task.label}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-wide text-slate-400">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultRow({ chip, title, context, openLabel, onOpen }: { chip: string; title: string; context?: string; openLabel?: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col items-start gap-1.5 rounded-lg p-2 text-left transition hover:bg-indigo-50 sm:flex-row sm:items-center sm:gap-2.5 dark:hover:bg-slate-800"
    >
      <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800/60">{chip}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-slate-800 sm:truncate dark:text-slate-100">{title}</span>
        {context && <span className="block text-[10px] font-medium text-slate-500 sm:truncate dark:text-slate-400">{context}</span>}
      </span>
      <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-indigo-600 opacity-0 transition group-hover:opacity-100 dark:text-indigo-300">{openLabel || 'Open'}</span>
    </button>
  );
}

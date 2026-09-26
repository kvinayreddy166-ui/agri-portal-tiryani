import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronDown,
  Clock,
  Copy,
  FileSearch,
  FileText,
  ClipboardList,
  FlaskConical,
  IndianRupee,
  ListOrdered,
  Microscope,
  Network,
  PackageCheck,
  Printer,
  Scale,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SprayCan,
  Sprout,
  Store,
  Truck,
  FileSpreadsheet,
} from 'lucide-react';
import { fcoOffenceEntries, type FcoOffenceEntry } from '../data/fcoOffencesData';
import { type LegalCategory } from '../data/legalReadyReckonerData';
import { fcoClauseCards, validateFcoClauseCoverage, type FcoClause, type FcoClauseCard, type FcoTabId, type FcoVariationNote } from '../data/fcoClauses';
import { fertilizerFormCategories, fertilizerForms, type FertilizerFormCategory, type FertilizerFormEntry } from '../../../data/fertilizerForms';
import { fertilizerSchedules, type FertilizerScheduleEntry } from '../../../data/fertilizerSchedules';
import { officerWorkflows, stopSaleSeizureMappings } from '../data/stopSaleSeizureData';
import { enforcementDeadlines, enforcementMindMap, type MindMapNode } from '../data/fcoEnforcementMindMap';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { FertilizerFormPdfGenerator } from '../../../components/forms/FertilizerFormPdfGenerator';
import { FcoImplementationModal } from '../../../shared/components/ui/FcoImplementationModal';

type ReckonerView = 'powers' | 'notice';
type MainLegalArea = 'fertilizer' | 'seed' | 'insecticide';
type FertilizerSection = 'clauses' | 'forms' | 'schedules' | 'duties';

const BOOKMARK_KEY = 'agri-legal-reckoner-bookmarks';

const fcoClauseLocationByNo = new Map<string, { clauseId: string; cardId: string }>();
fcoClauseCards.forEach((card) => {
  card.clauses.forEach((clause) => {
    fcoClauseLocationByNo.set(clause.clauseNo.toLowerCase(), { clauseId: clause.id, cardId: card.id });
  });
});

const fcoTabs: Array<{ id: FcoTabId; label: string; icon: typeof Clock }> = [
  { id: 'plainEnglish', label: 'Simple', icon: BookOpen },
  { id: 'fullText', label: 'Full Text', icon: FileText },
  { id: 'officerAction', label: 'Officer Action', icon: ClipboardList },
  { id: 'formsTimelines', label: 'Forms & Timelines', icon: Clock },
];
const legalAreaCards: Array<{
  id: MainLegalArea;
  title: string;
  description: string;
  icon: typeof Scale;
  category: LegalCategory;
  color: string;
  panel: string;
  border: string;
  accent: string;
  chip: string;
  hover: string;
}> = [
  { id: 'fertilizer', title: 'Fertilizer', description: 'FCO 1985, ECA, seizure, samples and prosecution references.', icon: PackageCheck, category: 'Fertiliser', color: 'from-sky-500 via-blue-500 to-indigo-700', panel: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30', border: 'border-sky-200 dark:border-sky-800/50', accent: 'text-sky-700 dark:text-sky-300', chip: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-900', hover: 'hover:border-sky-300 hover:bg-sky-50/60 dark:hover:bg-sky-950/20' },
  { id: 'seed', title: 'Seed', description: 'Seed Act, Rules, labelling, sampling and penalty actions.', icon: Sprout, category: 'Seeds', color: 'from-lime-500 via-green-500 to-emerald-700', panel: 'from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30', border: 'border-lime-200 dark:border-lime-800/50', accent: 'text-lime-700 dark:text-lime-300', chip: 'bg-lime-50 text-lime-700 ring-lime-100 dark:bg-lime-950/30 dark:text-lime-300 dark:ring-lime-900', hover: 'hover:border-lime-300 hover:bg-lime-50/60 dark:hover:bg-lime-950/20' },
  { id: 'insecticide', title: 'Insecticide', description: 'Insecticides Act, Rules, stop-sale, seizure and records.', icon: SprayCan, category: 'Insecticides', color: 'from-red-400 via-rose-500 to-red-700', panel: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30', border: 'border-red-200 dark:border-red-800/50', accent: 'text-red-700 dark:text-red-300', chip: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900', hover: 'hover:border-red-300 hover:bg-red-50/60 dark:hover:bg-red-950/20' },
];

const legalTopicCards: Record<MainLegalArea, Array<{
  title: string;
  description: string;
  icon: typeof Scale;
  category?: LegalCategory;
  view?: ReckonerView;
  query?: string;
}>> = {
  fertilizer: [],
  seed: [],
  insecticide: [],
};

const fcoIconMap = {
  BookOpen,
  IndianRupee,
  Truck,
  Store,
  FlaskConical,
  ShieldAlert,
  ShieldCheck,
  Microscope,
  Scale,
};


function fcoVariationSearchText(note: FcoVariationNote) {
  return [
    note.clause_no,
    note.subclause_no,
    note.title,
    note.existing_pdf2_title,
    note.authentic_pdf1_title,
    note.existing_pdf2_summary,
    note.authentic_pdf1_summary,
    note.variation_type,
    note.variation_description,
    note.officer_action_point,
    note.forms_linked.join(' '),
    note.schedule_linked.join(' '),
    note.authority_responsible,
    note.inspection_action,
    note.admin_action,
    note.legal_action,
    note.telugu_summary,
    note.old_pdf2_clause_no ? `Clause ${note.old_pdf2_clause_no}` : '',
    note.canonical_clause_no ? `Clause ${note.canonical_clause_no}` : '',
    note.search_keywords.join(' '),
    note.tags.join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
}

function fcoClauseSearchText(clause: FcoClause) {
  return [
    `Clause ${clause.clauseNo}`,
    clause.oldPdf2ClauseNo ? `Old PDF-2 Clause ${clause.oldPdf2ClauseNo}` : '',
    clause.canonicalClauseNo ? `Current PDF-1 Clause ${clause.canonicalClauseNo}` : '',
    clause.title,
    clause.category,
    clause.summary,
    clause.legalText,
    clause.plainEnglish,
    clause.forms.join(' '),
    clause.timelines.join(' '),
    clause.keywords.join(' '),
    clause.related.join(' '),
    clause.subClauses.map((item) => `${item.no} ${item.legalText} ${item.plainEnglish}`).join(' '),
    clause.variationNotes?.map(fcoVariationSearchText).join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
}

function fcoCardSearchText(card: FcoClauseCard) {
  return [
    card.cardTitle,
    card.cardNo,
    card.clauseRange,
    card.summary,
    card.contains.join(' '),
    card.clauses.map(fcoClauseSearchText).join(' '),
  ].join(' ').toLowerCase();
}

function normalizeFcoReferenceQuery(value: string) {
  return value.trim().toLowerCase().replace(/^clause\s+/, '').replace(/\s+/g, '');
}

function isFcoExactReferenceQuery(value: string) {
  return /^(clause\s*)?\d+[a-z]*(?:\(\d+[a-z]*\))*$/i.test(value.trim());
}

function fcoClauseMatchesQuery(clause: FcoClause, rawTerm: string) {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return true;

  if (isFcoExactReferenceQuery(term)) {
    const reference = normalizeFcoReferenceQuery(term);
    const clauseNo = clause.clauseNo.toLowerCase();
    if (clauseNo === reference) return true;
    if (clause.oldPdf2ClauseNo?.toLowerCase() === reference) return true;
    if (clause.canonicalClauseNo?.toLowerCase() === reference) return true;
    return clause.subClauses.some((item) => {
      const subClause = item.no.toLowerCase().replace(/^clause\s+/, '').replace(/\s+/g, '');
      return subClause === reference || subClause.startsWith(`${reference}(`);
    });
  }

  return fcoClauseSearchText(clause).includes(term);
}

function filterFcoCardForQuery(card: FcoClauseCard, rawTerm: string): FcoClauseCard | null {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return card;

  const matchingClauses = card.clauses.filter((clause) => fcoClauseMatchesQuery(clause, term));
  if (matchingClauses.length > 0) {
    return {
      ...card,
      clauses: matchingClauses,
      clauseRange: matchingClauses.length === 1 ? `Clause ${matchingClauses[0].clauseNo}` : card.clauseRange,
    };
  }

  if (!isFcoExactReferenceQuery(term) && fcoCardSearchText(card).includes(term)) return card;
  return null;
}

function readBookmarks() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as string[] : [];
  } catch {
    return [];
  }
}

export function ActsAndOrders() {
  const navigate = useNavigate();
  const [view, setView] = useState<ReckonerView>('powers');
  const [selectedLegalArea, setSelectedLegalArea] = useState<MainLegalArea | null>(null);
  const [query, setQuery] = useState('');
  const [, setCategory] = useState<LegalCategory>('Fertiliser');
  const [selectedFcoCardId, setSelectedFcoCardId] = useState<string | null>(null);
  const [fcoActiveTab, setFcoActiveTab] = useState<FcoTabId>('plainEnglish');
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks());
  const [selectedFertilizerForm, setSelectedFertilizerForm] = useState<FertilizerFormEntry | null>(null);
  const [formSearch, setFormSearch] = useState('');
  const [formCategory, setFormCategory] = useState<'All' | FertilizerFormCategory>('All');
  const [fertilizerSection, setFertilizerSection] = useState<FertilizerSection | null>(null);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [showFcoStructureModal, setShowFcoStructureModal] = useState(false);
  const fcoStructureShownRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    validateFcoClauseCoverage();
  }, []);

  const filteredFcoCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return fcoClauseCards
      .map((card) => filterFcoCardForQuery(card, term))
      .filter((card): card is FcoClauseCard => Boolean(card));
  }, [query]);

  const activeFcoCard = useMemo(() => {
    const card = fcoClauseCards.find((item) => item.id === selectedFcoCardId);
    if (!card) return null;
    return filterFcoCardForQuery(card, query.trim().toLowerCase()) || card;
  }, [query, selectedFcoCardId]);

  const toggleBookmark = (entryId: string) => {
    setBookmarks((current) => current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId]);
  };

  const openLegalArea = (area: MainLegalArea) => {
    const areaCard = legalAreaCards.find((item) => item.id === area);
    if (area === 'fertilizer' && !fcoStructureShownRef.current) {
      fcoStructureShownRef.current = true;
      setShowFcoStructureModal(true);
    }
    setSelectedLegalArea(area);
    setView('powers');
    setQuery('');
    setSelectedFcoCardId(null);
    if (areaCard) setCategory(areaCard.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTopic = (topic: (typeof legalTopicCards)[MainLegalArea][number]) => {
    setView(topic.view || 'powers');
    setQuery(topic.query || '');
    setSelectedFcoCardId(null);
    if (topic.category) setCategory(topic.category);
  };

  const closeLegalArea = () => {
    setSelectedLegalArea(null);
    setQuery('');
    setSelectedFcoCardId(null);
    setView('powers');
  };

  const handleBack = () => {
    if (selectedLegalArea === 'fertilizer' && fertilizerSection) {
      setFertilizerSection(null);
      setSelectedFcoCardId(null);
      setSelectedFertilizerForm(null);
      setQuery('');
      return;
    }
    if (selectedLegalArea) {
      closeLegalArea();
      return;
    }
    navigate('/officer-toolkit');
  };

  const activeAreaCard = selectedLegalArea ? legalAreaCards.find((item) => item.id === selectedLegalArea) : null;
  const ActiveAreaIcon = activeAreaCard?.icon || Scale;

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 lg:px-8">
      {!selectedFcoCardId && (
      <section className={`overflow-hidden rounded-2xl border px-4 py-3 text-white shadow-md ${
          activeAreaCard
            ? `border-white/20 bg-gradient-to-br ${activeAreaCard.color}`
            : 'border-emerald-700/40 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 dark:border-emerald-800/50'
        }`}>
          <div className="flex items-center gap-3">
            <BackButton onClick={handleBack} tone="solid" className="self-center" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-sm ring-1 ring-white/30">
                <ActiveAreaIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{activeAreaCard ? 'Acts & Orders' : 'Officer Toolkit'}</p>
                <h1 className="text-lg font-black leading-tight sm:text-xl">{activeAreaCard?.title || 'Acts & Orders'}</h1>
                <p className="text-xs font-semibold text-white/90">
                  {activeAreaCard?.description || 'Search Acts, Rules, Orders, clauses, penal provisions, stop sale, seizure, sampling and notice workflows.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
      {!selectedLegalArea && (
        <LegalAreaOpeningScreen onOpen={openLegalArea} />
      )}

      {selectedLegalArea === 'fertilizer' && !fertilizerSection && (
        <FertilizerModuleHome onOpenSection={setFertilizerSection} />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'clauses' && (
        <FertilizerClausesPanel
          search={query}
          cards={filteredFcoCards}
          activeCard={activeFcoCard}
          activeCardId={selectedFcoCardId}
          activeTab={fcoActiveTab}
          bookmarks={bookmarks}
          onTabChange={setFcoActiveTab}
          onSearchChange={(value) => {
            setQuery(value);
            setSelectedFcoCardId(null);
          }}
          onBackToCards={() => setSelectedFcoCardId(null)}
          onSelectCard={(cardId) => {
            setSelectedFcoCardId(cardId);
            setFcoActiveTab('plainEnglish');
          }}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'forms' && (
        <FertilizerFormsPanel
          search={formSearch}
          category={formCategory}
          onSearchChange={setFormSearch}
          onCategoryChange={setFormCategory}
          onViewForm={setSelectedFertilizerForm}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'schedules' && (
        <FertilizerSchedulesPanel
          search={scheduleSearch}
          onSearchChange={setScheduleSearch}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'duties' && (
        <EnforcementDutiesPanel />
      )}

      {selectedLegalArea && selectedLegalArea !== 'fertilizer' && legalTopicCards[selectedLegalArea].length > 0 && (
        <LegalTopicScreen
          area={selectedLegalArea}
          onOpenTopic={openTopic}
        />
      )}

      {selectedLegalArea && selectedLegalArea !== 'fertilizer' && (
        <>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViewButton active={view === 'powers'} icon={ShieldAlert} label="Stop Sale & Seizure" onClick={() => setView('powers')} area={selectedLegalArea || undefined} />
      </div>

      {view === 'powers' && selectedLegalArea && <PowersSection area={selectedLegalArea} />}
        </>
      )}
      {selectedFertilizerForm && (
        <FertilizerFormPdfGenerator form={selectedFertilizerForm} onClose={() => setSelectedFertilizerForm(null)} />
      )}
      <FcoImplementationModal isOpen={showFcoStructureModal} onClose={() => setShowFcoStructureModal(false)} />
    </div>
  );
}


function FertilizerModuleHome({ onOpenSection }: { onOpenSection: (section: FertilizerSection) => void }) {
  const cards: Array<{ id: FertilizerSection; title: string; subtitle: string; description: string; icon: React.ElementType }> = [
    { id: 'clauses', title: 'Clauses', subtitle: '39 Clauses', description: 'FCO clause cards, sub-clauses, officer action and timelines.', icon: BookOpen },
    { id: 'forms', title: 'Forms', subtitle: '28 Forms', description: 'Registration, manufacturing, sampling and business record forms.', icon: FileText },
    { id: 'schedules', title: 'Schedules', subtitle: '8 Schedules', description: 'Specifications, sampling procedures, tolerance limits and analysis methods.', icon: ClipboardList },
    { id: 'duties', title: 'Enforcement Mind Map', subtitle: 'Duties & powers', description: 'Duties of enforcement officers — authorities, sampling, seizure and prosecution.', icon: Network },
  ];

  return (
    <section className="space-y-2.5 rounded-lg border border-sky-200 bg-white p-3 shadow-sm dark:border-sky-800/50 dark:bg-slate-900">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenSection(card.id)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-sky-800/50 dark:from-sky-950/20 dark:via-slate-950 dark:to-blue-950/20"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-white shadow-sm transition group-hover:scale-105">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/60">{card.subtitle}</span>
              </div>
              <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{card.title}</h3>
              <p className="mt-0.5 line-clamp-2 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{card.description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-sky-700 transition group-hover:gap-1.5 dark:text-sky-300">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}



function FertilizerSectionBadge({ icon: Icon, label, meta, tone = 'gradient' }: { icon: React.ElementType; label: string; meta?: string; tone?: 'gradient' | 'onGradient' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-md ${
      tone === 'gradient'
        ? 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white shadow-sky-500/25'
        : 'bg-white/20 text-white ring-1 ring-white/30 shadow-none'
    }`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
      {meta && <span className="rounded-full bg-white/25 px-1.5 py-px text-[9px] normal-case tracking-normal">{meta}</span>}
    </span>
  );
}

function FertilizerClausesPanel({
  search,
  cards,
  activeCard,
  activeCardId,
  activeTab,
  bookmarks,
  onSearchChange,
  onTabChange,
  onBackToCards,
  onSelectCard,
  onToggleBookmark,
}: {
  search: string;
  cards: FcoClauseCard[];
  activeCard: FcoClauseCard | null;
  activeCardId: string | null;
  activeTab: FcoTabId;
  bookmarks: string[];
  onSearchChange: (value: string) => void;
  onTabChange: (tab: FcoTabId) => void;
  onBackToCards: () => void;
  onSelectCard: (cardId: string) => void;
  onToggleBookmark: (id: string) => void;
}) {
  if (activeCard) {
    return (
      <FcoCardDetailPage
        card={activeCard}
        activeTab={activeTab}
        bookmarks={bookmarks}
        onBack={onBackToCards}
        onToggleBookmark={onToggleBookmark}
        onTabChange={onTabChange}
        onOpenRelated={(target) => {
          onSelectCard(target.cardId);
          window.setTimeout(() => {
            document.getElementById(`fco-clause-${target.clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <FertilizerSectionBadge icon={BookOpen} label="Clauses" />
      <div className="rounded-lg border border-sky-200 bg-white p-3 shadow-sm dark:border-sky-800/50 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search Clause 28, 28(2), stop sale, Form J, Schedule II..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>
      {cards.length > 0 ? (
        <FcoDashboardCards
          cards={cards}
          activeCardId={activeCardId}
          showFormsCard={false}
          onOpenForms={() => undefined}
          onSelect={onSelectCard}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-sky-200 p-8 text-center text-sm font-semibold text-slate-500 dark:border-sky-800/50">No clauses found</p>
      )}
    </section>
  );
}

function scheduleSearchText(schedule: FertilizerScheduleEntry) {
  return [schedule.scheduleNo, schedule.title, schedule.subtitle, schedule.parts.map((part) => part.label).join(' '), schedule.keywords.join(' ')].join(' ').toLowerCase();
}

function FertilizerSchedulesPanel({ search, onSearchChange }: { search: string; onSearchChange: (value: string) => void }) {
  const term = search.trim().toLowerCase();
  const visibleSchedules = fertilizerSchedules.filter((schedule) => !term || scheduleSearchText(schedule).includes(term));

  return (
    <section className="space-y-3">
      <FertilizerSectionBadge icon={ClipboardList} label="Schedules" />
      <div className="rounded-lg border border-sky-200 bg-white p-3 shadow-sm dark:border-sky-800/50 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search schedule, part, sampling, tolerance, biofertiliser..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div className="mt-2.5 flex justify-end">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-black text-sky-800 ring-1 ring-sky-100 dark:bg-sky-950/30 dark:text-sky-200 dark:ring-sky-900">
            {visibleSchedules.length} schedules
          </span>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {visibleSchedules.map((schedule) => (
          <details key={schedule.id} className="group overflow-hidden rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-sky-800/50 dark:from-sky-950/20 dark:via-slate-950 dark:to-blue-950/20">
            <summary className="flex cursor-pointer list-none items-start gap-2.5 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-white shadow-sm transition group-hover:scale-105">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">{schedule.scheduleNo}</p>
                <h3 className="mt-0.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{schedule.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{schedule.subtitle}</p>
              </div>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-sky-700 transition-transform group-open:rotate-180 dark:text-sky-300" />
            </summary>
            <ul className="space-y-1.5 border-t border-sky-100 px-3 pb-3 pt-2.5 dark:border-sky-900/40">
              {schedule.parts.map((part) => (
                <li key={part.id} className="flex items-start gap-2 rounded-md border border-sky-100 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold leading-4 text-slate-700 dark:border-sky-900/40 dark:bg-slate-900/60 dark:text-slate-200">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-blue-500" />
                  {part.label}
                </li>
              ))}
            </ul>
          </details>
        ))}
        {visibleSchedules.length === 0 && (
          <p className="rounded-lg border border-dashed border-sky-200 p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2 dark:border-sky-800/50">No schedules found</p>
        )}
      </div>
    </section>
  );
}

function filterFcoOffences(entries: FcoOffenceEntry[], search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return entries;
  return entries.filter((entry) =>
    [entry.serialNumber, entry.offenceType, entry.contraventionProvision, entry.punishmentProvision, entry.useInField]
      .join(' ')
      .toLowerCase()
      .includes(term)
  );
}

function downloadFcoOffencesCsv(entries: FcoOffenceEntry[]) {
  const rows = [
    ['Sl.No', 'Type of offence', 'Contravention provision', 'Punishment provision under ECA'],
    ...entries.map((entry) => [
      String(entry.serialNumber),
      entry.offenceType,
      entry.contraventionProvision,
      entry.punishmentProvision,
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fco-offences-penal-provisions.csv';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function printFcoOffences(entries: FcoOffenceEntry[]) {
  const popup = window.open('', '_blank', 'width=1100,height=900');
  if (!popup) return;
  popup.document.write(renderFcoOffencesPrintHtml(entries));
  popup.document.close();
  popup.focus();
  popup.print();
}

function LegalAreaOpeningScreen({ onOpen }: { onOpen: (area: MainLegalArea) => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-blue-100 bg-[linear-gradient(135deg,#f7fee7_0%,#ecfdf5_48%,#eff6ff_100%)] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-lg font-black text-blue-950 dark:text-white sm:text-xl">Select input category</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {legalAreaCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpen(card.id)}
              className={`group flex min-h-[7rem] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 ${card.border} bg-gradient-to-br ${card.panel} p-3 text-center shadow-md transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-blue-700 active:scale-[0.98]`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-snug text-slate-950 dark:text-white">{card.title}</span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-700 dark:text-slate-300">{card.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LegalTopicScreen({
  area,
  onOpenTopic,
}: {
  area: MainLegalArea;
  onOpenTopic: (topic: (typeof legalTopicCards)[MainLegalArea][number]) => void;
}) {
  const areaCard = legalAreaCards.find((item) => item.id === area) || legalAreaCards[0];
  const AreaIcon = areaCard.icon;
  const topics = legalTopicCards[area];

  return (
    <section className={`rounded-lg border ${areaCard.border} bg-white p-4 shadow-sm dark:bg-slate-900`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${areaCard.color} text-white shadow-sm`}>
            <AreaIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">{areaCard.title} legal topics</h2>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Tap a topic card, then use search and filters below.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.title}
              type="button"
              onClick={() => onOpenTopic(topic)}
              className={`group rounded-lg border ${areaCard.border} bg-gradient-to-br ${areaCard.panel} p-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 ${areaCard.hover} hover:shadow-md active:scale-[0.99]`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${areaCard.color} text-white shadow-sm transition group-hover:scale-105`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-3 block text-sm font-black text-slate-950 dark:text-white">{topic.title}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{topic.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ViewButton({ active, icon: Icon, label, onClick, area }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void; area?: MainLegalArea }) {
  const theme = legalAreaCards.find((item) => item.id === area) || legalAreaCards[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`agri-input-topic-card group flex min-h-[4.25rem] items-center gap-2.5 rounded-xl border p-2.5 text-left text-sm font-black shadow-sm transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.98] ${
        active
          ? `border-transparent bg-gradient-to-br ${theme.color} text-white shadow-lg`
          : `${theme.border} bg-gradient-to-br ${theme.panel} text-slate-800 ${theme.hover} hover:shadow-md dark:text-slate-200`
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 transition group-hover:scale-105 ${
        active
          ? 'bg-white/20 text-white ring-white/30'
          : theme.chip
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 leading-5">{label}</span>
    </button>
  );
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}




function FcoCardDetailPage({
  card,
  activeTab,
  bookmarks,
  onBack,
  onToggleBookmark,
  onOpenRelated,
  onTabChange,
}: {
  card: FcoClauseCard;
  activeTab: FcoTabId;
  bookmarks: string[];
  onBack: () => void;
  onToggleBookmark: (id: string) => void;
  onOpenRelated: (target: { clauseId: string; cardId: string }) => void;
  onTabChange: (tab: FcoTabId) => void;
}) {
  const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;

  return (
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-md dark:border-slate-700 dark:bg-slate-950">
      <div className="bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 p-3 text-white">
        <div className="mb-2">
          <FertilizerSectionBadge icon={BookOpen} label="Clauses" tone="onGradient" />
        </div>
        <div className="flex items-start gap-2.5">
          <BackButton onClick={onBack} tone="solid" label="Back to cards" className="mt-0.5" />
          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-white/20 p-2 ring-1 ring-white/25">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-white/80">Card {card.cardNo} - {card.clauseRange}</p>
              <h2 className="mt-0.5 text-lg font-black leading-tight">{card.cardTitle}</h2>
              <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-white/90">{card.summary}</p>
            </div>
          </div>
        </div>
      </div>


      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-950">
        {fcoTabs.map((tab) => {
          const TabIcon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black transition ${
                selected
                  ? 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                  : 'border border-sky-200 bg-sky-50/60 text-sky-900 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:bg-sky-950/50'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-2 p-2">
        {card.clauses.map((clause) => (
          <FcoClauseAccordion
            key={clause.id}
            clause={clause}
            activeTab={activeTab}
            bookmarked={bookmarks.includes(clause.id)}
            onToggleBookmark={() => onToggleBookmark(clause.id)}
            onOpenRelated={onOpenRelated}
          />
        ))}
      </div>
    </section>
  );
}

const fcoGlanceChipTones = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  amber: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900',
  emerald: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900',
} as const;

function FcoGlanceChip({ icon: Icon, label, tone = 'slate' }: { icon: typeof Clock; label: string; tone?: keyof typeof fcoGlanceChipTones }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${fcoGlanceChipTones[tone]}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function fcoRealSubClauses(clause: FcoClause) {
  const clauseNo = clause.clauseNo.replace(/\s+/g, '').toLowerCase();
  return clause.subClauses.filter((item) => item.no.replace(/\s+/g, '').toLowerCase() !== clauseNo);
}

function FcoClauseAccordion({ clause, activeTab, bookmarked, onToggleBookmark, onOpenRelated }: { clause: FcoClause; activeTab: FcoTabId; bookmarked: boolean; onToggleBookmark: () => void; onOpenRelated: (target: { clauseId: string; cardId: string }) => void }) {
  const subClauses = fcoRealSubClauses(clause);
  const copyClause = () => navigator.clipboard?.writeText(fcoClauseToText(clause));
  const shareClause = async () => {
    const text = fcoClauseToText(clause);
    if (navigator.share) await navigator.share({ title: `FCO Clause ${clause.clauseNo}`, text });
    else await navigator.clipboard?.writeText(text);
  };

  return (
    <details id={`fco-clause-${clause.id}`} className="group overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm transition duration-300 hover:border-sky-300 hover:shadow-md dark:border-sky-800/50 dark:bg-slate-900" open>
      <summary className="flex cursor-pointer list-none flex-col gap-2 border-b border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 p-2.5 dark:border-sky-900/40 dark:from-sky-950/30 dark:via-slate-900 dark:to-blue-950/30 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Clause {clause.clauseNo} - {clause.category}</p>
          <h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">{clause.title}</h3>
          <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">{clause.summary}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={(event) => { event.preventDefault(); onToggleBookmark(); }} className="rounded-md border border-sky-200 bg-white/80 p-1.5 text-blue-700 transition hover:bg-sky-50 dark:border-sky-800/50 dark:bg-slate-900" aria-label="Bookmark clause">
            {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); copyClause(); }} className="rounded-md border border-sky-200 bg-white/80 p-1.5 text-sky-800 transition hover:bg-sky-50 dark:border-sky-800/50 dark:bg-slate-900 dark:text-sky-200" aria-label="Copy clause">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); void shareClause(); }} className="rounded-md border border-sky-200 bg-white/80 p-1.5 text-sky-800 transition hover:bg-sky-50 dark:border-sky-800/50 dark:bg-slate-900 dark:text-sky-200" aria-label="Share clause">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </summary>
      <div className="space-y-2.5 p-2.5">
        {(subClauses.length > 0 || clause.provisos.length > 0 || clause.forms.length > 0 || clause.timelines.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {subClauses.length > 0 && <FcoGlanceChip icon={ListOrdered} label={`${subClauses.length} sub-clause${subClauses.length === 1 ? '' : 's'}`} />}
            {clause.provisos.length > 0 && <FcoGlanceChip icon={AlertTriangle} label={`${clause.provisos.length} proviso${clause.provisos.length === 1 ? '' : 's'}`} tone="amber" />}
            {clause.forms.length > 0 && <FcoGlanceChip icon={FileText} label={`${clause.forms.length} form${clause.forms.length === 1 ? '' : 's'}`} tone="blue" />}
            {clause.timelines.length > 0 && <FcoGlanceChip icon={Clock} label={`${clause.timelines.length} timeline${clause.timelines.length === 1 ? '' : 's'}`} tone="emerald" />}
          </div>
        )}
        <FcoClauseTabContent clause={clause} activeTab={activeTab} />
        {clause.provisos.length > 0 && (
          <div className="space-y-1.5">
            {clause.provisos.map((proviso) => (
              <div key={proviso.title} className="flex gap-2 rounded-lg border border-sky-200 bg-sky-50 p-2.5 dark:border-sky-900/60 dark:bg-sky-950/30">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wide text-sky-800 dark:text-sky-300">{proviso.title}</p>
                  <p className="mt-0.5 text-[12px] font-semibold leading-5 text-sky-900 dark:text-sky-100">{proviso.plainEnglish}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-4 text-sky-700/80 dark:text-sky-200/70">{proviso.legalText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {subClauses.length > 0 && (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {subClauses.map((subClause) => (
              <details key={subClause.no} className="overflow-hidden rounded-lg border border-sky-100 bg-white dark:border-sky-900/40 dark:bg-slate-900">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-2">
                  <span className="flex h-7 min-w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 px-1.5 text-[10px] font-black text-white shadow-sm">{subClause.no}</span>
                  <span className="text-[12px] font-bold leading-4 text-slate-800 dark:text-slate-100">{subClause.plainEnglish}</span>
                </summary>
                <div className="space-y-1.5 border-t border-sky-100 px-2.5 py-2 text-[12px] font-semibold text-slate-700 dark:border-sky-900/40 dark:text-slate-200">
                  <p className="text-slate-500 dark:text-slate-400">{subClause.legalText}</p>
                  {subClause.officerAction && <p><span className="font-black text-sky-700 dark:text-sky-300">Officer:</span> {subClause.officerAction.join('; ')}</p>}
                  {subClause.dealerObligation && <p><span className="font-black text-blue-700 dark:text-blue-300">Dealer:</span> {subClause.dealerObligation.join('; ')}</p>}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(`${subClause.no}: ${subClause.legalText}\n${subClause.plainEnglish}`)} className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-white px-2 py-1 text-[11px] font-black text-sky-800 hover:bg-sky-50 dark:border-sky-800/50 dark:bg-slate-900 dark:text-sky-200">
                    <Copy className="h-3 w-3" /> Copy sub-clause
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}
        {clause.related.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-sky-100 pt-2 dark:border-sky-900/40">
            <span className="text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Related</span>
            {clause.related.map((item) => {
              const match = /^clause\s+(.+)$/i.exec(item.trim());
              const target = match ? fcoClauseLocationByNo.get(match[1].toLowerCase()) : undefined;
              if (!target) {
                return (
                  <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">{item}</span>
                );
              }
              return (
                <button key={item} type="button" onClick={() => onOpenRelated(target)} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900 dark:hover:bg-blue-950">
                  {item} <ArrowRight className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}


function FcoClauseTabContent({ clause, activeTab }: { clause: FcoClause; activeTab: FcoTabId }) {
  if (activeTab === 'fullText') return <FcoTextBlock items={[clause.legalText, ...clause.explanations.map((item) => `Explanation: ${item}`)]} />;
  if (activeTab === 'plainEnglish') return <FcoTextBlock items={[clause.plainEnglish, clause.summary]} />;
  if (activeTab === 'officerAction') return <FcoTextBlock items={clause.subClauses.flatMap((item) => item.officerAction || []).concat(clause.subClauses.flatMap((item) => item.dealerObligation?.map((obligationText) => `Dealer obligation: ${obligationText}`) || []))} empty="No specific officer action listed for this clause." />;
  if (activeTab === 'formsTimelines') return <FcoFormsTimelines clause={clause} />;
  return null;
}

function parseTimelineDuration(text: string): { value: number; unit: string; label: string } | null {
  const match = /(\d+)\s*[-–]?\s*(working\s+days?|days?|weeks?|months?|years?)/i.exec(text);
  if (!match) return null;
  const label = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:;,.()\-–—]*(for|of|from|within|after|in|by)?[\s:;,.()\-–—]*/i, '')
    .replace(/[\s:;,.()\-–—]*$/i, '')
    .trim();
  return { value: Number(match[1]), unit: match[2].replace(/\s+/g, ' '), label: label || text };
}

function FcoTimelineStepper({ timelines }: { timelines: string[] }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/20">
      <p className="text-[10px] font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">Deadline track</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {timelines.map((timeline, index) => {
          const parsed = parseTimelineDuration(timeline);
          return (
            <React.Fragment key={timeline}>
              {index > 0 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-400 dark:text-blue-600" />}
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-2 py-1.5 shadow-sm dark:border-blue-900 dark:bg-slate-900">
                {parsed ? (
                  <span className="flex h-8 min-w-8 shrink-0 flex-col items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-500 px-1 leading-none text-white">
                    <span className="text-[13px] font-black">{parsed.value}</span>
                    <span className="text-[7px] font-black uppercase">{parsed.unit.replace('working ', 'work ')}</span>
                  </span>
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-[11px] font-bold leading-4 text-slate-700 dark:text-slate-200">{parsed ? parsed.label : timeline}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function FcoFormsTimelines({ clause }: { clause: FcoClause }) {
  if (clause.forms.length === 0 && clause.timelines.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500">No specific form or timeline listed for this clause.</p>;
  }
  return (
    <div className="space-y-2.5">
      {clause.timelines.length > 0 && <FcoTimelineStepper timelines={clause.timelines} />}
      {clause.forms.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">Forms</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {clause.forms.map((form) => (
              <span key={form} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-200 dark:bg-slate-900 dark:text-blue-300 dark:ring-blue-900">
                <FileText className="h-3 w-3" /> {form}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FcoTextBlock({ items, empty = 'No matter available.' }: { items: string[]; empty?: string }) {
  const cleanItems = items.filter(Boolean);
  if (cleanItems.length === 0) return <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500">{empty}</p>;
  return (
    <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-3 text-sm font-semibold leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {cleanItems.map((item) => <p key={item}>{item}</p>)}
    </div>
  );
}

function fcoClauseToText(clause: FcoClause) {
  return [
    `FCO Clause ${clause.clauseNo}: ${clause.title}`,
    clause.summary,
    clause.legalText,
    clause.plainEnglish,
    ...fcoRealSubClauses(clause).map((item) => `${item.no}: ${item.legalText} - ${item.plainEnglish}`),

  ].filter(Boolean).join('\n');
}
function FcoDashboardCards({
  cards,
  activeCardId,
  showFormsCard,
  onOpenForms,
  onSelect,
}: {
  cards: FcoClauseCard[];
  activeCardId: string | null;
  showFormsCard: boolean;
  onOpenForms: () => void;
  onSelect: (cardId: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {showFormsCard && (
        <button
          type="button"
          onClick={onOpenForms}
          className="group relative flex flex-col overflow-hidden rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-sky-800/50 dark:from-sky-950/20 dark:via-slate-950 dark:to-blue-950/20"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-white shadow-sm transition group-hover:scale-105">
              <FileText className="h-4 w-4" />
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/60">27 statutory forms</span>
          </div>
          <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">Forms</h3>
          <p className="mt-0.5 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">FCO statutory forms grouped for registration, manufacturing, sampling and records.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Search', 'Preview', 'Download'].map((item) => (
              <span key={item} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60">
                {item}
              </span>
            ))}
          </div>
        </button>
      )}
      {cards.map((card) => {
        const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;
        const active = activeCardId === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={`group relative flex flex-col overflow-hidden rounded-lg border p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md ${
              active
                ? 'border-sky-400 bg-gradient-to-br from-sky-100/80 via-white to-blue-100/60 shadow-md dark:border-sky-600 dark:from-sky-950/40 dark:via-slate-950 dark:to-blue-950/30'
                : 'border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 dark:border-sky-800/50 dark:from-sky-950/20 dark:via-slate-950 dark:to-blue-950/20'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-white shadow-sm transition group-hover:scale-105">
                <Icon className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/60">{card.clauseRange}</span>
            </div>
            <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{card.cardTitle}</h3>
            <p className="mt-0.5 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{card.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {card.contains.slice(0, 5).map((item) => (
                <span key={item} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60">
                  {item}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function fertilizerFormSearchText(form: FertilizerFormEntry) {
  return [form.formNo, form.title, form.category, form.clause || '', form.description, form.keywords.join(' ')].join(' ').toLowerCase();
}

function FertilizerFormsPanel({
  search,
  category,
  onSearchChange,
  onCategoryChange,
  onViewForm,
}: {
  search: string;
  category: 'All' | FertilizerFormCategory;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: 'All' | FertilizerFormCategory) => void;
  onViewForm: (form: FertilizerFormEntry) => void;
}) {
  const term = search.trim().toLowerCase();
  const visibleForms = fertilizerForms.filter((form) => {
    if (category !== 'All' && form.category !== category) return false;
    if (term && !fertilizerFormSearchText(form).includes(term)) return false;
    return true;
  });

  return (
    <section className="space-y-3">
      <FertilizerSectionBadge icon={FileText} label="Forms" />
      <div className="rounded-lg border border-sky-200 bg-white p-3 shadow-sm dark:border-sky-800/50 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search form number, title, clause, category..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {fertilizerFormCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCategoryChange(item)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black transition sm:text-xs ${
                category === item
                  ? 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                  : 'border border-sky-200 bg-sky-50/60 text-sky-900 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:bg-sky-950/50'
              }`}
            >
              {item}
            </button>
          ))}
          <span className="ml-auto rounded-full bg-sky-50 px-3 py-1 text-[11px] font-black text-sky-800 ring-1 ring-sky-100 dark:bg-sky-950/30 dark:text-sky-200 dark:ring-sky-900">
            {visibleForms.length} forms
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visibleForms.map((form) => (
          <article key={form.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-sky-800/50 dark:from-sky-950/20 dark:via-slate-950 dark:to-blue-950/20">
            <div className="flex items-start gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-white shadow-sm transition group-hover:scale-105">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">{form.formNo}</p>
                <h3 className="mt-0.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{form.title}</h3>
              </div>
            </div>
            <p className="mt-2 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{form.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60">
                {form.category}
              </span>
              {form.clause && (
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/60">
                  {form.clause}
                </span>
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-sky-100 pt-2 dark:border-sky-900/50">
              <button type="button" onClick={() => onViewForm(form)} className="inline-flex min-h-7 items-center gap-1 rounded-md bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:shadow-md hover:brightness-105">
                <FileSearch className="h-3 w-3" /> View
              </button>
              <a href={form.pdfPath} download className="inline-flex min-h-7 items-center gap-1 rounded-md border border-sky-200 bg-white px-2.5 py-1 text-[10px] font-black text-sky-800 transition hover:bg-sky-50 dark:border-sky-800/50 dark:bg-slate-900 dark:text-sky-200 dark:hover:bg-sky-950/30">
                <FileText className="h-3 w-3" /> PDF
              </a>
            </div>
          </article>
        ))}
        {visibleForms.length === 0 && (
          <p className="rounded-lg border border-dashed border-sky-200 p-8 text-center text-sm font-semibold text-slate-500 sm:col-span-2 xl:col-span-3 dark:border-sky-800/50">
            No forms found
          </p>
        )}
      </div>
    </section>
  );
}
function FcoOffencesSection({ entries, onDownload, onPrint }: { entries: FcoOffenceEntry[]; onDownload: () => void; onPrint: () => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm dark:border-sky-800/50 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 bg-white px-4 py-3 dark:border-sky-900/50 dark:bg-slate-950">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-sm font-black text-white hover:bg-sky-800">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-black text-blue-800 hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-950 dark:text-blue-200">
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-800 ring-1 ring-sky-100 dark:bg-sky-950/30 dark:text-sky-200 dark:ring-sky-900">
          {entries.length} offences
        </span>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <article key={entry.serialNumber} className="flex flex-col rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-sky-900/50 dark:from-sky-950/20 dark:via-slate-950 dark:to-blue-950/20">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-[11px] font-black text-white shadow-sm">
                {entry.serialNumber}
              </span>
              <p className="min-w-0 flex-1 text-xs font-black leading-4 text-slate-900 dark:text-white">{entry.offenceType}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/60">
                {entry.contraventionProvision}
              </span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/60">
                {entry.punishmentProvision}
              </span>
            </div>
            {entry.useInField && (
              <p className="mt-1.5 text-[10px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{entry.useInField}</p>
            )}
          </article>
        ))}
        {entries.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 sm:col-span-2 xl:col-span-3 dark:border-slate-700">
            No FCO offence entry matches the current search.
          </p>
        )}
      </div>
    </div>
  );
}

function renderFcoOffencesPrintHtml(entries: FcoOffenceEntry[]) {
  const rows = entries.map((entry) => `<tr><td>${entry.serialNumber}</td><td>${escapeHtml(entry.offenceType)}</td><td>${escapeHtml(entry.contraventionProvision)}</td><td>${escapeHtml(entry.punishmentProvision)}</td></tr>`).join('');
  return `<!doctype html><html><head><title>FCO Offences With Relevant FCO/ECA Provisions</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111827}h1{text-align:center;color:#075985}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cbd5e1;padding:7px;vertical-align:top}th{background:#eff6ff}.note{margin-top:12px;background:#fffbeb;border:1px solid #f59e0b;padding:10px;font-weight:800;color:#78350f}</style></head><body><h1>FCO Offences With Relevant FCO/ECA Provisions</h1><table><thead><tr><th>Sl.No</th><th>Type of offence</th><th>Contravention provision</th><th>Punishment under ECA</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function PowersSection({ area }: { area: MainLegalArea }) {
  const theme = legalAreaCards.find((item) => item.id === area) || legalAreaCards[0];
  const visibleMappings = stopSaleSeizureMappings.filter((item) => {
    if (area === 'fertilizer') return item.group === 'Fertiliser cases under FCO 1985' || item.group === 'Fertiliser Movement Control Order cases';
    if (area === 'seed') return item.group === 'Seed cases under Seeds Act, 1966';
    return item.group === 'Insecticide cases under Insecticides Act, 1968';
  });
  const groups = Array.from(new Set(visibleMappings.map((item) => item.group)));
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group} className={`rounded-lg border ${theme.border} bg-white p-4 shadow-sm dark:bg-slate-900`}>
          <h2 className={`text-lg font-black ${theme.accent}`}>{group}</h2>
          <div className={`mt-3 overflow-x-auto rounded-lg border ${theme.border}`}>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className={`bg-gradient-to-br ${theme.panel} text-xs font-black uppercase ${theme.accent}`}>
                <tr>
                  <th className="px-3 py-2">Situation / violation</th>
                  <th className="px-3 py-2">Act / Order</th>
                  <th className="px-3 py-2">Exact reference</th>
                  <th className="px-3 py-2">Officer power</th>
                  <th className="px-3 py-2">Procedure</th>
                  <th className="px-3 py-2">Penal provision</th>
                  <th className="px-3 py-2">Required form / notice / report</th>
                  <th className="px-3 py-2">Caution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleMappings.filter((item) => item.group === group).map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-3 py-2 font-bold">{item.situation}</td>
                    <td className="px-3 py-2">{item.applicableLaw}</td>
                    <td className="px-3 py-2">{item.exactReference}</td>
                    <td className="px-3 py-2">{item.officerPower}</td>
                    <td className="px-3 py-2">{item.procedure.join('; ')}</td>
                    <td className="px-3 py-2">{item.penalProvision}</td>
                    <td className="px-3 py-2">{item.requiredFormNoticeReport}</td>
                    <td className="px-3 py-2">{item.caution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <section className="grid gap-3 md:grid-cols-3">
        {officerWorkflows.map((workflow) => (
          <div key={workflow.id} className={`rounded-lg border ${theme.border} bg-gradient-to-br ${theme.panel} p-4 shadow-sm`}>
            <h3 className={`font-black ${theme.accent}`}>{workflow.title}</h3>
            <ol className="mt-3 space-y-2">
              {workflow.steps.map((step, index) => <li key={step} className="text-sm font-semibold text-slate-600 dark:text-slate-300">{index + 1}. {step}</li>)}
            </ol>
          </div>
        ))}
      </section>
    </div>
  );
}

function collectMindMapNodeIds(nodes: MindMapNode[], bucket: Set<string> = new Set()) {
  nodes.forEach((node) => {
    bucket.add(node.id);
    if (node.children?.length) collectMindMapNodeIds(node.children, bucket);
  });
  return bucket;
}

function EnforcementDutiesPanel() {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [offenceSearch, setOffenceSearch] = useState('');
  const [offencesOpen, setOffencesOpen] = useState(false);
  const allNodeIds = useMemo(() => collectMindMapNodeIds(enforcementMindMap), []);
  const filteredOffences = useMemo(() => filterFcoOffences(fcoOffenceEntries, offenceSearch), [offenceSearch]);
  const allExpanded = collapsed.size === 0;

  const toggleNode = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <FertilizerSectionBadge icon={Network} label="Enforcement Mind Map" />
      <section className="rounded-lg border border-sky-200 bg-white p-3 shadow-sm dark:border-sky-800/50 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Key deadlines</p>
          <button
            type="button"
            onClick={() => setCollapsed(allExpanded ? new Set(allNodeIds) : new Set())}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black text-sky-800 transition hover:bg-sky-100 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:bg-sky-950/50"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {enforcementDeadlines.map((item) => (
            <div key={item.action} className="flex items-start gap-2 rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 px-2.5 py-2 dark:border-sky-900/50 dark:from-sky-950/30 dark:to-blue-950/30">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-300" />
              <div>
                <p className="text-[11px] font-black leading-4 text-slate-800 dark:text-slate-100">{item.limit}</p>
                <p className="text-[10px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {enforcementMindMap.map((branch) => (
          <MindMapBranchCard key={branch.id} node={branch} collapsed={collapsed} onToggle={toggleNode} />
        ))}

        <section className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm dark:border-sky-800/50 dark:bg-slate-900 lg:col-span-2">
          <button
            type="button"
            onClick={() => setOffencesOpen((open) => !open)}
            className="flex w-full items-start gap-2.5 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-3 text-left transition hover:from-sky-100 dark:from-sky-950/40 dark:via-slate-900 dark:to-blue-950 dark:hover:from-sky-950/60"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-white shadow-sm">
              <Scale className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-slate-950 dark:text-white">FCO Offences & Penal Provisions</span>
              <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">Searchable offence reference with FCO contravention and ECA punishment provisions.</span>
            </span>
            <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-sky-700 transition-transform duration-200 dark:text-sky-300 ${offencesOpen ? '' : '-rotate-90'}`} />
          </button>
          {offencesOpen && (
            <div className="space-y-3 border-t border-sky-100 p-3 dark:border-sky-900/40">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={offenceSearch}
                  onChange={(event) => setOffenceSearch(event.target.value)}
                  placeholder="Search offence, FCO provision, ECA punishment..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <FcoOffencesSection
                entries={filteredOffences}
                onDownload={() => downloadFcoOffencesCsv(filteredOffences)}
                onPrint={() => printFcoOffences(filteredOffences)}
              />
            </div>
          )}
        </section>
      </div>

      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        Source: Central Fertilizer Quality Control & Training Institute (CFQCTI), Faridabad — Duties and Responsibilities of Enforcement Officers.
      </p>
    </div>
  );
}

function MindMapBranchCard({ node, collapsed, onToggle }: { node: MindMapNode; collapsed: Set<string>; onToggle: (id: string) => void }) {
  const hasChildren = Boolean(node.children?.length);
  const isCollapsed = collapsed.has(node.id);

  return (
    <section className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm dark:border-sky-800/50 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => hasChildren && onToggle(node.id)}
        className="flex w-full items-start gap-2.5 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-3 text-left transition hover:from-sky-100 dark:from-sky-950/40 dark:via-slate-900 dark:to-blue-950 dark:hover:from-sky-950/60"
      >
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-700 text-white shadow-sm">
          <Network className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-950 dark:text-white">{node.label}</span>
          {node.detail && <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{node.detail}</span>}
        </span>
        {hasChildren && (
          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-sky-700 transition-transform duration-200 dark:text-sky-300 ${isCollapsed ? '-rotate-90' : ''}`} />
        )}
      </button>
      {hasChildren && !isCollapsed && (
        <ul className="space-y-1 border-t border-sky-100 p-3 dark:border-sky-900/40">
          {node.children!.map((child) => (
            <MindMapNodeRow key={child.id} node={child} depth={0} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MindMapNodeRow({ node, depth, collapsed, onToggle }: { node: MindMapNode; depth: number; collapsed: Set<string>; onToggle: (id: string) => void }) {
  const hasChildren = Boolean(node.children?.length);
  const isCollapsed = collapsed.has(node.id);

  return (
    <li>
      <div className="flex items-start gap-1.5 rounded-md px-1 py-1 transition hover:bg-sky-50/70 dark:hover:bg-sky-950/20">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-sky-700 transition hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-950/40"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="mt-1.5 ml-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
        )}
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className="min-w-0 flex-1 text-left"
        >
          <span className={`block leading-5 ${depth === 0 ? 'text-[13px] font-black text-slate-900 dark:text-white' : 'text-xs font-bold text-slate-800 dark:text-slate-100'}`}>
            {node.label}
          </span>
          {node.detail && (
            <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{node.detail}</span>
          )}
        </button>
      </div>
      {hasChildren && !isCollapsed && (
        <ul className="ml-2.5 space-y-0.5 border-l border-sky-200 pl-2.5 dark:border-sky-800/50">
          {node.children!.map((child) => (
            <MindMapNodeRow key={child.id} node={child} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}


import React, { useEffect, useMemo, useState } from 'react';
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
  PackageCheck,
  Printer,
  Scale,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Sprout,
  Store,
  Truck,
  FileSpreadsheet,
} from 'lucide-react';
import { fcoOffenceEntries, type FcoOffenceEntry } from '../data/fcoOffencesData';
import { type LegalCategory } from '../data/legalReadyReckonerData';
import { fcoClauseCards, fcoMemoryMnemonic, importantFcoMnemonics, validateFcoClauseCoverage, type FcoClause, type FcoClauseCard, type FcoTabId, type FcoVariationNote } from '../data/fcoClauses';
import { fertilizerFormCategories, fertilizerForms, type FertilizerFormCategory, type FertilizerFormEntry } from '../data/fertilizerForms';
import { fertilizerSchedules, type FertilizerScheduleEntry } from '../data/fertilizerSchedules';
import { officerWorkflows, stopSaleSeizureMappings } from '../data/stopSaleSeizureData';
import { BackButton } from './ui/BackButton';
import { FertilizerFormPdfGenerator } from './forms/FertilizerFormPdfGenerator';

type ReckonerView = 'powers' | 'notice';
type MainLegalArea = 'fertilizer' | 'seed' | 'insecticide';
type FertilizerSection = 'clauses' | 'forms' | 'schedules' | 'officer';
type OfficerCornerAction = 'offences' | 'stop-sale';

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
  { id: 'mnemonics', label: 'Memory', icon: Sparkles },
];
const legalAreaCards: Array<{
  id: MainLegalArea;
  title: string;
  description: string;
  icon: typeof Scale;
  category: LegalCategory;
  color: string;
  glow: string;
  delay: string;
}> = [
  { id: 'fertilizer', title: 'Fertilizer', description: 'FCO 1985, ECA, seizure, samples and prosecution references.', icon: PackageCheck, category: 'Fertiliser', color: 'from-amber-500 via-emerald-500 to-teal-700', glow: 'shadow-amber-500/25', delay: '0ms' },
  { id: 'seed', title: 'Seed', description: 'Seed Act, Rules, labelling, sampling and penalty actions.', icon: Sprout, category: 'Seeds', color: 'from-lime-500 via-green-500 to-emerald-700', glow: 'shadow-lime-500/25', delay: '120ms' },
  { id: 'insecticide', title: 'Insecticide', description: 'Insecticides Act, Rules, stop-sale, seizure and records.', icon: SprayCan, category: 'Insecticides', color: 'from-cyan-500 via-sky-500 to-blue-700', glow: 'shadow-sky-500/25', delay: '240ms' },
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
  const [category, setCategory] = useState<LegalCategory>('Fertiliser');
  const [selectedFcoCardId, setSelectedFcoCardId] = useState<string | null>(null);
  const [fcoActiveTab, setFcoActiveTab] = useState<FcoTabId>('plainEnglish');
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks());
  const [selectedFertilizerForm, setSelectedFertilizerForm] = useState<FertilizerFormEntry | null>(null);
  const [formSearch, setFormSearch] = useState('');
  const [formCategory, setFormCategory] = useState<'All' | FertilizerFormCategory>('All');
  const [fertilizerSection, setFertilizerSection] = useState<FertilizerSection | null>(null);
  const [officerCornerAction, setOfficerCornerAction] = useState<OfficerCornerAction | null>(null);
  const [scheduleSearch, setScheduleSearch] = useState('');

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

  const filteredFcoOffences = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (category !== 'Fertiliser') return [];
    if (!term) return fcoOffenceEntries;
    return fcoOffenceEntries.filter((entry) =>
      [entry.serialNumber, entry.offenceType, entry.contraventionProvision, entry.punishmentProvision, entry.useInField]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [category, query]);

  const toggleBookmark = (entryId: string) => {
    setBookmarks((current) => current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId]);
  };

  const downloadFcoOffencesCsv = () => {
    const rows = [
      ['Sl.No', 'Type of offence', 'Contravention provision', 'Punishment provision under ECA'],
      ...filteredFcoOffences.map((entry) => [
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
    URL.revokeObjectURL(url);
  };

  const printFcoOffences = () => {
    const popup = window.open('', '_blank', 'width=1100,height=900');
    if (!popup) return;
    popup.document.write(renderFcoOffencesPrintHtml(filteredFcoOffences));
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const openLegalArea = (area: MainLegalArea) => {
    const areaCard = legalAreaCards.find((item) => item.id === area);
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
      setOfficerCornerAction(null);
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

  return (
    <div className="space-y-4">
      {!selectedFcoCardId && (
      <section className="overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 p-4 text-white shadow-sm dark:border-emerald-900 sm:p-5">
          <div className="flex items-start gap-3">
            <BackButton onClick={handleBack} tone="solid" className="mt-0.5" />
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 shadow-sm ring-1 ring-white/20">
                <Scale className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-100">Officer Toolkit</p>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Acts & Orders</h1>
                <p className="mt-1 max-w-3xl text-sm font-semibold text-emerald-50">
                  Search Acts, Rules, Orders, clauses, penal provisions, stop sale, seizure, sampling and notice workflows.
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
          onBack={() => {
            setFertilizerSection(null);
            setSelectedFcoCardId(null);
            setQuery('');
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
          onBack={() => setFertilizerSection(null)}
          onViewForm={setSelectedFertilizerForm}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'schedules' && (
        <FertilizerSchedulesPanel
          search={scheduleSearch}
          onSearchChange={setScheduleSearch}
          onBack={() => setFertilizerSection(null)}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'officer' && (
        <OfficerCornerPanel
          action={officerCornerAction}
          offences={filteredFcoOffences}
          onActionChange={setOfficerCornerAction}
          onSearchChange={setQuery}
          search={query}
          onBack={() => {
            setFertilizerSection(null);
            setOfficerCornerAction(null);
            setQuery('');
          }}
          onBackToActions={() => setOfficerCornerAction(null)}
          onDownloadOffences={downloadFcoOffencesCsv}
          onPrintOffences={printFcoOffences}
        />
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
        <ViewButton active={view === 'powers'} icon={ShieldAlert} label="Stop Sale & Seizure" onClick={() => setView('powers')} />
      </div>

      {view === 'powers' && selectedLegalArea && <PowersSection area={selectedLegalArea} />}
        </>
      )}
      {selectedFertilizerForm && (
        <FertilizerFormPdfGenerator form={selectedFertilizerForm} onClose={() => setSelectedFertilizerForm(null)} />
      )}
    </div>
  );
}


function FertilizerModuleHome({ onOpenSection }: { onOpenSection: (section: FertilizerSection) => void }) {
  const cards: Array<{ id: FertilizerSection; title: string; subtitle: string; description: string; icon: React.ElementType; tone: string }> = [
    { id: 'clauses', title: 'Clauses', subtitle: '39 Clauses', description: 'FCO clause cards, sub-clauses, officer action and timelines.', icon: BookOpen, tone: 'from-emerald-500 via-green-500 to-teal-700' },
    { id: 'forms', title: 'Forms', subtitle: '28 Forms', description: 'Registration, manufacturing, sampling and business record forms.', icon: FileText, tone: 'from-amber-500 via-orange-400 to-emerald-600' },
    { id: 'schedules', title: 'Schedules', subtitle: '8 Schedules', description: 'Specifications, sampling procedures, tolerance limits and analysis methods.', icon: ClipboardList, tone: 'from-sky-500 via-cyan-500 to-emerald-600' },
    { id: 'officer', title: 'Officer Corner', subtitle: 'Field actions & notices', description: 'Offences and stop sale references.', icon: ShieldAlert, tone: 'from-rose-500 via-orange-500 to-amber-500' },
  ];

  return (
    <section className="space-y-2.5 rounded-lg border border-emerald-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-emerald-500 to-teal-700 text-white shadow-lg shadow-amber-500/20">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Fertilizer</h2>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Open clauses, forms, schedules, or officer field actions.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenSection(card.id)}
              className="group relative min-h-[7rem] overflow-hidden rounded-lg border border-emerald-200 bg-white p-2.5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-emerald-800/50 dark:bg-slate-950"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.tone} opacity-15 transition group-hover:opacity-25`} />
              <div className="relative flex h-full flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${card.tone} text-white shadow-sm transition group-hover:scale-105`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-black text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900/85 dark:text-slate-100 dark:ring-slate-700">{card.subtitle}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">{card.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-4 text-slate-600 dark:text-slate-300">{card.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
    </section>
  );
}

function FertilizerSectionHeader({ title, subtitle, icon: Icon, onBack }: { title: string; subtitle: string; icon: React.ElementType; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3 shadow-sm dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Fertilizer</p>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>
      </div>
    </div>
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
  onBack,
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
  onBack: () => void;
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
      <FertilizerSectionHeader title="Clauses" subtitle="39 Clauses" icon={BookOpen} onBack={onBack} />
      <FcoMasterMnemonicCard />
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search Clause 28, 28(2), stop sale, Form J, Schedule II..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">No clauses found</p>
      )}
    </section>
  );
}

function scheduleSearchText(schedule: FertilizerScheduleEntry) {
  return [schedule.scheduleNo, schedule.title, schedule.subtitle, schedule.parts.map((part) => part.label).join(' '), schedule.keywords.join(' ')].join(' ').toLowerCase();
}

function FertilizerSchedulesPanel({ search, onSearchChange, onBack }: { search: string; onSearchChange: (value: string) => void; onBack: () => void }) {
  const term = search.trim().toLowerCase();
  const visibleSchedules = fertilizerSchedules.filter((schedule) => !term || scheduleSearchText(schedule).includes(term));

  return (
    <section className="space-y-3">
      <FertilizerSectionHeader title="Schedules" subtitle="8 Schedules" icon={ClipboardList} onBack={onBack} />
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search schedule, part, sampling, tolerance, biofertiliser..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {visibleSchedules.map((schedule) => (
          <details key={schedule.id} className="group rounded-lg border border-sky-200 bg-white p-2.5 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-sky-800/50 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{schedule.scheduleNo}</p>
                <h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">{schedule.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-4 text-slate-600 dark:text-slate-300">{schedule.subtitle}</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
              {schedule.parts.map((part) => (
                <li key={part.id} className="rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200">{part.label}</li>
              ))}
            </ul>
          </details>
        ))}
        {visibleSchedules.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2 dark:border-slate-700 dark:bg-slate-900">No schedules found</p>
        )}
      </div>
    </section>
  );
}

function OfficerCornerPanel({
  action,
  offences,
  search,
  onSearchChange,
  onActionChange,
  onBack,
  onBackToActions,
  onDownloadOffences,
  onPrintOffences,
}: {
  action: OfficerCornerAction | null;
  offences: FcoOffenceEntry[];
  search: string;
  onSearchChange: (value: string) => void;
  onActionChange: (action: OfficerCornerAction) => void;
  onBack: () => void;
  onBackToActions: () => void;
  onDownloadOffences: () => void;
  onPrintOffences: () => void;
}) {
  const actions: Array<{ id: OfficerCornerAction; title: string; subtitle: string; icon: React.ElementType }> = [
    { id: 'offences', title: 'Offences', subtitle: 'FCO/ECA offence references', icon: Scale },
    { id: 'stop-sale', title: 'Issue Stop Sale / Seizure Notice', subtitle: 'Stop sale, seizure and workflow table', icon: ShieldAlert },
  ];

  if (!action) {
    return (
      <section className="space-y-3">
        <FertilizerSectionHeader title="Officer Corner" subtitle="Field actions & notices" icon={ShieldAlert} onBack={onBack} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => onActionChange(item.id)} className="group min-h-[8rem] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:scale-105 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-3 block text-sm font-black text-slate-950 dark:text-white">{item.title}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{item.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <FertilizerSectionHeader title={actions.find((item) => item.id === action)?.title || 'Officer Corner'} subtitle="Field actions & notices" icon={ShieldAlert} onBack={onBackToActions} />
      {action === 'offences' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search offence, FCO provision, ECA punishment..." className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <FcoOffencesSection entries={offences} onDownload={onDownloadOffences} onPrint={onPrintOffences} />
        </div>
      )}
      {action === 'stop-sale' && <PowersSection area="fertilizer" />}

    </section>
  );
}

function LegalAreaOpeningScreen({ onOpen }: { onOpen: (area: MainLegalArea) => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-[linear-gradient(135deg,#f7fee7_0%,#ecfdf5_48%,#eff6ff_100%)] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-xl font-black text-emerald-950 dark:text-white sm:text-2xl">Select input category</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {legalAreaCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpen(card.id)}
              style={{ animationDelay: card.delay }}
              className={`agri-legal-round-card group relative mx-auto flex aspect-square w-full max-w-[10.4rem] flex-col items-center justify-center overflow-hidden rounded-full border border-emerald-300/70 bg-gradient-to-br from-white via-lime-50 to-emerald-50 p-[0.9rem] text-center shadow-lg ${card.glow} ring-1 ring-emerald-900/5 transition duration-300 hover:-translate-y-2 hover:scale-[1.06] hover:rotate-[1deg] hover:shadow-2xl focus-visible:outline-emerald-700 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950`}
            >
              <span className={`absolute inset-2 rounded-full bg-gradient-to-br ${card.color} opacity-[0.18] transition group-hover:opacity-[0.28]`} />
              <span className="agri-card-field-lines absolute inset-4 rounded-full" />
              <span className="agri-card-shine absolute inset-0 rounded-full" />
              <span className="agri-legal-ripple absolute inset-0 rounded-full" />
              <span className={`relative flex h-[3.15rem] w-[3.15rem] items-center justify-center rounded-full bg-gradient-to-br ${card.color} text-white shadow-lg ${card.glow} ring-4 ring-white/80 transition duration-300 group-hover:scale-110 group-hover:rotate-3 sm:h-[3.6rem] sm:w-[3.6rem]`}>
                <Icon className="h-[1.57rem] w-[1.57rem] sm:h-[1.8rem] sm:w-[1.8rem]" strokeWidth={1.9} />
              </span>
              <span className="relative mt-2.5 text-[0.9rem] font-black sm:text-[1.02rem] text-emerald-950 dark:text-white">{card.title}</span>
              <span className="relative mt-1 max-w-[8.5rem] text-[10px] font-bold leading-4 text-emerald-900/75 dark:text-slate-300">{card.description}</span>
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
    <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
        {topics.map((topic, index) => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.title}
              type="button"
              onClick={() => onOpenTopic(topic)}
              style={{ animationDelay: `${index * 70}ms` }}
              className="agri-topic-card group rounded-lg border border-emerald-200 bg-slate-50 p-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.99] dark:border-emerald-800/50 dark:bg-slate-950 dark:hover:bg-emerald-950/20"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100 transition group-hover:scale-105 dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-700">
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

function ViewButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`agri-input-topic-card group flex min-h-[4.25rem] items-center gap-2.5 rounded-xl border p-2.5 text-left text-sm font-black shadow-sm transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.98] ${
        active
          ? 'border-transparent bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-900/20'
          : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 transition group-hover:scale-105 ${
        active
          ? 'bg-white/20 text-white ring-white/30'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900'
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 leading-5">{label}</span>
    </button>
  );
}

function FcoMasterMnemonicCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Master Mnemonic</p>
          <h3 className="mt-1 text-lg font-black tracking-wide text-slate-950 dark:text-white">{fcoMemoryMnemonic.code}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-700 dark:text-slate-200">{fcoMemoryMnemonic.sentence}</p>
        </div>
        <div className="flex max-w-xl flex-wrap gap-1.5">
          {fcoMemoryMnemonic.lines.map(([letter, word]) => (
            <span key={`${letter}-${word}`} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-900 shadow-sm ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-900">
              {letter}: {word}
            </span>
          ))}
        </div>
      </div>
    </section>
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
    <section className="overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className={`bg-gradient-to-br ${card.gradient} p-3 text-white`}>
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
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black ring-1 transition ${
                selected
                  ? 'bg-emerald-600 text-white ring-emerald-600 shadow-sm'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
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
  amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
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
    <details id={`fco-clause-${clause.id}`} className="group overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm dark:border-amber-800/50 dark:bg-slate-900" open>
      <summary className="flex cursor-pointer list-none flex-col gap-2 border-b border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Clause {clause.clauseNo} - {clause.category}</p>
          <h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">{clause.title}</h3>
          <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">{clause.summary}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={(event) => { event.preventDefault(); onToggleBookmark(); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-emerald-700 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900" aria-label="Bookmark clause">
            {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); copyClause(); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-label="Copy clause">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); void shareClause(); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-label="Share clause">
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
              <div key={proviso.title} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900/60 dark:bg-amber-950/30">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">{proviso.title}</p>
                  <p className="mt-0.5 text-[12px] font-semibold leading-5 text-amber-900 dark:text-amber-100">{proviso.plainEnglish}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-4 text-amber-700/80 dark:text-amber-200/70">{proviso.legalText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {subClauses.length > 0 && (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {subClauses.map((subClause) => (
              <details key={subClause.no} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-2">
                  <span className="flex h-7 min-w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-500 px-1.5 text-[10px] font-black text-white shadow-sm">{subClause.no}</span>
                  <span className="text-[12px] font-bold leading-4 text-slate-800 dark:text-slate-100">{subClause.plainEnglish}</span>
                </summary>
                <div className="space-y-1.5 border-t border-slate-100 px-2.5 py-2 text-[12px] font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  <p className="text-slate-500 dark:text-slate-400">{subClause.legalText}</p>
                  {subClause.officerAction && <p><span className="font-black text-amber-700 dark:text-amber-300">Officer:</span> {subClause.officerAction.join('; ')}</p>}
                  {subClause.dealerObligation && <p><span className="font-black text-blue-700 dark:text-blue-300">Dealer:</span> {subClause.dealerObligation.join('; ')}</p>}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(`${subClause.no}: ${subClause.legalText}\n${subClause.plainEnglish}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <Copy className="h-3 w-3" /> Copy sub-clause
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}
        {clause.related.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Related</span>
            {clause.related.map((item) => {
              const match = /^clause\s+(.+)$/i.exec(item.trim());
              const target = match ? fcoClauseLocationByNo.get(match[1].toLowerCase()) : undefined;
              if (!target) {
                return (
                  <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">{item}</span>
                );
              }
              return (
                <button key={item} type="button" onClick={() => onOpenRelated(target)} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900 dark:hover:bg-emerald-950">
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
  return <FcoTextBlock items={[clause.mnemonic || '', ...importantFcoMnemonics.filter((item) => clause.clauseNo === item.label.replace('Clause ', '') || clause.keywords.join(' ').toLowerCase().includes(item.code.toLowerCase())).map((item) => `${item.label}: ${item.code} - ${item.meaning}`)]} empty="No mnemonic listed for this clause." />;
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
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Deadline track</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {timelines.map((timeline, index) => {
          const parsed = parseTimelineDuration(timeline);
          return (
            <React.Fragment key={timeline}>
              {index > 0 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-400 dark:text-emerald-600" />}
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-2 py-1.5 shadow-sm dark:border-emerald-900 dark:bg-slate-900">
                {parsed ? (
                  <span className="flex h-8 min-w-8 shrink-0 flex-col items-center justify-center rounded-md bg-gradient-to-br from-emerald-600 to-teal-500 px-1 leading-none text-white">
                    <span className="text-[13px] font-black">{parsed.value}</span>
                    <span className="text-[7px] font-black uppercase">{parsed.unit.replace('working ', 'work ')}</span>
                  </span>
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
    clause.mnemonic ? `Mnemonic: ${clause.mnemonic}` : '',
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
    <section className="overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">      <div className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {showFormsCard && (
          <button
            type="button"
            onClick={onOpenForms}
            className="group relative min-h-[10rem] overflow-hidden rounded-lg border border-amber-200 bg-white p-3 text-left text-slate-900 shadow-sm transition duration-300 motion-safe:hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-50/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-amber-950/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-400 to-emerald-500 opacity-15 transition group-hover:opacity-20" />
            <div className="relative flex h-full flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="rounded-lg bg-white/85 p-2 text-amber-800 shadow-sm ring-1 ring-amber-100 motion-safe:transition motion-safe:group-hover:scale-105 dark:bg-slate-950/80 dark:text-amber-200 dark:ring-amber-900">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-black text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950/80 dark:text-slate-100 dark:ring-slate-700">27 statutory forms</span>
              </div>
              <div>
                <h3 className="text-base font-black leading-tight text-slate-950 dark:text-white">Forms</h3>
                <p className="mt-1 text-xs font-bold leading-4 text-slate-700 dark:text-slate-200">FCO statutory forms grouped for registration, manufacturing, sampling and records.</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {['Search', 'Preview', 'Download'].map((item) => (
                  <span key={item} className="rounded-full bg-white/75 px-1.5 py-0.5 text-[10px] font-black text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/75 dark:text-slate-200 dark:ring-slate-700">
                    {item}
                  </span>
                ))}
              </div>
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
              className={`group relative min-h-[10rem] overflow-hidden rounded-lg border p-3 text-left shadow-sm transition duration-300 motion-safe:hover:-translate-y-1 ${
                active ? 'border-amber-300 bg-amber-50 text-slate-950 shadow-md' : 'border-slate-200 bg-white text-slate-900 hover:border-amber-200 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-amber-950/20'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-15 transition group-hover:opacity-20`} />
              <div className="relative flex h-full flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-lg bg-white/80 p-2 text-amber-800 shadow-sm ring-1 ring-amber-100 motion-safe:transition motion-safe:group-hover:scale-105 dark:bg-slate-950/80 dark:text-amber-200 dark:ring-amber-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-black text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950/80 dark:text-slate-100 dark:ring-slate-700">{card.clauseRange}</span>
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight text-slate-950 dark:text-white">{card.cardTitle}</h3>
                  <p className="mt-1 text-xs font-bold leading-4 text-slate-700 dark:text-slate-200">{card.summary}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {card.contains.slice(0, 5).map((item) => (
                    <span key={item} className="rounded-full bg-white/75 px-1.5 py-0.5 text-[10px] font-black text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/75 dark:text-slate-200 dark:ring-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
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
  onBack,
  onViewForm,
}: {
  search: string;
  category: 'All' | FertilizerFormCategory;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: 'All' | FertilizerFormCategory) => void;
  onBack: () => void;
  onViewForm: (form: FertilizerFormEntry) => void;
}) {
  const term = search.trim().toLowerCase();
  const visibleForms = fertilizerForms.filter((form) => {
    if (category !== 'All' && form.category !== category) return false;
    if (term && !fertilizerFormSearchText(form).includes(term)) return false;
    return true;
  });

  return (
    <section className="overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-3 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="flex items-start gap-2.5">
          <BackButton onClick={onBack} colors="text-amber-800 hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-100" />
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="shrink-0 rounded-lg bg-white p-2 text-amber-800 shadow-sm ring-1 ring-amber-100 dark:bg-slate-900 dark:text-amber-200 dark:ring-amber-900">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">FCO Forms</p>
              <h2 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">Forms</h2>
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search form number, title, clause, category..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-3xl lg:justify-end">
            {fertilizerFormCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onCategoryChange(item)}
                className={`min-h-9 rounded-lg px-2.5 py-2 text-center text-[11px] font-black leading-4 transition sm:whitespace-nowrap sm:text-xs ${category === item ? 'bg-amber-700 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid auto-rows-fr gap-2 p-2 md:grid-cols-2 xl:grid-cols-3">
        {visibleForms.map((form) => (
          <article key={form.id} className="flex min-h-[9rem] min-w-0 flex-col rounded-lg border border-amber-200 bg-white p-2.5 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-amber-800/50 dark:bg-slate-900">
            <div className="flex min-w-0 flex-1 flex-col gap-2 text-left">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{form.formNo} - {form.category}</p>
                  <h3 className="mt-0.5 text-[13px] leading-4 text-slate-950 dark:text-white">{form.title}</h3>
                </div>
                <span className="max-w-[7rem] shrink-0 rounded-lg bg-amber-100 px-1.5 py-0.5 text-center text-[10px] font-black leading-3 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900">{form.clause || 'PDF'}</span>
              </div>
              <p className="text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{form.description}</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-amber-100 pt-2 dark:border-slate-800">
              <button type="button" onClick={() => onViewForm(form)} className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-2 py-1.5 text-[11px] font-black text-white hover:bg-amber-800">
                <FileSearch className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">View</span>
              </button>
              <a href={form.pdfPath} download className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <FileText className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">PDF</span>
              </a>
            </div>
          </article>
        ))}
        {visibleForms.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2 xl:col-span-3 dark:border-slate-700">
            No forms found
          </p>
        )}
      </div>
    </section>
  );
}
function FcoOffencesSection({ entries, onDownload, onPrint }: { entries: FcoOffenceEntry[]; onDownload: () => void; onPrint: () => void }) {
  return (
    <details className="group overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3 dark:border-slate-700 dark:bg-blue-950/30">
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">FCO Offences With Relevant FCO/ECA Provisions</h2>
          <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">Dropdown list for offence search and penal provision reference.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-800 shadow-sm transition group-open:bg-blue-700 group-open:text-white dark:bg-slate-950 dark:text-blue-200">
          {entries.length} offences
        </span>
      </summary>
      <div className="border-b border-blue-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-200">
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="w-16 px-3 py-2">Sl.No</th>
              <th className="px-3 py-2">Type of offence</th>
              <th className="w-48 px-3 py-2">Contravention provision</th>
              <th className="w-44 px-3 py-2">Punishment under ECA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((entry) => (
              <tr key={entry.serialNumber} className="align-top">
                <td className="px-3 py-2 font-black text-slate-700 dark:text-slate-200">{entry.serialNumber}</td>
                <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{entry.offenceType}</td>
                <td className="px-3 py-2 font-black text-blue-700 dark:text-blue-300">{entry.contraventionProvision}</td>
                <td className="px-3 py-2 font-black text-red-700 dark:text-red-300">{entry.punishmentProvision}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center font-semibold text-slate-500">No FCO offence entry matches the current search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function renderFcoOffencesPrintHtml(entries: FcoOffenceEntry[]) {
  const rows = entries.map((entry) => `<tr><td>${entry.serialNumber}</td><td>${escapeHtml(entry.offenceType)}</td><td>${escapeHtml(entry.contraventionProvision)}</td><td>${escapeHtml(entry.punishmentProvision)}</td></tr>`).join('');
  return `<!doctype html><html><head><title>FCO Offences With Relevant FCO/ECA Provisions</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111827}h1{text-align:center;color:#075985}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cbd5e1;padding:7px;vertical-align:top}th{background:#eff6ff}.note{margin-top:12px;background:#fffbeb;border:1px solid #f59e0b;padding:10px;font-weight:800;color:#78350f}</style></head><body><h1>FCO Offences With Relevant FCO/ECA Provisions</h1><table><thead><tr><th>Sl.No</th><th>Type of offence</th><th>Contravention provision</th><th>Punishment under ECA</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function PowersSection({ area }: { area: MainLegalArea }) {
  const visibleMappings = stopSaleSeizureMappings.filter((item) => {
    if (area === 'fertilizer') return item.group === 'Fertiliser cases under FCO 1985' || item.group === 'Fertiliser Movement Control Order cases';
    if (area === 'seed') return item.group === 'Seed cases under Seeds Act, 1966';
    return item.group === 'Insecticide cases under Insecticides Act, 1968';
  });
  const groups = Array.from(new Set(visibleMappings.map((item) => item.group)));
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{group}</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-800">
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
          <div key={workflow.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-black text-slate-950 dark:text-white">{workflow.title}</h3>
            <ol className="mt-3 space-y-2">
              {workflow.steps.map((step, index) => <li key={step} className="text-sm font-semibold text-slate-600 dark:text-slate-300">{index + 1}. {step}</li>)}
            </ol>
          </div>
        ))}
      </section>
    </div>
  );
}


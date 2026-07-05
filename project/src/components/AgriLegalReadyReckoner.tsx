import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Bug,
  Copy,
  Download,
  FileSearch,
  FileText,
  ClipboardList,
  FlaskConical,
  IndianRupee,
  Microscope,
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
} from 'lucide-react';
import { essentialCommoditiesActEntries, essentialCommoditiesCrossLinks, type EssentialCommoditiesActEntry } from '../data/essentialCommoditiesActData';
import { fcoOffenceEntries, type FcoOffenceEntry } from '../data/fcoOffencesData';
import { legalReadyReckonerEntries, type LegalCategory, type LegalReadyReckonerEntry } from '../data/legalReadyReckonerData';
import { fcoClauseCards, fcoMemoryMnemonic, importantFcoMnemonics, validateFcoClauseCoverage, type FcoClause, type FcoClauseCard, type FcoTabId, type FcoVariationNote } from '../data/fcoClauses';
import { fertilizerFormCategories, fertilizerForms, type FertilizerFormCategory, type FertilizerFormEntry } from '../data/fertilizerForms';
import { fertilizerSchedules, type FertilizerScheduleEntry } from '../data/fertilizerSchedules';
import { legalInspectionChecklists } from '../data/legalInspectionChecklists';
import { officerWorkflows, stopSaleSeizureMappings } from '../data/stopSaleSeizureData';
import { ShowCauseNoticeEntry } from './ShowCauseNoticeEntry';
import { BackButton } from './ui/BackButton';
import { FertilizerFormPdfGenerator } from './forms/FertilizerFormPdfGenerator';

type ReckonerView = 'references' | 'powers' | 'notice' | 'drafting';
type MainLegalArea = 'fertilizer' | 'seed' | 'insecticide';
type FertilizerSection = 'clauses' | 'forms' | 'schedules' | 'officer';
type OfficerCornerAction = 'offences' | 'stop-sale' | 'show-cause' | 'inspection';

const BOOKMARK_KEY = 'agri-legal-reckoner-bookmarks';
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
  seed: [
    { title: 'Seed Inspector Powers', description: 'Sampling, premises inspection, records and seizure references.', icon: ShieldAlert, category: 'Stop Sale / Seizure / Sampling', view: 'references', query: 'seed inspector' },
    { title: 'Seed Rules & Labels', description: 'Marking, labelling, purity, germination and sale checks.', icon: Sprout, category: 'Seeds', view: 'references' },
    { title: 'Seed Penalties', description: 'Penalty reference and prosecution linkage for seed cases.', icon: Scale, category: 'Penal Provisions', view: 'references', query: 'seed' },
    { title: 'Seed Notice Draft', description: 'Generate officer-ready notice text from field facts.', icon: FileText, category: 'Show Cause Notice', view: 'notice' },
  ],
  insecticide: [
    { title: 'Inspector Powers', description: 'Stop-sale, search, seizure, sample drawal and record checks.', icon: SprayCan, category: 'Stop Sale / Seizure / Sampling', view: 'references', query: 'insecticide inspector' },
    { title: 'Rules, Forms & Storage', description: 'Licence, records, labels, leaflet, packing and storage procedure.', icon: FileSearch, category: 'Insecticides', view: 'references' },
    { title: 'Offences & Punishment', description: 'Penal linkage under the Insecticides Act and Rules.', icon: Bug, category: 'Penal Provisions', view: 'references', query: 'insecticide' },
    { title: 'Case Drafting', description: 'Build inspection note, prosecution note and report language.', icon: Scale, category: 'Insecticides', view: 'drafting' },
  ],
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
  return /^(clause\s*)?\d+[a-z]?(?:\(\d+[a-z]?\))*$/i.test(value.trim());
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
function entryFallsInFcoRange(entry: LegalReadyReckonerEntry, range: [number, number]) {
  if (entry.lawName !== 'Fertiliser (Control) Order, 1985') return true;
  const values = [entry.referenceNumber, entry.nestedReference.clause, entry.nestedReference.subClause]
    .filter(Boolean)
    .flatMap((value) => String(value).match(/\d+/g) || [])
    .map(Number);
  if (values.length === 0) return true;
  return values.some((value) => value >= range[0] && value <= range[1]);
}

function readBookmarks() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as string[] : [];
  } catch {
    return [];
  }
}

function entrySearchText(entry: LegalReadyReckonerEntry) {
  return [
    entry.lawName,
    entry.referenceNumber,
    entry.referenceType,
    entry.parentProvision,
    entry.title,
    entry.officerExplanation,
    entry.exactViolationCovered,
    entry.officerPower,
    entry.fieldUse,
    entry.stopSaleSeizureSamplingRelevance,
    entry.linkedPenalProvision,
    entry.verificationStatus,
    entry.tags.join(' '),
  ].join(' ').toLowerCase();
}

export function AgriLegalReadyReckoner() {
  const navigate = useNavigate();
  const [view, setView] = useState<ReckonerView>('references');
  const [selectedLegalArea, setSelectedLegalArea] = useState<MainLegalArea | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LegalCategory>('Fertiliser');
  const [selectedFcoCardId, setSelectedFcoCardId] = useState<string | null>(null);
  const [fcoActiveTab, setFcoActiveTab] = useState<FcoTabId>('plainEnglish');
  const [selectedEntryId, setSelectedEntryId] = useState(legalReadyReckonerEntries[0]?.id || '');
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks());
  const [draftInputType, setDraftInputType] = useState('Fertiliser');
  const [draftViolation, setDraftViolation] = useState('');
  const [draftProduct, setDraftProduct] = useState('');
  const [draftDealer, setDraftDealer] = useState('');
  const [showFertilizerForms, setShowFertilizerForms] = useState(false);
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

  const isFcoClauseLookup = category === 'Fertiliser' && isFcoExactReferenceQuery(query);

  const filteredEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    return legalReadyReckonerEntries.filter((entry) => {
      if (entry.category !== category) return false;
      if (category === 'Fertiliser' && activeFcoCard && !entryFallsInFcoRange(entry, activeFcoCard.range)) return false;
      if (term && !entrySearchText(entry).includes(term)) return false;
      return true;
    });
  }, [activeFcoCard, category, query]);


  const selectedEntry = useMemo(
    () => legalReadyReckonerEntries.find((entry) => entry.id === selectedEntryId) || filteredEntries[0] || legalReadyReckonerEntries[0],
    [filteredEntries, selectedEntryId]
  );

  const filteredFcoOffences = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (category !== 'Fertiliser') return [];
    if (!term) return fcoOffenceEntries;
    return fcoOffenceEntries.filter((entry) =>
      [entry.serialNumber, entry.offenceType, entry.contraventionProvision, entry.punishmentProvision, entry.useInField, entry.sourceStatus]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [category, query]);

  const filteredEcaEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (category !== 'Essential Commodities Act') return [];
    if (!term) return essentialCommoditiesActEntries;
    return essentialCommoditiesActEntries.filter((entry) =>
      [
        entry.section,
        entry.title,
        entry.compactPoint.join(' '),
        entry.officerUse,
        entry.fertiliserRelevance,
        entry.linkedFcoClauses.join(' '),
        entry.linkedFmcoClauses.join(' '),
        entry.linkedPenalty,
        entry.tags.join(' '),
      ].join(' ').toLowerCase().includes(term)
    );
  }, [category, query]);

  const toggleBookmark = (entryId: string) => {
    setBookmarks((current) => current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId]);
  };

  const printSelectedEntry = () => {
    if (!selectedEntry) return;
    const popup = window.open('', '_blank', 'width=900,height=900');
    if (!popup) return;
    popup.document.write(`<html><head><title>${selectedEntry.referenceNumber}</title><style>body{font-family:Arial,sans-serif;line-height:1.55;padding:32px;color:#111827}dt{font-weight:700;margin-top:12px}dd{margin-left:0}</style></head><body><h1>${selectedEntry.title}</h1>${entryDetailsHtml(selectedEntry)}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const downloadSelectedEntry = () => {
    if (!selectedEntry) return;
    const text = [
      selectedEntry.title,
      `${selectedEntry.lawName} - ${selectedEntry.referenceNumber}`,
      `Type: ${selectedEntry.referenceType}`,
      `Parent: ${selectedEntry.parentProvision || selectedEntry.nestedReference.parentReference || '-'}`,
      `Explanation: ${selectedEntry.officerExplanation}`,
      `Violation: ${selectedEntry.exactViolationCovered}`,
      `Officer power: ${selectedEntry.officerPower || '-'}`,
      `Field use: ${selectedEntry.fieldUse}`,
      `Stop sale/seizure/sampling: ${selectedEntry.stopSaleSeizureSamplingRelevance || '-'}`,
      `Linked penal provision: ${selectedEntry.linkedPenalProvision || '-'}`,
      `Source: ${selectedEntry.sourceReferenceLink || '-'}`,
      `Verification: ${selectedEntry.verificationStatus}`,
      `Tags: ${selectedEntry.tags.join(', ')}`,
    ].join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEntry.referenceNumber.replace(/[\\/]/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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

  const suggestedDraft = useMemo(() => {
    const matched = legalReadyReckonerEntries.find((entry) =>
      entrySearchText(entry).includes(`${draftInputType} ${draftViolation}`.toLowerCase()) ||
      entrySearchText(entry).includes(draftViolation.toLowerCase())
    );
    return {
      reference: matched?.referenceNumber || 'Select exact verified provision before issue',
      penal: matched?.linkedPenalProvision || 'Select applicable penal provision from the source record',
      notice: `During inspection of ${draftDealer || 'the dealer/firm'}, irregularity regarding ${draftViolation || 'the observed violation'} was noticed in respect of ${draftProduct || 'the product'}. You are directed to explain why action should not be taken under the applicable Act/Order/Rules after review of the exact provision.`,
      prosecution: `Prosecution note should cite the exact verified violation provision, evidence collected, officer authority, sampling/seizure procedure followed and applicable penal provision.`,
      report: `Report to DAO/ADA/JDA with inspection date, dealer details, product/batch/quantity, exact verified provision, evidence, action taken and requested further orders.`,
    };
  }, [draftDealer, draftInputType, draftProduct, draftViolation]);

  const openLegalArea = (area: MainLegalArea) => {
    const areaCard = legalAreaCards.find((item) => item.id === area);
    setSelectedLegalArea(area);
    setView('references');
    setQuery('');
    setSelectedFcoCardId(null);
    if (areaCard) setCategory(areaCard.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTopic = (topic: (typeof legalTopicCards)[MainLegalArea][number]) => {
    setView(topic.view || 'references');
    setQuery(topic.query || '');
    setSelectedEntryId(legalReadyReckonerEntries[0]?.id || '');
    setSelectedFcoCardId(null);
    if (topic.category) setCategory(topic.category);
  };

  const closeLegalArea = () => {
    setSelectedLegalArea(null);
    setQuery('');
    setSelectedEntryId(legalReadyReckonerEntries[0]?.id || '');
    setSelectedFcoCardId(null);
    setView('references');
  };

  const handleBack = () => {
    if (selectedLegalArea === 'fertilizer' && fertilizerSection) {
      setFertilizerSection(null);
      setOfficerCornerAction(null);
      setSelectedFcoCardId(null);
      setShowFertilizerForms(false);
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
      <section className="overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 p-4 text-white shadow-sm dark:border-emerald-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 shadow-sm ring-1 ring-white/20">
              <Scale className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-100">Officer Toolkit</p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Agri Legal Ready Reckoner</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-emerald-50">
                Search Acts, Rules, Orders, clauses, penal provisions, stop sale, seizure, sampling and notice workflows.
              </p>
            </div>
          </div>
          <BackButton onClick={handleBack} tone="solid">Back</BackButton>
        </div>
      </section>
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

      {selectedLegalArea && selectedLegalArea !== 'fertilizer' && (
        <LegalTopicScreen
          area={selectedLegalArea}
          onOpenTopic={openTopic}
        />
      )}

      {selectedLegalArea && selectedLegalArea !== 'fertilizer' && (
        <>
      <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4`}>
        <ViewButton active={view === 'references'} icon={FileSearch} label="Legal References" onClick={() => setView('references')} />
        <ViewButton active={view === 'powers'} icon={ShieldAlert} label="Stop Sale & Seizure" onClick={() => setView('powers')} />
        <ViewButton active={view === 'notice'} icon={FileText} label="Show Cause Notice" onClick={() => setView('notice')} />
        <ViewButton active={view === 'drafting'} icon={Scale} label="Case Drafting Helper" onClick={() => setView('drafting')} />
      </div>
      {view === 'references' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Section 21(1)(d), Clause 28(1)(b), Rule 15(2), Form J, Schedule II, penalty, seizure..."
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            {category === 'Fertiliser' && showFertilizerForms && (
              <FertilizerFormsPanel
                search={formSearch}
                category={formCategory}
                onSearchChange={setFormSearch}
                onCategoryChange={setFormCategory}
                onBack={() => setShowFertilizerForms(false)}
                onViewForm={setSelectedFertilizerForm}
              />
            )}
            {category === 'Fertiliser' && !showFertilizerForms && activeFcoCard && (
              <FcoCardDetailPage
                card={activeFcoCard}
                activeTab={fcoActiveTab}
                bookmarks={bookmarks}
                onBack={() => setSelectedFcoCardId(null)}
                onToggleBookmark={toggleBookmark}
              />
            )}
            {category === 'Fertiliser' && !showFertilizerForms && !activeFcoCard && (
              <FcoDashboardCards
                cards={filteredFcoCards}
                activeCardId={selectedFcoCardId}
                showFormsCard={!isFcoClauseLookup}
                onOpenForms={() => {
                  setShowFertilizerForms(true);
                  setSelectedFcoCardId(null);
                }}
                onSelect={(cardId) => {
                  setSelectedFcoCardId(cardId);
                  setFcoActiveTab('plainEnglish');
                }}
              />
            )}

            {category === 'Fertiliser' && !showFertilizerForms && !activeFcoCard && !isFcoClauseLookup && (
              <FcoOffencesSection
                entries={filteredFcoOffences}
                onDownload={downloadFcoOffencesCsv}
                onPrint={printFcoOffences}
              />
            )}

            {category === 'Essential Commodities Act' && (
              <EssentialCommoditiesActSection entries={filteredEcaEntries} />
            )}

            {!activeFcoCard && category !== 'Fertiliser' && <div className="grid gap-3 md:grid-cols-2">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedEntryId(entry.id)}
                  className={`rounded-lg border p-3 text-left shadow-sm transition ${
                    selectedEntry?.id === entry.id ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 bg-white hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{entry.referenceNumber} &middot; {entry.referenceType}</p>
                      <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white">{entry.title}</h3>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{entry.officerExplanation}</p>
                </button>
              ))}
            </div>}
            {!activeFcoCard && category !== 'Fertiliser' && filteredEntries.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center font-semibold text-slate-500">No matching legal reference found. Try another keyword.</p>}
          </section>

          {selectedEntry && !activeFcoCard && category !== 'Fertiliser' && (
            <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{selectedEntry.lawName}</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{selectedEntry.referenceNumber}</h2>
                </div>
                <button type="button" onClick={() => toggleBookmark(selectedEntry.id)} className="rounded-lg border border-slate-200 p-2 text-emerald-700 hover:bg-emerald-50" aria-label="Bookmark">
                  {bookmarks.includes(selectedEntry.id) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                </button>
              </div>
              <Detail label="Title" value={selectedEntry.title} />
              <Detail label="Parent provision" value={selectedEntry.parentProvision || selectedEntry.nestedReference.parentReference || '-'} />
              <Detail label="Officer-friendly explanation" value={selectedEntry.officerExplanation} />
              <Detail label="Exact violation covered" value={selectedEntry.exactViolationCovered} />
              <Detail label="Officer power" value={selectedEntry.officerPower || '-'} />
              <Detail label="Field inspection use" value={selectedEntry.fieldUse} />
              <Detail label="Stop sale / seizure / sampling relevance" value={selectedEntry.stopSaleSeizureSamplingRelevance || '-'} />
              <Detail label="Linked penal provision" value={selectedEntry.linkedPenalProvision || '-'} />
              <Detail label="Source/reference link" value={selectedEntry.sourceReferenceLink || '-'} />
              <div className="mt-3 flex flex-wrap gap-1">
                {selectedEntry.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>)}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={printSelectedEntry} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white hover:bg-emerald-800">
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button type="button" onClick={downloadSelectedEntry} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 dark:text-slate-200">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </aside>
          )}
        </div>
      )}

      {view === 'powers' && selectedLegalArea && <PowersSection area={selectedLegalArea} />}
      {view === 'notice' && <ShowCauseNoticeEntry />}
      {view === 'drafting' && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Case Drafting Helper</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextField label="Input type" value={draftInputType} onChange={setDraftInputType} />
            <TextField label="Violation observed" value={draftViolation} onChange={setDraftViolation} />
            <TextField label="Product name" value={draftProduct} onChange={setDraftProduct} />
            <TextField label="Dealer/firm name" value={draftDealer} onChange={setDraftDealer} />
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <DraftCard title="Applicable provision" body={suggestedDraft.reference} />
            <DraftCard title="Penal provision" body={suggestedDraft.penal} />
            <DraftCard title="Suggested notice wording" body={suggestedDraft.notice} />
            <DraftCard title="Suggested FIR/prosecution note" body={suggestedDraft.prosecution} />
            <DraftCard title="Suggested report to DAO/ADA/JDA" body={suggestedDraft.report} />

          </div>
        </section>
      )}
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
    { id: 'forms', title: 'Forms', subtitle: '27 Forms', description: 'Registration, manufacturing, sampling and business record forms.', icon: FileText, tone: 'from-amber-500 via-orange-400 to-emerald-600' },
    { id: 'schedules', title: 'Schedules', subtitle: '8 Schedules', description: 'Specifications, sampling procedures, tolerance limits and analysis methods.', icon: ClipboardList, tone: 'from-sky-500 via-cyan-500 to-emerald-600' },
    { id: 'officer', title: 'Officer Corner', subtitle: 'Field actions & notices', description: 'Offences, stop sale, show cause and inspection references.', icon: ShieldAlert, tone: 'from-rose-500 via-orange-500 to-amber-500' },
  ];

  return (
    <section className="space-y-3 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-emerald-500 to-teal-700 text-white shadow-lg shadow-amber-500/20">
          <PackageCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Fertilizer</h2>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Open clauses, forms, schedules, or officer field actions.</p>
        </div>
      </div>
      <FcoImplementationChart />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenSection(card.id)}
              className="group relative min-h-[9.5rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-950"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.tone} opacity-15 transition group-hover:opacity-25`} />
              <div className="relative flex h-full flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${card.tone} text-white shadow-sm transition group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-black text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900/85 dark:text-slate-100 dark:ring-slate-700">{card.subtitle}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">{card.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">{card.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
    </section>
  );
}

const fcoImplementationColumns = [
  {
    title: 'Licensing',
    subtitle: 'Clause 8 & 14',
    tone: 'cyan',
    items: [
      'Clause 8 and Clause 14',
      'C&DA / State Licensing Officer',
      'Manufacturing Licence in Form F',
      'Marketing Licence in Form A2',
    ],
  },
  {
    title: 'Notified Authorities',
    subtitle: 'Clause 26A / Clause 8',
    tone: 'cyan',
    items: [
      'DAO: District Licensing Officer',
      'ADA: Division Licensing Officer',
      'Marketing Licence in Form A2',
    ],
  },
  {
    title: 'Quality Monitoring / Testing',
    subtitle: 'Clause 29: Laboratory and Analysts',
    tone: 'green',
    items: ['3 FCO Labs', '64 labs in country', 'CFQCTI Faridabad'],
  },
  {
    title: 'Enforcement at Field Level',
    subtitle: 'Clause 27 and 28',
    tone: 'blue',
    items: [
      'Clause 27',
      'All Agriculture Officers and above rank notified as Fertiliser Inspectors as per G.O.Ms.No.131',
      'Inspects all licensed premises in jurisdiction',
      'Draws samples for testing',
      'Launches prosecution in case of breach of Act/Order',
      'Sends inspection reports to licensing officer',
    ],
  },
];

function FcoImplementationChart() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:p-4">
      <div className="mx-auto mb-4 flex max-w-md items-center justify-center rounded-lg bg-cyan-500 px-4 py-3 text-center text-base font-black uppercase text-slate-950 shadow-sm sm:text-lg">
        Implementation of FCO, 1985
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        {fcoImplementationColumns.map((column) => (
          <div key={column.title} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className={`rounded-lg border px-3 py-4 text-center ${column.tone === 'green' ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100' : column.tone === 'blue' ? 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100' : 'border-cyan-300 bg-cyan-50 text-slate-950 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-50'}`}>
              <h3 className="text-base font-black uppercase leading-tight sm:text-lg">{column.title}</h3>
              <p className="mt-2 text-sm font-black leading-5">{column.subtitle}</p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {column.items.map((item) => (
                <div key={item} className={`flex min-h-12 items-center justify-center rounded-lg border bg-white px-3 py-3 text-center text-sm font-black leading-5 text-slate-800 dark:bg-slate-950 dark:text-slate-100 ${column.tone === 'green' ? 'border-emerald-200 dark:border-emerald-900' : column.tone === 'blue' ? 'border-blue-200 dark:border-blue-900' : 'border-cyan-200 dark:border-cyan-900'}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-center text-sm font-black text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        Verify latest Government notification and departmental instructions before legal action.
      </p>
    </div>
  );
}

function FertilizerSectionHeader({ title, subtitle, icon: Icon, onBack }: { title: string; subtitle: string; icon: React.ElementType; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Fertilizer</p>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>
      </div>
      <button type="button" onClick={onBack} className="w-fit rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-200">
        Back
      </button>
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
  onBack: () => void;
  onBackToCards: () => void;
  onSelectCard: (cardId: string) => void;
  onToggleBookmark: (id: string) => void;
}) {
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
      {activeCard ? (
        <FcoCardDetailPage
          card={activeCard}
          activeTab={activeTab}
          bookmarks={bookmarks}
          onBack={onBackToCards}
          onToggleBookmark={onToggleBookmark}
        />
      ) : cards.length > 0 ? (
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
      <div className="grid gap-3 md:grid-cols-2">
        {visibleSchedules.map((schedule) => (
          <details key={schedule.id} className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <summary className="cursor-pointer list-none">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{schedule.scheduleNo}</p>
              <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white">{schedule.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">{schedule.subtitle}</p>
            </summary>
            <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {schedule.parts.map((part) => (
                <li key={part.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200">{part.label}</li>
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
    { id: 'show-cause', title: 'Issue Memo / Show Cause Notice', subtitle: 'Notice drafting helper', icon: FileText },
    { id: 'inspection', title: 'Inspection', subtitle: 'Field inspection checklist', icon: ClipboardList },
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
      {action === 'show-cause' && <ShowCauseNoticeEntry />}
      {action === 'inspection' && <InspectionChecklistPanel />}
    </section>
  );
}

function InspectionChecklistPanel() {
  const checklists = legalInspectionChecklists.filter((item) => item.id.includes('fertilizer') || item.id.includes('fertiliser'));
  if (checklists.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">No inspection checklist found</p>;
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {checklists.map((checklist) => (
        <section key={checklist.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-base font-black text-slate-950 dark:text-white">{checklist.title}</h3>
          <div className="mt-3 space-y-2">
            {checklist.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{item.reference}</p>
                <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-900">{item.verificationStatus}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
function LegalAreaOpeningScreen({ onOpen }: { onOpen: (area: MainLegalArea) => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-[linear-gradient(135deg,#f7fee7_0%,#ecfdf5_48%,#eff6ff_100%)] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-xl font-black text-emerald-950 dark:text-white sm:text-2xl">Select input category</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900/75 dark:text-slate-300">
          Open the legal ready reckoner by input type for faster field inspection reference.
        </p>
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
              className={`agri-legal-round-card group relative mx-auto flex aspect-square w-full max-w-[11.5rem] flex-col items-center justify-center overflow-hidden rounded-full border border-white/80 bg-gradient-to-br from-white via-lime-50 to-emerald-50 p-4 text-center shadow-lg ${card.glow} ring-1 ring-emerald-900/5 transition duration-300 hover:-translate-y-2 hover:scale-[1.06] hover:rotate-[1deg] hover:shadow-2xl focus-visible:outline-emerald-700 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950`}
            >
              <span className={`absolute inset-2 rounded-full bg-gradient-to-br ${card.color} opacity-[0.18] transition group-hover:opacity-[0.28]`} />
              <span className="agri-card-field-lines absolute inset-4 rounded-full" />
              <span className="agri-card-shine absolute inset-0 rounded-full" />
              <span className="agri-legal-ripple absolute inset-0 rounded-full" />
              <span className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${card.color} text-white shadow-lg ${card.glow} ring-4 ring-white/80 transition duration-300 group-hover:scale-110 group-hover:rotate-3 sm:h-16 sm:w-16`}>
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.9} />
              </span>
              <span className="relative mt-3 text-base font-black sm:text-lg text-emerald-950 dark:text-white">{card.title}</span>
              <span className="relative mt-1 max-w-[9.5rem] text-[11px] font-bold leading-4 text-emerald-900/75 dark:text-slate-300">{card.description}</span>
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
              className="agri-topic-card group rounded-lg border border-slate-200 bg-slate-50 p-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 active:scale-[0.99] dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-emerald-950/20"
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




function EssentialCommoditiesActSection({ entries }: { entries: EssentialCommoditiesActEntry[] }) {
  return (
    <details className="group overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3 dark:border-slate-700 dark:bg-blue-950/30">
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Essential Commodities Act, 1955 - Officer Reference</h2>
          <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">Compact ECA points linked with FCO/FMCO enforcement, seizure, prosecution and FIR helper use.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-800 shadow-sm transition group-open:bg-blue-700 group-open:text-white dark:bg-slate-950 dark:text-blue-200">
          {entries.length} entries
        </span>
      </summary>
      <div className="space-y-3 p-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <h3 className="text-sm font-black text-slate-950 dark:text-white">FCO / ECA Cross-links</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {essentialCommoditiesCrossLinks.map((link) => (
              <div key={link.label} className="rounded-md border border-white bg-white p-2 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                <span className="font-black text-amber-700 dark:text-amber-300">{link.label}</span>: {link.links.join(', ')}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">{entry.section}</p>
                  <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white">{entry.title}</h3>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-800">{entry.sourceStatus}</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                {entry.compactPoint.map((point) => <li key={point}>- {point}</li>)}
              </ul>
              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <p><span className="font-black text-slate-900 dark:text-white">Officer use:</span> {entry.officerUse}</p>
                <p><span className="font-black text-slate-900 dark:text-white">Fertiliser relevance:</span> {entry.fertiliserRelevance}</p>
                {entry.linkedFcoClauses.length > 0 && <p><span className="font-black text-slate-900 dark:text-white">Linked FCO:</span> {entry.linkedFcoClauses.join(', ')}</p>}
                {entry.linkedFmcoClauses.length > 0 && <p><span className="font-black text-slate-900 dark:text-white">Linked FMCO:</span> {entry.linkedFmcoClauses.join(', ')}</p>}
                {entry.linkedPenalty && <p><span className="font-black text-red-700 dark:text-red-300">Penalty:</span> {entry.linkedPenalty}</p>}
              </div>
            </article>
          ))}
          {entries.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500 lg:col-span-2">
              No Essential Commodities Act entry matches the current search.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

function FcoCardDetailPage({
  card,
  activeTab,
  bookmarks,
  onBack,
  onToggleBookmark,
}: {
  card: FcoClauseCard;
  activeTab: FcoTabId;
  bookmarks: string[];
  onBack: () => void;
  onToggleBookmark: (id: string) => void;
}) {
  const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;

  return (
    <section className="overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className={`bg-gradient-to-br ${card.gradient} p-4 text-white`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/20 p-3 ring-1 ring-white/25">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-white/80">Card {card.cardNo} - {card.clauseRange}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight">{card.cardTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-white/90">{card.summary}</p>
            </div>
          </div>
          <button type="button" onClick={onBack} className="w-fit rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/20">
            Back to cards
          </button>
        </div>
      </div>


      <div className="space-y-3 p-3">
        {card.clauses.map((clause) => (
          <FcoClauseAccordion
            key={clause.id}
            clause={clause}
            activeTab={activeTab}
            bookmarked={bookmarks.includes(clause.id)}
            onToggleBookmark={() => onToggleBookmark(clause.id)}
          />
        ))}
      </div>
    </section>
  );
}

function FcoClauseAccordion({ clause, activeTab, bookmarked, onToggleBookmark }: { clause: FcoClause; activeTab: FcoTabId; bookmarked: boolean; onToggleBookmark: () => void }) {
  const copyClause = () => navigator.clipboard?.writeText(fcoClauseToText(clause));
  const shareClause = async () => {
    const text = fcoClauseToText(clause);
    if (navigator.share) await navigator.share({ title: `FCO Clause ${clause.clauseNo}`, text });
    else await navigator.clipboard?.writeText(text);
  };

  return (
    <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" open>
      <summary className="flex cursor-pointer list-none flex-col gap-3 border-b border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Clause {clause.clauseNo} - {clause.category}</p>
          <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white">{clause.title}</h3>
          <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">{clause.summary}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={(event) => { event.preventDefault(); onToggleBookmark(); }} className="rounded-lg border border-slate-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900" aria-label="Bookmark clause">
            {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); copyClause(); }} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-label="Copy clause">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); void shareClause(); }} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-label="Share clause">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </summary>
      <div className="space-y-3 p-3">
        <FcoClauseTabContent clause={clause} activeTab={activeTab} />
        {clause.subClauses.length > 0 && (
          <div className="space-y-2">
            {clause.subClauses.map((subClause) => (
              <details key={subClause.no} className="rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <summary className="cursor-pointer list-none px-3 py-2 text-sm font-black text-slate-900 dark:text-white">{subClause.no} - {subClause.plainEnglish}</summary>
                <div className="space-y-2 border-t border-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  <p>{subClause.legalText}</p>
                  {subClause.officerAction && <p><span className="font-black text-amber-700 dark:text-amber-300">Officer:</span> {subClause.officerAction.join('; ')}</p>}
                  {subClause.dealerObligation && <p><span className="font-black text-blue-700 dark:text-blue-300">Dealer:</span> {subClause.dealerObligation.join('; ')}</p>}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(`${subClause.no}: ${subClause.legalText}\n${subClause.plainEnglish}`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <Copy className="h-3.5 w-3.5" /> Copy sub-clause
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}


function FcoClauseTabContent({ clause, activeTab }: { clause: FcoClause; activeTab: FcoTabId }) {
  if (activeTab === 'fullText') return <FcoTextBlock items={[clause.legalText, ...clause.explanations.map((item) => `Explanation: ${item}`), ...clause.provisos.map((item) => `${item.title}: ${item.legalText}`)]} />;
  if (activeTab === 'plainEnglish') return <FcoTextBlock items={[clause.plainEnglish, clause.summary]} />;
  if (activeTab === 'officerAction') return <FcoTextBlock items={clause.subClauses.flatMap((item) => item.officerAction || []).concat(clause.subClauses.flatMap((item) => item.dealerObligation?.map((obligationText) => `Dealer obligation: ${obligationText}`) || []))} empty="No specific officer action listed for this clause." />;
  if (activeTab === 'formsTimelines') return <FcoTextBlock items={[...clause.forms.map((item) => `Form: ${item}`), ...clause.timelines.map((item) => `Timeline: ${item}`), ...clause.related.map((item) => `Related: ${item}`)]} empty="No specific form or timeline listed for this clause." />;
  return <FcoTextBlock items={[clause.mnemonic || '', ...importantFcoMnemonics.filter((item) => clause.clauseNo === item.label.replace('Clause ', '') || clause.keywords.join(' ').toLowerCase().includes(item.code.toLowerCase())).map((item) => `${item.label}: ${item.code} - ${item.meaning}`)]} empty="No mnemonic listed for this clause." />;
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
    ...clause.subClauses.map((item) => `${item.no}: ${item.legalText} - ${item.plainEnglish}`),
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
    <section className="overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">      <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {showFormsCard && (
          <button
            type="button"
            onClick={onOpenForms}
            className="group relative min-h-[13rem] overflow-hidden rounded-lg border border-amber-200 bg-white p-4 text-left text-slate-900 shadow-sm transition duration-300 motion-safe:hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-50/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-amber-950/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-400 to-emerald-500 opacity-15 transition group-hover:opacity-20" />
            <div className="relative flex h-full flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-white/85 p-3 text-amber-800 shadow-sm ring-1 ring-amber-100 motion-safe:transition motion-safe:group-hover:scale-105 dark:bg-slate-950/80 dark:text-amber-200 dark:ring-amber-900">
                  <FileText className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950/80 dark:text-slate-100 dark:ring-slate-700">27 statutory forms</span>
              </div>
              <div>
                <h3 className="text-xl font-black leading-tight text-slate-950 dark:text-white">Forms</h3>
                <p className="mt-2 text-sm font-bold leading-5 text-slate-700 dark:text-slate-200">FCO statutory forms grouped for registration, manufacturing, sampling and records.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Search', 'Preview', 'Download'].map((item) => (
                  <span key={item} className="rounded-full bg-white/75 px-2 py-1 text-[11px] font-black text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/75 dark:text-slate-200 dark:ring-slate-700">
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
              className={`group relative min-h-[13rem] overflow-hidden rounded-lg border p-4 text-left shadow-sm transition duration-300 motion-safe:hover:-translate-y-1 ${
                active ? 'border-amber-300 bg-amber-50 text-slate-950 shadow-md' : 'border-slate-200 bg-white text-slate-900 hover:border-amber-200 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-amber-950/20'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-15 transition group-hover:opacity-20`} />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-lg bg-white/80 p-3 text-amber-800 shadow-sm ring-1 ring-amber-100 motion-safe:transition motion-safe:group-hover:scale-105 dark:bg-slate-950/80 dark:text-amber-200 dark:ring-amber-900">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950/80 dark:text-slate-100 dark:ring-slate-700">{card.clauseRange}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black leading-tight text-slate-950 dark:text-white">{card.cardTitle}</h3>
                  <p className="mt-2 text-sm font-bold leading-5 text-slate-700 dark:text-slate-200">{card.summary}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {card.contains.slice(0, 5).map((item) => (
                    <span key={item} className="rounded-full bg-white/75 px-2 py-1 text-[11px] font-black text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/75 dark:text-slate-200 dark:ring-slate-700">
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
function fertilizerFormPdfUrl(form: FertilizerFormEntry) {
  return `${form.pdfPath}#page=${form.page}&zoom=page-width`;
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
      <div className="border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-lg bg-white p-3 text-amber-800 shadow-sm ring-1 ring-amber-100 dark:bg-slate-900 dark:text-amber-200 dark:ring-amber-900">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">FCO Forms</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Forms</h2>
              <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">Tap a form card to show preview, download, and share actions.</p>
            </div>
          </div>
          <button type="button" onClick={onBack} className="w-fit rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-800 shadow-sm hover:bg-amber-50 dark:border-amber-900 dark:bg-slate-950 dark:text-amber-200">
            Back
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search form number, title, clause, category..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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

      <div className="grid auto-rows-fr gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleForms.map((form) => (
          <details key={form.id} className="group min-h-[12rem] min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-amber-200 hover:shadow-md open:border-amber-300 open:bg-amber-50/40 dark:border-slate-700 dark:bg-slate-900 dark:open:bg-amber-950/10">
            <summary className="flex h-full cursor-pointer list-none flex-col gap-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{form.formNo} - {form.category}</p>
                  <h3 className="mt-1 text-sm font-black leading-5 text-slate-950 dark:text-white">{form.title}</h3>
                </div>
                <span className="max-w-[7rem] shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-center text-[10px] font-black leading-3 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900">{form.clause || 'PDF'}</span>
              </div>
              <p className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{form.description}</p>
              <span className="mt-auto inline-flex w-fit rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-amber-800 group-open:hidden dark:border-amber-900 dark:bg-slate-950 dark:text-amber-200">
                Tap to open
              </span>
            </summary>
            <div className="mt-3 grid gap-2 border-t border-amber-100 pt-3 sm:grid-cols-3 dark:border-slate-800">
              <button type="button" onClick={() => onViewForm(form)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-2.5 py-2 text-xs font-black text-white hover:bg-amber-800">
                <FileSearch className="h-4 w-4" /> Preview
              </button>
              <a href={form.pdfPath} download className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <Download className="h-4 w-4" /> PDF
              </a>
              <button type="button" onClick={() => shareFertilizerForm(form)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-200">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </details>
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
async function shareFertilizerForm(form: FertilizerFormEntry) {
  const url = `${window.location.origin}${fertilizerFormPdfUrl(form)}`;
  const text = `${form.formNo}: ${form.title}\n${url}`;
  if (navigator.share) {
    await navigator.share({ title: `${form.formNo} - FCO Form`, text, url });
    return;
  }
  await navigator.clipboard?.writeText(text);
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
            <Download className="h-4 w-4" />
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 py-2 first:border-t-0 dark:border-slate-800">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
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


function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
    </label>
  );
}

function DraftCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
      <h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  );
}

function entryDetailsHtml(entry: LegalReadyReckonerEntry) {
  const fields = [
    ['Law/order name', entry.lawName],
    ['Exact reference number', entry.referenceNumber],
    ['Reference type', entry.referenceType],
    ['Parent provision', entry.parentProvision || entry.nestedReference.parentReference || '-'],
    ['Explanation', entry.officerExplanation],
    ['Exact violation covered', entry.exactViolationCovered],
    ['Officer power', entry.officerPower || '-'],
    ['Field inspection use', entry.fieldUse],
    ['Stop sale/seizure/sampling relevance', entry.stopSaleSeizureSamplingRelevance || '-'],
    ['Linked penal provision', entry.linkedPenalProvision || '-'],
    ['Source/reference link', entry.sourceReferenceLink || '-'],
    ['Verification status', entry.verificationStatus],
    ['Tags', entry.tags.join(', ')],
  ];
  return `<dl>${fields.map(([label, value]) => `<dt>${label}</dt><dd>${String(value).replace(/</g, '&lt;')}</dd>`).join('')}</dl>`;
}










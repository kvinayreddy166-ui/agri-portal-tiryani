import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Copy,
  Download,
  FileSearch,
  FileText,
  FlaskConical,
  IndianRupee,
  Microscope,
  Printer,
  Scale,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';
import { essentialCommoditiesActEntries, essentialCommoditiesCrossLinks, type EssentialCommoditiesActEntry } from '../data/essentialCommoditiesActData';
import { fcoOffenceEntries, type FcoOffenceEntry } from '../data/fcoOffencesData';
import { fertiliserLegalCharts, type FertiliserLegalChart } from '../data/fertiliserLegalCharts';
import { legalReadyReckonerEntries, type LegalCategory, type LegalReadyReckonerEntry } from '../data/legalReadyReckonerData';
import { fcoClauseCards, fcoDashboardStats, fcoMemoryMnemonic, importantFcoMnemonics, validateFcoClauseCoverage, type FcoClause, type FcoClauseCard, type FcoTabId, type FcoVariationNote } from '../data/fcoClauses';
import { officerWorkflows, stopSaleSeizureMappings } from '../data/stopSaleSeizureData';
import { ShowCauseNoticeEntry } from './ShowCauseNoticeEntry';
import { BackButton } from './ui/BackButton';

type ReckonerView = 'references' | 'powers' | 'notice' | 'drafting';

const categoryFilters: LegalCategory[] = [
  'Fertiliser',
  'Fertiliser Movement',
  'Insecticides',
  'Seeds',
  'Essential Commodities Act',
  'Stop Sale / Seizure / Sampling',
  'Penal Provisions',
  'Show Cause Notice',
];

const BOOKMARK_KEY = 'agri-legal-reckoner-bookmarks';

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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LegalCategory>('Fertiliser');
  const [selectedFcoCardId, setSelectedFcoCardId] = useState<string | null>(null);
  const [fcoActiveTab, setFcoActiveTab] = useState<FcoTabId>('plainEnglish');
  const [penaltyOnly, setPenaltyOnly] = useState(false);
  const [powersOnly, setPowersOnly] = useState(false);
  const [nestedOnly, setNestedOnly] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState(legalReadyReckonerEntries[0]?.id || '');
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks());
  const chartRef = useRef<HTMLDivElement>(null);
  const [draftInputType, setDraftInputType] = useState('Fertiliser');
  const [draftViolation, setDraftViolation] = useState('');
  const [draftProduct, setDraftProduct] = useState('');
  const [draftDealer, setDraftDealer] = useState('');

  useEffect(() => {
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    validateFcoClauseCoverage();
  }, []);

  const activeFcoCard = useMemo(() => fcoClauseCards.find((card) => card.id === selectedFcoCardId) || null, [selectedFcoCardId]);

  const filteredFcoCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return fcoClauseCards;
    return fcoClauseCards.filter((card) => fcoCardSearchText(card).includes(term));
  }, [query]);

  const filteredEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    return legalReadyReckonerEntries.filter((entry) => {
      if (entry.category !== category) return false;
      if (category === 'Fertiliser' && activeFcoCard && !entryFallsInFcoRange(entry, activeFcoCard.range)) return false;
      if (penaltyOnly && entry.category !== 'Penal Provisions' && !entry.linkedPenalProvision?.toLowerCase().includes('penal')) return false;
      if (powersOnly && !entry.tags.some((tag) => ['stop sale', 'seizure', 'sampling', 'sample', 'search', 'powers', 'detention'].includes(tag.toLowerCase()))) return false;
      if (nestedOnly && !['sub-section', 'sub-clause', 'sub-rule', 'proviso'].includes(entry.referenceType)) return false;
      if (term && !entrySearchText(entry).includes(term)) return false;
      return true;
    });
  }, [activeFcoCard, category, nestedOnly, penaltyOnly, powersOnly, query]);


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

  const fcoImplementationChart = fertiliserLegalCharts.find((chart) => chart.id === 'implementation-of-fco-1985') || fertiliserLegalCharts[0];

  const printFertiliserChart = () => {
    if (!fcoImplementationChart) return;
    const popup = window.open('', '_blank', 'width=1100,height=900');
    if (!popup) return;
    popup.document.write(renderFertiliserChartPrintHtml(fcoImplementationChart));
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const downloadFertiliserChart = async () => {
    if (!chartRef.current || !fcoImplementationChart) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${fcoImplementationChart.id}.png`;
    link.click();
  };

  const printFcoOffences = () => {
    const popup = window.open('', '_blank', 'width=1100,height=900');
    if (!popup) return;
    popup.document.write(renderFcoOffencesPrintHtml(filteredFcoOffences));
    popup.document.close();
    popup.focus();
    popup.print();
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

  const suggestedDraft = useMemo(() => {
    const matched = legalReadyReckonerEntries.find((entry) =>
      entrySearchText(entry).includes(`${draftInputType} ${draftViolation}`.toLowerCase()) ||
      entrySearchText(entry).includes(draftViolation.toLowerCase())
    );
    return {
      reference: matched?.referenceNumber || 'Select exact verified provision before issue',
      penal: matched?.linkedPenalProvision || 'Verify applicable penal provision from official source',
      notice: `During inspection of ${draftDealer || 'the dealer/firm'}, irregularity regarding ${draftViolation || 'the observed violation'} was noticed in respect of ${draftProduct || 'the product'}. You are directed to explain why action should not be taken under the applicable Act/Order/Rules after verification of the exact provision.`,
      prosecution: `Prosecution note should cite the exact verified violation provision, evidence collected, officer authority, sampling/seizure procedure followed and applicable penal provision. Do not file without latest official source verification.`,
      report: `Report to DAO/ADA/JDA with inspection date, dealer details, product/batch/quantity, exact verified provision, evidence, action taken and requested further orders.`,
    };
  }, [draftDealer, draftInputType, draftProduct, draftViolation]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Scale className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-wide">Officer Tool Kit</span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Agri Legal Ready Reckoner</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600 dark:text-slate-300">
              Search Acts, Rules, Orders, clauses, sections, penal provisions, stop sale, seizure, sampling and notice workflows for agriculture input inspection.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <BackButton onClick={() => navigate('/officer-toolkit')}>Back</BackButton>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
              Official text not found in repo. Starter entries are marked for verification.
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <ViewButton active={view === 'references'} icon={FileSearch} label="Legal References" onClick={() => setView('references')} />
        <ViewButton active={view === 'powers'} icon={ShieldAlert} label="Stop Sale & Seizure" onClick={() => setView('powers')} />
        <ViewButton active={view === 'notice'} icon={FileText} label="Show Cause Notice" onClick={() => setView('notice')} />
        <ViewButton active={view === 'drafting'} icon={Scale} label="Case Drafting Helper" onClick={() => setView('drafting')} />
      </div>

      {view === 'references' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Section 21(1)(d), Clause 28(1)(b), Rule 15(2), Form J, Schedule II, penalty, seizure..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as LegalCategory)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {categoryFilters.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Toggle label="Penalty only" checked={penaltyOnly} onChange={setPenaltyOnly} />
              <Toggle label="Stop Sale / Seizure only" checked={powersOnly} onChange={setPowersOnly} />
              <Toggle label="Sub-section / Sub-clause view" checked={nestedOnly} onChange={setNestedOnly} />
            </div>
            {category === 'Fertiliser' && activeFcoCard && (
              <FcoCardDetailPage
                card={activeFcoCard}
                activeTab={fcoActiveTab}
                bookmarks={bookmarks}
                onBack={() => setSelectedFcoCardId(null)}
                onTabChange={setFcoActiveTab}
                onToggleBookmark={toggleBookmark}
              />
            )}
            {category === 'Fertiliser' && !activeFcoCard && fcoImplementationChart && (
              <>
                <FcoMasterMnemonicCard />
                <FcoImplementationChart
                  chart={fcoImplementationChart}
                  chartRef={chartRef}
                  onDownload={downloadFertiliserChart}
                  onPrint={printFertiliserChart}
                />
                <FcoDashboardCards
                  cards={filteredFcoCards}
                  activeCardId={selectedFcoCardId}
                  onSelect={(cardId) => {
                    setSelectedFcoCardId(cardId);
                    setFcoActiveTab('plainEnglish');
                  }}
                />
              </>
            )}

            {category === 'Fertiliser' && !activeFcoCard && (
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
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{entry.referenceNumber} &middot; {entry.referenceType}</p>
                      <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white">{entry.title}</h3>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${entry.verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : entry.verificationStatus === 'verify latest' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {entry.verificationStatus}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{entry.officerExplanation}</p>
                </button>
              ))}
            </div>}
            {!activeFcoCard && category !== 'Fertiliser' && filteredEntries.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center font-semibold text-slate-500">No legal entry matches the current filters.</p>}
          </section>

          {selectedEntry && !activeFcoCard && category !== 'Fertiliser' && (
            <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{selectedEntry.lawName}</p>
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
              <Detail label="Verification status" value={selectedEntry.verificationStatus} />
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

      {view === 'powers' && <PowersSection />}
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
            <DraftCard title="Caution notes" body="Do not mention wrong provision. Do not seize without recording reason to believe. Follow exact sampling procedure. Verify latest Gazette, India Code and State instructions before FIR, prosecution, suspension or cancellation." />
          </div>
        </section>
      )}

      <footer className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
        This is a quick reference tool for departmental use. For prosecution, seizure, suspension, cancellation, FIR or court filing, verify the latest official Gazette, India Code and State Government departmental instructions.
      </footer>
    </div>
  );
}

function ViewButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-black shadow-sm transition ${
        active ? 'border-emerald-300 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0">{label}</span>
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-500" />
      {label}
    </label>
  );
}

function FcoMasterMnemonicCard() {
  return (
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-slate-800 dark:bg-emerald-950/30">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Master Mnemonic</p>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-black tracking-wide text-slate-950 dark:text-white">{fcoMemoryMnemonic.code}</h2>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{fcoMemoryMnemonic.sentence}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {fcoMemoryMnemonic.lines.map(([letter, word]) => (
          <span key={`${letter}-${word}`} className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            {letter}: {word}
          </span>
        ))}
      </div>
    </section>
  );
}

const fco3dPalette: Record<FertiliserLegalChart['branches'][number]['accent'], { color: string; emissive: string; text: string }> = {
  cyan: { color: '#99f6e4', emissive: '#0891b2', text: '#083344' },
  green: { color: '#bbf7d0', emissive: '#16a34a', text: '#052e16' },
  blue: { color: '#bfdbfe', emissive: '#2563eb', text: '#172554' },
};

const fco3dPanelPositions: Array<[number, number, number]> = [
  [-3.1, 0.34, 0],
  [-1.02, -1.18, 0.28],
  [1.02, -1.18, 0.28],
  [3.1, 0.34, 0],
];

function FcoImplementationChart({
  chart,
  chartRef,
  onDownload,
  onPrint,
}: {
  chart: FertiliserLegalChart;
  chartRef: React.RefObject<HTMLDivElement>;
  onDownload: () => void;
  onPrint: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-wrap justify-end gap-2 border-b border-blue-100 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
        <button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-800">
          <Printer className="h-4 w-4" />
          Print Chart
        </button>
        <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-800 shadow-sm hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-200">
          <Download className="h-4 w-4" />
          Download PNG
        </button>
      </div>

      <div ref={chartRef} className="relative h-[25rem] min-h-[23rem] overflow-hidden bg-slate-950 sm:h-[29rem]" aria-label="Animated 3D chart for Implementation of FCO, 1985">
        <Canvas camera={{ position: [0, 0.85, 7.8], fov: 47 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
          <color attach="background" args={['#ecfeff']} />
          <fog attach="fog" args={['#ecfeff', 9, 16]} />
          <ambientLight intensity={1.25} />
          <directionalLight position={[3, 5, 4]} intensity={1.4} />
          <pointLight position={[-4, 2, 5]} intensity={1.3} color="#22d3ee" />
          <React.Suspense fallback={null}>
            <FcoImplementationScene chart={chart} />
          </React.Suspense>
          <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 2.05} />
        </Canvas>
        <div className="pointer-events-none absolute left-4 top-4 max-w-sm rounded-lg border border-white/70 bg-white/75 px-4 py-3 text-slate-900 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/70 dark:text-white">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Animated 3D Chart</p>
          <h2 className="mt-1 text-lg font-black">{chart.topNode}</h2>
          <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">Drag to inspect the compact implementation map.</p>
        </div>
      </div>
    </section>
  );
}

function FcoImplementationScene({ chart }: { chart: FertiliserLegalChart }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = performance.now() * 0.001;
    groupRef.current.rotation.y = Math.sin(elapsed * 0.22) * 0.045;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.18) * 0.018;
    groupRef.current.position.y = Math.sin(elapsed * 0.55) * 0.035;
  });

  return (
    <group ref={groupRef}>
      <FcoTopNode label={chart.topNode} />
      {chart.branches.map((branch, index) => (
        <FcoBranchPanel key={branch.id} branch={branch} index={index} position={fco3dPanelPositions[index] || [0, 0, 0]} />
      ))}
      <FcoConnector position={[-2.1, -0.12, -0.03]} rotationZ={-0.56} length={2.15} />
      <FcoConnector position={[-0.58, -0.82, 0.08]} rotationZ={-0.82} length={1.35} />
      <FcoConnector position={[0.58, -0.82, 0.08]} rotationZ={0.82} length={1.35} />
      <FcoConnector position={[2.1, -0.12, -0.03]} rotationZ={0.56} length={2.15} />
      <mesh position={[0, -2.28, -0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.55, 96]} />
        <meshStandardMaterial color="#dff8f7" roughness={0.7} metalness={0.05} transparent opacity={0.62} />
      </mesh>
    </group>
  );
}

function FcoTopNode({ label }: { label: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = performance.now() * 0.001;
    const scale = 1 + Math.sin(elapsed * 0.9) * 0.018;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group position={[0, 1.52, 0.2]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[3.15, 0.6, 0.24]} />
        <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={0.18} roughness={0.35} metalness={0.08} />
      </mesh>
      <Text position={[0, 0.01, 0.16]} fontSize={0.155} maxWidth={2.75} lineHeight={1.05} textAlign="center" anchorX="center" anchorY="middle" color="#083344">
        {label.toUpperCase()}
      </Text>
    </group>
  );
}

function FcoBranchPanel({
  branch,
  index,
  position,
}: {
  branch: FertiliserLegalChart['branches'][number];
  index: number;
  position: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const palette = fco3dPalette[branch.accent];
  const visibleDetails = branch.details.slice(0, 3).join('\n');

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = performance.now() * 0.001;
    groupRef.current.position.y = position[1] + Math.sin(elapsed * 0.85 + index) * 0.045;
    groupRef.current.rotation.y = Math.sin(elapsed * 0.45 + index) * 0.045;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <boxGeometry args={[1.82, 1.95, 0.18]} />
        <meshStandardMaterial color={palette.color} emissive={palette.emissive} emissiveIntensity={0.06} roughness={0.42} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.69, 0.12]}>
        <boxGeometry args={[1.62, 0.34, 0.07]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.02} transparent opacity={0.86} />
      </mesh>
      <Text position={[0, 0.71, 0.2]} fontSize={0.105} maxWidth={1.46} lineHeight={1.0} textAlign="center" anchorX="center" anchorY="middle" color={palette.text}>
        {branch.title.toUpperCase()}
      </Text>
      <Text position={[0, 0.43, 0.2]} fontSize={0.082} maxWidth={1.48} textAlign="center" anchorX="center" anchorY="middle" color="#0f766e">
        {branch.reference}
      </Text>
      <Text position={[0, -0.22, 0.2]} fontSize={0.075} maxWidth={1.5} lineHeight={1.18} textAlign="center" anchorX="center" anchorY="middle" color="#0f172a">
        {visibleDetails}
      </Text>
    </group>
  );
}

function FcoConnector({ position, rotationZ, length }: { position: [number, number, number]; rotationZ: number; length: number }) {
  return (
    <mesh position={position} rotation={[0, 0, rotationZ]}>
      <boxGeometry args={[length, 0.035, 0.035]} />
      <meshStandardMaterial color="#94a3b8" emissive="#0ea5e9" emissiveIntensity={0.08} roughness={0.45} metalness={0.1} />
    </mesh>
  );
}
function renderFertiliserChartPrintHtml(chart: FertiliserLegalChart) {
  const branches = chart.branches.map((branch) => `
    <article>
      <h2>${escapeHtml(branch.title)}</h2>
      <p class="reference">${escapeHtml(branch.reference)}</p>
      <ul>${branch.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join('')}</ul>
    </article>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <title>${escapeHtml(chart.title)}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:28px;color:#0f172a;background:#f8fafc}
    .sheet{max-width:1100px;margin:auto;background:white;border:1px solid #bfdbfe;border-radius:12px;padding:24px}
    h1{text-align:center;margin:0 0 18px;font-size:24px;color:#075985}
    .top{margin:0 auto 24px;width:max-content;max-width:90%;background:#06b6d4;border:2px solid #0891b2;border-radius:8px;padding:14px 28px;font-weight:900;text-transform:uppercase;text-align:center}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
    article{border:1px solid #bfdbfe;border-radius:10px;padding:12px;background:#eff6ff}
    h2{font-size:15px;text-align:center;margin:0;text-transform:uppercase;color:#0f172a}
    .reference{text-align:center;font-weight:800;color:#047857;margin:8px 0}
    ul{padding-left:18px;margin:0}li{margin:7px 0;font-weight:700;font-size:13px}
    .note{margin-top:18px;border:1px solid #f59e0b;background:#fffbeb;border-radius:8px;padding:10px;text-align:center;font-weight:800;color:#78350f}
    @media print{body{background:white}.sheet{border:0}.grid{break-inside:avoid}}
  </style>
</head>
<body>
  <main class="sheet">
    <h1>${escapeHtml(chart.title)}</h1>
    <div class="top">${escapeHtml(chart.topNode)}</div>
    <section class="grid">${branches}</section>
    <p class="note">${escapeHtml(chart.footerNote)}</p>
  </main>
</body>
</html>`;
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
                <span className="font-black text-emerald-700 dark:text-emerald-300">{link.label}</span>: {link.links.join(', ')}
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
      <p className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-950">
        Verify latest ECA/FCO/FMCO amendments and departmental instructions before prosecution, FIR, seizure/confiscation or court filing.
      </p>
    </details>
  );
}

const fcoTabs: Array<{ id: FcoTabId; label: string }> = [
  { id: 'fullText', label: 'Full Text' },
  { id: 'plainEnglish', label: 'Plain English' },
  { id: 'officerAction', label: 'Officer Action' },
  { id: 'formsTimelines', label: 'Forms & Timelines' },
  { id: 'mnemonics', label: 'Mnemonics' },
];

function FcoCardDetailPage({
  card,
  activeTab,
  bookmarks,
  onBack,
  onTabChange,
  onToggleBookmark,
}: {
  card: FcoClauseCard;
  activeTab: FcoTabId;
  bookmarks: string[];
  onBack: () => void;
  onTabChange: (tab: FcoTabId) => void;
  onToggleBookmark: (id: string) => void;
}) {
  const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;

  return (
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
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
            Back to 9 cards
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {fcoDashboardStats.map((stat) => <span key={stat} className="rounded-lg bg-white/15 px-3 py-2 text-center text-xs font-black ring-1 ring-white/15">{stat}</span>)}
        </div>
      </div>

      <div className="border-b border-emerald-100 bg-emerald-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="rounded-lg border border-emerald-200 bg-white p-3 dark:border-emerald-900 dark:bg-slate-950">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Card Memory</p>
          <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-2xl font-black tracking-wide text-slate-950 dark:text-white">{fcoMemoryMnemonic.code}</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{fcoMemoryMnemonic.sentence}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fcoMemoryMnemonic.lines.map(([letter, word]) => (
              <span key={`${letter}-${word}`} className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{letter}: {word}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3 dark:border-slate-800">
        {fcoTabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black transition ${activeTab === tab.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 dark:bg-slate-900 dark:text-slate-200'}`}>
            {tab.label}
          </button>
        ))}
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
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Clause {clause.clauseNo} - {clause.category}</p>
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
                  {subClause.officerAction && <p><span className="font-black text-emerald-700 dark:text-emerald-300">Officer:</span> {subClause.officerAction.join('; ')}</p>}
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
  onSelect,
}: {
  cards: FcoClauseCard[];
  activeCardId: string | null;
  onSelect: (cardId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-slate-800 dark:bg-emerald-950/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">FCO 1985 Ready Reckoner</p>
            <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">9 Main Clause Cards</h2>
            <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">Tap a card to open its clause detail page.</p>
          </div>
          {activeCardId && (
            <button type="button" onClick={() => onSelect(activeCardId)} className="w-fit rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-200">
              Show all clauses
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;
          const active = activeCardId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className={`group relative min-h-[13rem] overflow-hidden rounded-lg border p-4 text-left shadow-sm transition duration-300 motion-safe:hover:-translate-y-1 ${
                active ? 'border-emerald-300 bg-emerald-50 text-slate-950 shadow-md' : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-emerald-950/20'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-15 transition group-hover:opacity-20`} />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-lg bg-white/80 p-3 text-emerald-800 shadow-sm ring-1 ring-emerald-100 motion-safe:transition motion-safe:group-hover:scale-105 dark:bg-slate-950/80 dark:text-emerald-200 dark:ring-emerald-900">
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
      <p className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-950">
        Verify latest FCO/ECA amendments, Government notification and departmental instructions before prosecution, FIR or court filing.
      </p>
    </details>
  );
}

function renderFcoOffencesPrintHtml(entries: FcoOffenceEntry[]) {
  const rows = entries.map((entry) => `<tr><td>${entry.serialNumber}</td><td>${escapeHtml(entry.offenceType)}</td><td>${escapeHtml(entry.contraventionProvision)}</td><td>${escapeHtml(entry.punishmentProvision)}</td></tr>`).join('');
  return `<!doctype html><html><head><title>FCO Offences With Relevant FCO/ECA Provisions</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111827}h1{text-align:center;color:#075985}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cbd5e1;padding:7px;vertical-align:top}th{background:#eff6ff}.note{margin-top:12px;background:#fffbeb;border:1px solid #f59e0b;padding:10px;font-weight:800;color:#78350f}</style></head><body><h1>FCO Offences With Relevant FCO/ECA Provisions</h1><table><thead><tr><th>Sl.No</th><th>Type of offence</th><th>Contravention provision</th><th>Punishment under ECA</th></tr></thead><tbody>${rows}</tbody></table><p class="note">Verify latest FCO/ECA amendments, Government notification and departmental instructions before prosecution, FIR or court filing.</p></body></html>`;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 py-2 first:border-t-0 dark:border-slate-800">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function PowersSection() {
  const groups = Array.from(new Set(stopSaleSeizureMappings.map((item) => item.group)));
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
                {stopSaleSeizureMappings.filter((item) => item.group === group).map((item) => (
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






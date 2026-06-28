import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Download,
  FileSearch,
  FileText,
  Printer,
  Scale,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { essentialCommoditiesActEntries, essentialCommoditiesCrossLinks, type EssentialCommoditiesActEntry } from '../data/essentialCommoditiesActData';
import { fcoOffenceEntries, type FcoOffenceEntry } from '../data/fcoOffencesData';
import { fertiliserLegalCharts, type FertiliserLegalChart } from '../data/fertiliserLegalCharts';
import { legalReadyReckonerEntries, type LegalCategory, type LegalReadyReckonerEntry } from '../data/legalReadyReckonerData';
import { officerWorkflows, stopSaleSeizureMappings } from '../data/stopSaleSeizureData';
import { ShowCauseNoticeEntry } from './ShowCauseNoticeEntry';

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

function isImportantFcoClause(entry: LegalReadyReckonerEntry) {
  return entry.lawName === 'Fertiliser (Control) Order, 1985' && /^Clauses?\b/.test(entry.referenceNumber);
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
  const [view, setView] = useState<ReckonerView>('references');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LegalCategory>('Fertiliser');
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

  const filteredEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    return legalReadyReckonerEntries.filter((entry) => {
      if (entry.category !== category) return false;
      if (category === 'Fertiliser' && isImportantFcoClause(entry)) return false;
      if (penaltyOnly && entry.category !== 'Penal Provisions' && !entry.linkedPenalProvision?.toLowerCase().includes('penal')) return false;
      if (powersOnly && !entry.tags.some((tag) => ['stop sale', 'seizure', 'sampling', 'sample', 'search', 'powers', 'detention'].includes(tag.toLowerCase()))) return false;
      if (nestedOnly && !['sub-section', 'sub-clause', 'sub-rule', 'proviso'].includes(entry.referenceType)) return false;
      if (term && !entrySearchText(entry).includes(term)) return false;
      return true;
    });
  }, [category, nestedOnly, penaltyOnly, powersOnly, query]);

  const importantFcoClauseEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (category !== 'Fertiliser') return [];
    return legalReadyReckonerEntries.filter((entry) => {
      if (!isImportantFcoClause(entry)) return false;
      if (term && !entrySearchText(entry).includes(term)) return false;
      return true;
    });
  }, [category, query]);

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
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
            Official text not found in repo. Starter entries are marked for verification.
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

            {category === 'Fertiliser' && fcoImplementationChart && (
              <FcoImplementationChart
                chart={fcoImplementationChart}
                chartRef={chartRef}
                onDownload={downloadFertiliserChart}
                onPrint={printFertiliserChart}
              />
            )}

            {category === 'Fertiliser' && (
              <FcoImportantClausesSection entries={importantFcoClauseEntries} onSelect={setSelectedEntryId} selectedEntryId={selectedEntryId} />
            )}

            {category === 'Fertiliser' && (
              <FcoOffencesSection
                entries={filteredFcoOffences}
                onDownload={downloadFcoOffencesCsv}
                onPrint={printFcoOffences}
              />
            )}

            {category === 'Essential Commodities Act' && (
              <EssentialCommoditiesActSection entries={filteredEcaEntries} />
            )}

            <div className="grid gap-3 md:grid-cols-2">
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
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{entry.referenceNumber} · {entry.referenceType}</p>
                      <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white">{entry.title}</h3>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${entry.verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : entry.verificationStatus === 'verify latest' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {entry.verificationStatus}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{entry.officerExplanation}</p>
                </button>
              ))}
            </div>
            {filteredEntries.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center font-semibold text-slate-500">No legal entry matches the current filters.</p>}
          </section>

          {selectedEntry && (
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

const branchAccentClasses: Record<FertiliserLegalChart['branches'][number]['accent'], { header: string; node: string; ring: string }> = {
  cyan: {
    header: 'border-cyan-300 bg-cyan-50 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100',
    node: 'border-cyan-200 bg-white text-slate-800 dark:border-cyan-900 dark:bg-slate-950 dark:text-slate-100',
    ring: 'bg-cyan-500',
  },
  green: {
    header: 'border-green-300 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100',
    node: 'border-green-200 bg-white text-slate-800 dark:border-green-900 dark:bg-slate-950 dark:text-slate-100',
    ring: 'bg-green-600',
  },
  blue: {
    header: 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100',
    node: 'border-blue-200 bg-white text-slate-800 dark:border-blue-900 dark:bg-slate-950 dark:text-slate-100',
    ring: 'bg-blue-600',
  },
};

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
    <section className="overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 shadow-sm dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30">
      <div className="flex flex-col gap-3 border-b border-blue-100 bg-white/85 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">Fertiliser Legal Ready Reckoner</p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{chart.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-800">
            <Printer className="h-4 w-4" />
            Print Chart
          </button>
          <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-800 shadow-sm hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-200">
            <Download className="h-4 w-4" />
            Download PNG
          </button>
        </div>
      </div>

      <div ref={chartRef} className="bg-white p-4 dark:bg-slate-900 sm:p-5">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto w-fit rounded-lg border-2 border-cyan-500 bg-cyan-500 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-slate-950 shadow-sm sm:px-8">
            {chart.topNode}
          </div>
          <div className="mx-auto h-8 w-px bg-slate-300 dark:bg-slate-600" />
          <div className="hidden h-px bg-slate-300 dark:bg-slate-600 lg:block" />
          <div className="grid gap-4 lg:grid-cols-4">
            {chart.branches.map((branch) => {
              const accent = branchAccentClasses[branch.accent];
              return (
                <article key={branch.id} className="relative flex min-w-0 flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/70">
                  <div className={`mx-auto hidden h-5 w-px ${accent.ring} lg:block`} />
                  <div className={`rounded-lg border px-3 py-3 text-center shadow-sm ${accent.header}`}>
                    <h3 className="text-sm font-black uppercase leading-tight">{branch.title}</h3>
                    <p className="mt-1 text-xs font-black">{branch.reference}</p>
                  </div>
                  <div className="space-y-2">
                    {branch.details.map((detail) => (
                      <div key={detail} className={`rounded-md border px-3 py-2 text-center text-xs font-bold leading-5 shadow-sm ${accent.node}`}>
                        {detail}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-950">
            {chart.footerNote}
          </p>
        </div>
      </div>
    </section>
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

function FcoImportantClausesSection({
  entries,
  onSelect,
  selectedEntryId,
}: {
  entries: LegalReadyReckonerEntry[];
  onSelect: (entryId: string) => void;
  selectedEntryId: string;
}) {
  return (
    <details className="group overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-slate-700 dark:bg-emerald-950/30">
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Important FCO Clauses</h2>
          <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">Clause 4, Clause 5, Clauses 8 to 11 and other key FCO provisions grouped here.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800 shadow-sm transition group-open:bg-emerald-700 group-open:text-white dark:bg-slate-950 dark:text-emerald-200">
          {entries.length} clauses
        </span>
      </summary>
      <div className="grid gap-3 p-3 md:grid-cols-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry.id)}
            className={`rounded-lg border p-3 text-left shadow-sm transition ${
              selectedEntryId === entry.id ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 bg-white hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{entry.referenceNumber} ? {entry.referenceType}</p>
            <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white">{entry.title}</h3>
            <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{entry.officerExplanation}</p>
            <p className="mt-2 text-[11px] font-black text-red-700 dark:text-red-300">{entry.linkedPenalProvision || 'Penalty linkage: verify latest'}</p>
          </button>
        ))}
        {entries.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500 md:col-span-2">
            No important FCO clause matches the current search.
          </p>
        )}
      </div>
    </details>
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

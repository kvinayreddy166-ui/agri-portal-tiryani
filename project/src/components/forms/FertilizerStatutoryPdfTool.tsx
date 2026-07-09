import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, RotateCcw, Save } from 'lucide-react';
import { BackButton } from '../ui/BackButton';
import {
  FertilizerPdfValues,
  FertilizerStatutoryFormType,
  generateAllFertilizerStatutoryPdf,
  generateFertilizerStatutoryPdf,
  getAllFertilizerPdfFileName,
  getFertilizerPdfFileName,
  initialFertilizerPdfValues,
} from '../../lib/statutoryFertilizerPdf';

type FieldConfig = {
  key: keyof FertilizerPdfValues;
  label: string;
  type?: 'text' | 'date' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
};

const STORAGE_KEY = 'tiryani-fertilizer-forms-draft';
const DRAFTS_KEY = 'tiryani-fertilizer-forms-named-drafts';
const LAST_GENERATED_KEY = 'tiryani-fertilizer-forms-last-generated';
const DUPLICATE_WARNING_MESSAGE =
  'You are generating a file with the same previous sample/dealer details. Please verify whether new sample details or dealer details are required before downloading.';

type SavedFertilizerDraft = {
  name: string;
  values: FertilizerPdfValues;
  updatedAt: string;
};

const physicalConditionOptions = [
  { label: 'Granular', value: 'Granular' },
  { label: 'Free flowing', value: 'Free flowing' },
  { label: 'Powder', value: 'Powder' },
  { label: 'Crystals', value: 'Crystals' },
];

const bagSourceOptions = [
  { label: 'Open bags', value: 'Open bags' },
  { label: 'Stitched bags', value: 'Stitched bags' },
  { label: 'Bulk', value: 'Bulk' },
];

const designationOptions = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture', value: 'Asst. Director of Agriculture' },
];

const compositionFields: FieldConfig[] = [
  { key: 'compositionN', label: 'N (%)' },
  { key: 'compositionP', label: 'P2O5 (%)' },
  { key: 'compositionK', label: 'K2O (%)' },
  { key: 'compositionS', label: 'S (%)' },
  { key: 'compositionCa', label: 'Ca (%)' },
];

const fertilizerFieldSections: { title: string; fields: FieldConfig[] }[] = [
  {
    title: 'INSPECTOR / FORM K DETAILS',
    fields: [
      { key: 'officerName', label: 'OFFICER NAME' },
      { key: 'designation', label: 'DESIGNATION', type: 'select', options: designationOptions },
      { key: 'officeAddress', label: 'OFFICE ADDRESS', type: 'textarea' },
    ],
  },
  {
    title: 'COMMON DETAILS',
    fields: [
      { key: 'no', label: 'NO.' },
      { key: 'sampleCode', label: 'CODE NO. OF SAMPLE' },
      { key: 'samplingDate', label: 'DATE OF SAMPLING', type: 'date' },
      { key: 'place', label: 'PLACE' },
      { key: 'date', label: 'FORM DATE', type: 'date' },
    ],
  },
  {
    title: 'DEALER / FERTILIZER DETAILS',
    fields: [
      { key: 'dealerName', label: 'DEALER / PARTY NAME' },
      { key: 'dealerAddress', label: 'DEALER / PARTY ADDRESS', type: 'textarea', placeholder: 'village' },
      { key: 'premisesLocation', label: 'DEALER LOCATION (MANDAL)', placeholder: 'mandal' },
      { key: 'authorizationNumber', label: 'LETTER OF AUTHORIZATION NUMBER' },
      { key: 'fertilizerTypeGrade', label: 'TYPE AND GRADE OF FERTILIZER' },
      { key: 'dealerManufacturerImporterName', label: 'NAME OF DEALER/MANUFACTURER/IMPORTER', placeholder: 'company details' },
      { key: 'batchDetails', label: 'BATCH NO. AND DATE OF MANUFACTURE/IMPORT' },
      { key: 'stockReceiptDate', label: 'DATE OF RECEIPT OF STOCK', type: 'date' },
      { key: 'stockPosition', label: 'STOCK POSITION OF LOT' },
      { key: 'physicalCondition', label: 'PHYSICAL CONDITION OF SAMPLE', type: 'select', options: physicalConditionOptions },
      { key: 'bagSource', label: 'SAMPLES DRAWN FROM OPEN BAGS / STITCHED BAGS / BULK', type: 'select', options: bagSourceOptions },
    ],
  },
  {
    title: 'COMPOSITION',
    fields: [
      ...compositionFields,
      { key: 'composition', label: 'ADDITIONAL COMPOSITION REMARKS', type: 'textarea' },
    ],
  },
];

export function FertilizerStatutoryPdfTool({ onClose }: { onClose: () => void }) {
  const [formType, setFormType] = useState<FertilizerStatutoryFormType>('J');
  const [values, setValues] = useState<FertilizerPdfValues>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return normalizeFertilizerValues(saved ? { ...initialFertilizerPdfValues, ...JSON.parse(saved) } : initialFertilizerPdfValues);
    } catch {
      return initialFertilizerPdfValues;
    }
  });
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<SavedFertilizerDraft[]>(() => loadFertilizerDrafts());
  const [busyAction, setBusyAction] = useState<'preview' | 'download' | 'downloadAll' | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<
    | { type: 'preview'; formType: FertilizerStatutoryFormType }
    | { type: 'download'; formType: FertilizerStatutoryFormType }
    | { type: 'previewAll' }
    | { type: 'downloadAll' }
    | null
  >(null);
  const [highlightDetails, setHighlightDetails] = useState(false);
  const sampleDetailsRef = useRef<HTMLDivElement | null>(null);
  const dealerDetailsRef = useRef<HTMLDivElement | null>(null);
  const allFields = useMemo(() => fertilizerFieldSections, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const setField = (key: keyof FertilizerPdfValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'fertilizerTypeGrade' && (!current.nameGrade || current.nameGrade === current.fertilizerTypeGrade)) {
        next.nameGrade = value;
      }
      if (key === 'nameGrade' && (!current.fertilizerTypeGrade || current.fertilizerTypeGrade === current.nameGrade)) {
        next.fertilizerTypeGrade = value;
      }
      if (key === 'sampleCode' && (!current.codeNumber || current.codeNumber === current.sampleCode)) {
        next.codeNumber = value;
      }
      if (key === 'codeNumber' && (!current.sampleCode || current.sampleCode === current.codeNumber)) {
        next.sampleCode = value;
      }
      if (key === 'dealerName' || key === 'dealerAddress' || key === 'premisesLocation') {
        next.dealerNameAddress = buildDealerNameAddress(next);
      }
      if (key === 'dealerName' && (!current.dealerManufacturerImporterName || current.dealerManufacturerImporterName === current.dealerName)) {
        next.dealerManufacturerImporterName = value;
      }
      if (key === 'officerName' || key === 'designation' || key === 'officeAddress') {
        const inspectorAddress = [next.officerName, next.designation, next.officeAddress].filter(Boolean).join('\n');
        next.inspectorNameAddress = inspectorAddress;
        next.fromAddress = inspectorAddress;
        next.forwardReportAddress = inspectorAddress;
      }
      if (key === 'officerName') {
        const currentDraftName = draftName.trim();
        const previousOfficerName = current.officerName.trim();
        if (!currentDraftName || currentDraftName === previousOfficerName) {
          setDraftName(value.trim());
        }
      }
      return next;
    });
    setMessage(null);
  };

  const saveDraft = () => {
    const name = buildDraftName(draftName, values);
    const nextDrafts = upsertFertilizerDraft(savedDrafts, {
      name,
      values,
      updatedAt: new Date().toISOString(),
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setDraftName(name);
    setSavedDrafts(nextDrafts);
    setMessage(`Draft saved: ${name}`);
  };

  const resetDraft = () => {
    if (!window.confirm('Reset fertilizer form draft?')) return;
    setValues(initialFertilizerPdfValues);
    window.localStorage.removeItem(STORAGE_KEY);
    setPreviewError(null);
    setMessage('Draft reset.');
  };

  const loadDraft = (name: string) => {
    const draft = savedDrafts.find((item) => item.name === name);
    if (!draft) return;
    setValues(normalizeFertilizerValues({ ...initialFertilizerPdfValues, ...draft.values }));
    setDraftName(draft.name);
    setPreviewError(null);
    setMessage(`Draft loaded: ${draft.name}`);
  };

  const deleteDraft = () => {
    const name = draftName.trim();
    if (!name) {
      setMessage('Select a saved draft to delete.');
      return;
    }
    if (!window.confirm(`Delete saved draft "${name}"?`)) return;
    const nextDrafts = savedDrafts.filter((draft) => draft.name !== name);
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setSavedDrafts(nextDrafts);
    setDraftName('');
    setMessage(`Draft deleted: ${name}`);
  };

  const completePreviewPdf = async (type = formType) => {
    const targetWindow = openBlankPdfTab();
    setBusyAction('preview');
    setPreviewError(null);
    try {
      const doc = await generateFertilizerStatutoryPdf(type, values);
      openFertilizerDocInTab(doc, getFertilizerPdfFileName(type, values), targetWindow);
      rememberFertilizerGeneratedData(values);
      setFormType(type);
      setMessage('PDF preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview fertilizer PDF:', error);
      targetWindow?.close();
      setPreviewError('PDF preview could not open. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const previewPdf = async (type = formType) => {
    if (isDuplicateFertilizerGeneration(values)) {
      setDuplicateAction({ type: 'preview', formType: type });
      return;
    }
    await completePreviewPdf(type);
  };

  const completePreviewAllPdf = async () => {
    const targetWindow = openBlankPdfTab();
    setBusyAction('preview');
    setPreviewError(null);
    try {
      const doc = await generateAllFertilizerStatutoryPdf(values);
      openFertilizerDocInTab(doc, getAllFertilizerPdfFileName(values), targetWindow);
      rememberFertilizerGeneratedData(values);
      setMessage('All forms preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview all fertilizer PDFs:', error);
      targetWindow?.close();
      setPreviewError('Preview All could not open. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const previewAllPdf = async () => {
    if (isDuplicateFertilizerGeneration(values)) {
      setDuplicateAction({ type: 'previewAll' });
      return;
    }
    await completePreviewAllPdf();
  };

  const completeDownloadPdf = async (type = formType) => {
    setBusyAction('download');
    setPreviewError(null);
    try {
      const doc = await generateFertilizerStatutoryPdf(type, values);
      const fileName = getFertilizerPdfFileName(type, values);
      downloadFertilizerDoc(doc, fileName);
      rememberFertilizerGeneratedData(values);
      setFormType(type);
      setMessage(`PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download fertilizer PDF:', error);
      setPreviewError('PDF could not download. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadPdf = async (type = formType) => {
    if (isDuplicateFertilizerGeneration(values)) {
      setDuplicateAction({ type: 'download', formType: type });
      return;
    }
    await completeDownloadPdf(type);
  };

  const completeDownloadAllPdf = async () => {
    setBusyAction('downloadAll');
    setPreviewError(null);
    try {
      const doc = await generateAllFertilizerStatutoryPdf(values);
      const fileName = getAllFertilizerPdfFileName(values);
      downloadFertilizerDoc(doc, fileName);
      rememberFertilizerGeneratedData(values);
      setMessage(`All forms PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download all fertilizer PDFs:', error);
      setPreviewError('All forms PDF could not download. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadAllPdf = async () => {
    if (isDuplicateFertilizerGeneration(values)) {
      setDuplicateAction({ type: 'downloadAll' });
      return;
    }
    await completeDownloadAllPdf();
  };

  const reviewDuplicateDetails = () => {
    setDuplicateAction(null);
    setHighlightDetails(true);
    sampleDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      dealerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 450);
    window.setTimeout(() => setHighlightDetails(false), 3500);
  };

  const downloadAnyway = async () => {
    const action = duplicateAction;
    setDuplicateAction(null);
    if (!action) return;
    if (action.type === 'preview') await completePreviewPdf(action.formType);
    if (action.type === 'download') await completeDownloadPdf(action.formType);
    if (action.type === 'previewAll') await completePreviewAllPdf();
    if (action.type === 'downloadAll') await completeDownloadAllPdf();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Fertilizer sampling</p>
            <h2 className="max-w-full whitespace-normal text-sm font-black leading-snug text-slate-950 sm:text-base">Generate FORM J / FORM K / FORM P</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex min-h-7 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"
              title="Save draft"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex min-h-7 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"
              title="Reset draft"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <BackButton onClick={onClose} tone="light" className="min-h-7 px-2 py-1 text-xs">
              Close
            </BackButton>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
            <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-600">OFFICER DRAFT</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Auto from officer name"
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <select
                  value=""
                  onChange={(event) => loadDraft(event.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Load saved draft...</option>
                  {savedDrafts.map((draft) => (
                    <option key={draft.name} value={draft.name}>
                      {draft.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={deleteDraft}
                  className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {previewError && (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {previewError}
              </div>
            )}

            {message && (
              <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                {message}
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              {allFields.map((section) => {
                const colorMap: Record<string, 'emerald' | 'blue' | 'amber' | 'maroon' | 'slate'> = {
                  'INSPECTOR / FORM K DETAILS': 'emerald',
                  'COMMON DETAILS': 'blue',
                  'DEALER / FERTILIZER DETAILS': 'amber',
                  'COMPOSITION': 'maroon',
                };
                const color = colorMap[section.title] || 'slate';
                return (
                  <div
                    key={section.title}
                    ref={section.title === 'COMMON DETAILS' ? sampleDetailsRef : section.title === 'DEALER / FERTILIZER DETAILS' ? dealerDetailsRef : undefined}
                    className={highlightDetails && (section.title === 'COMMON DETAILS' || section.title === 'DEALER / FERTILIZER DETAILS') ? 'rounded-xl ring-4 ring-amber-300 ring-offset-2 ring-offset-white' : ''}
                  >
                  <FieldSection title={section.title} color={color}>
                    {section.fields.map((field) => (
                      <PdfInput
                        key={field.key}
                        field={field}
                        value={values[field.key]}
                        onChange={(value) => setField(field.key, value)}
                      />
                    ))}
                  </FieldSection>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-600">PDF Generation</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <FertilizerPdfAction label="Form J" busy={busyAction !== null} onPreview={() => previewPdf('J')} onDownload={() => downloadPdf('J')} />
                <FertilizerPdfAction label="Form K ADA" busy={busyAction !== null} onPreview={() => previewPdf('K_ADA')} onDownload={() => downloadPdf('K_ADA')} />
                <FertilizerPdfAction label="Form K JDA" busy={busyAction !== null} onPreview={() => previewPdf('K_JDA')} onDownload={() => downloadPdf('K_JDA')} />
                <FertilizerPdfAction label="Form P" busy={busyAction !== null} onPreview={() => previewPdf('P')} onDownload={() => downloadPdf('P')} />
                <FertilizerPdfAction label="All Forms" busy={busyAction !== null} onPreview={previewAllPdf} onDownload={downloadAllPdf} primary />
              </div>
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold leading-4 text-amber-800">
                Note: Please update sample details and dealer details before generating a new file.
              </p>
            </div>

        </div>
      </section>
      {duplicateAction && (
        <DuplicateDownloadModal onReview={reviewDuplicateDetails} onContinue={downloadAnyway} onClose={() => setDuplicateAction(null)} />
      )}
    </div>
  );
}

function loadFertilizerDrafts(): SavedFertilizerDraft[] {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildDraftName(name: string, values: FertilizerPdfValues) {
  const fallback = values.officerName.trim() || values.sampleCode.trim() || values.no.trim() || values.dealerManufacturerImporterName.trim();
  return (name.trim() || fallback || `Draft ${new Date().toLocaleString('en-IN')}`).slice(0, 80);
}

function upsertFertilizerDraft(drafts: SavedFertilizerDraft[], draft: SavedFertilizerDraft) {
  return [draft, ...drafts.filter((item) => item.name !== draft.name)].slice(0, 30);
}

function normalizeFertilizerValues(values: FertilizerPdfValues): FertilizerPdfValues {
  const normalized = { ...values };
  if (!normalized.dealerName && normalized.dealerNameAddress) {
    const lines = normalized.dealerNameAddress
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    normalized.dealerName = lines[0] || '';
    normalized.dealerAddress = normalized.dealerAddress || lines.slice(1).join('\n');
  }
  normalized.dealerNameAddress = buildDealerNameAddress(normalized);
  if (!normalized.dealerManufacturerImporterName && normalized.dealerName) {
    normalized.dealerManufacturerImporterName = normalized.dealerName;
  }
  return normalized;
}

function buildDealerNameAddress(values: FertilizerPdfValues) {
  return [values.dealerName, values.dealerAddress, values.premisesLocation]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n');
}

function fertilizerGenerationSnapshot(values: FertilizerPdfValues) {
  return stableFertilizerString({
    no: values.no,
    sampleCode: values.sampleCode,
    codeNumber: values.codeNumber,
    samplingDate: values.samplingDate,
    place: values.place,
    dealerNameAddress: values.dealerNameAddress,
    dealerName: values.dealerName,
    dealerAddress: values.dealerAddress,
    premisesLocation: values.premisesLocation,
    authorizationNumber: values.authorizationNumber,
    fertilizerTypeGrade: values.fertilizerTypeGrade,
    dealerManufacturerImporterName: values.dealerManufacturerImporterName,
    batchDetails: values.batchDetails,
    stockReceiptDate: values.stockReceiptDate,
    stockPosition: values.stockPosition,
    physicalCondition: values.physicalCondition,
    bagSource: values.bagSource,
  });
}

function isDuplicateFertilizerGeneration(values: FertilizerPdfValues) {
  try {
    return window.localStorage.getItem(LAST_GENERATED_KEY) === fertilizerGenerationSnapshot(values);
  } catch {
    return false;
  }
}

function rememberFertilizerGeneratedData(values: FertilizerPdfValues) {
  try {
    window.localStorage.setItem(LAST_GENERATED_KEY, fertilizerGenerationSnapshot(values));
  } catch {
    // Duplicate warning is best-effort only.
  }
}

function stableFertilizerString(value: Record<string, string>) {
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = String(value[key] ?? '').trim();
        return acc;
      }, {})
  );
}

function DuplicateDownloadModal({
  onReview,
  onContinue,
  onClose,
}: {
  onReview: () => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-5 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-wide text-amber-700">Duplicate details warning</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{DUPLICATE_WARNING_MESSAGE}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onReview} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
            Review/Edit Details
          </button>
          <button type="button" onClick={onContinue} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800">
            Download Anyway
          </button>
        </div>
        <button type="button" onClick={onClose} className="mt-3 w-full text-xs font-bold text-slate-500 hover:text-slate-700">
          Close
        </button>
      </div>
    </div>
  );
}

function FieldSection({ title, children, color = 'slate' }: { title: string; children: React.ReactNode; color?: 'emerald' | 'blue' | 'amber' | 'maroon' | 'slate' }) {
  const colorStyles = {
    emerald: 'border-emerald-200 bg-emerald-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    maroon: 'border-red-700 bg-red-50/50',
    slate: 'border-slate-200 bg-slate-50/50',
  };
  
  const headerColors = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    maroon: 'text-red-800',
    slate: 'text-slate-700',
  };
  
  return (
    <div className={`rounded-lg border ${colorStyles[color]} bg-white p-3 shadow-sm`}>
      <h3 className={`mb-2 text-sm font-black ${headerColors[color]}`}>{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function FertilizerPdfAction({
  label,
  onPreview,
  onDownload,
  busy,
  primary = false,
}: {
  label: string;
  onPreview: () => void;
  onDownload: () => void;
  busy: boolean;
  primary?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-2 ${primary ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black text-slate-800">{label}</p>
        {primary && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">All</span>}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onPreview}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-black disabled:opacity-60 ${
            primary ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}

function PdfInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const commonClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';

  return (
    <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <span className="mb-0.5 block text-[11px] font-black tracking-wide text-slate-600">{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} placeholder={field.placeholder} className={commonClass} />
      ) : field.type === 'select' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={commonClass}>
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className={commonClass}
        />
      )}
    </label>
  );
}

function openBlankPdfTab() {
  const targetWindow = window.open('', '_blank');
  if (targetWindow) {
    targetWindow.opener = null;
    targetWindow.document.title = 'Preparing PDF...';
    targetWindow.document.body.innerHTML = '<p style="font-family: system-ui; padding: 24px;">Preparing PDF...</p>';
  }
  return targetWindow;
}

function openFertilizerDocInTab(
  doc: { output: (type: 'blob') => Blob },
  fileName: string,
  targetWindow: Window | null
) {
  const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = blobUrl;
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function downloadFertilizerDoc(doc: { output: (type: 'blob') => Blob }, fileName: string) {
  try {
    const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (error) {
    console.error('PDF download failed:', error);
    // Fallback: try opening in new tab
    try {
      const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw error;
    }
  }
}

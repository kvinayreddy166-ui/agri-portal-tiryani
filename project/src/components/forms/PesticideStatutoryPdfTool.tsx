import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, RotateCcw, X } from 'lucide-react';
import {
  generateAllPesticideStatutoryPdf,
  generatePesticideStatutoryPdf,
  getAllPesticidePdfFileName,
  getPesticidePdfFileName,
  initialPesticidePdfValues,
  PesticidePdfValues,
  PesticideStatutoryFormType,
} from '../../lib/statutoryPesticidePdf';

type FieldConfig = {
  key: keyof PesticidePdfValues;
  label: string;
  type?: 'text' | 'date' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
};

type SavedPesticideDraft = {
  name: string;
  values: PesticidePdfValues;
  updatedAt: string;
};

const STORAGE_KEY = 'tiryani-pesticide-forms-draft';
const DRAFTS_KEY = 'tiryani-pesticide-forms-named-drafts';
const LAST_GENERATED_KEY = 'tiryani-pesticide-forms-last-generated';
const DUPLICATE_WARNING_MESSAGE =
  'You are generating a file with the same previous sample/dealer details. Please verify whether new sample details or dealer details are required before downloading.';

const designationOptions = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture', value: 'Asst. Director of Agriculture' },
  { label: 'Insecticide Inspector', value: 'Insecticide Inspector' },
];

const packingOptions = [
  { label: 'Original sealed', value: 'Original sealed' },
  { label: 'Loose', value: 'Loose' },
  { label: 'Container sealed', value: 'Container sealed' },
];

const fieldSections: { title: string; fields: FieldConfig[] }[] = [
  {
    title: 'INSPECTOR DETAILS',
    fields: [
      { key: 'officerName', label: 'OFFICER NAME' },
      { key: 'designation', label: 'DESIGNATION', type: 'select', options: designationOptions },
      { key: 'officerEmail', label: 'OFFICER EMAIL' },
      { key: 'officeAddress', label: 'OFFICE ADDRESS', type: 'textarea' },
      { key: 'labAddress', label: 'INSECTICIDE ANALYST / LAB ADDRESS', type: 'textarea' },
    ],
  },
  {
    title: 'COMMON DETAILS',
    fields: [
      { key: 'district', label: 'DISTRICT' },
      { key: 'mandal', label: 'MANDAL' },
      { key: 'place', label: 'PLACE' },
      { key: 'date', label: 'FORM DATE', type: 'date' },
      { key: 'sampleDrawnDate', label: 'SAMPLE DRAWN DATE', type: 'date' },
      { key: 'cdaCode', label: 'C & DA CODE' },
      { key: 'distinctMark', label: 'DISTINCT MARK ON SEALED PACKET' },
      { key: 'specimenSeal', label: 'SPECIMEN SEAL PARTICULARS' },
    ],
  },
  {
    title: 'DEALER DETAILS',
    fields: [
      { key: 'dealerName', label: 'DEALER / LICENSEE NAME' },
      { key: 'dealerAddress', label: 'DEALER ADDRESS', type: 'textarea', placeholder: 'village' },
      { key: 'premisesLocation', label: 'PREMISES LOCATION', placeholder: 'mandal' },
      { key: 'licenseNumber', label: 'SALE / STOCK / DISTRIBUTION LICENSE NO.' },
      { key: 'licenseDate', label: 'LICENSE DATE', type: 'date' },
    ],
  },
  {
    title: 'INSECTICIDE DETAILS',
    fields: [
      { key: 'insecticideCommonName', label: 'COMMON NAME OF INSECTICIDE' },
      { key: 'technicalName', label: 'TECHNICAL NAME' },
      { key: 'tradeName', label: 'TRADE NAME' },
      { key: 'activeIngredient', label: 'ACTIVE INGREDIENT / % AI' },
      { key: 'formulationType', label: 'FORMULATION TYPE' },
      { key: 'registrationNumber', label: 'REGISTRATION NUMBER' },
      { key: 'manufacturingLicenseNumber', label: 'MANUFACTURING LICENSE NO.' },
      { key: 'manufacturedBy', label: 'MANUFACTURED BY', type: 'textarea' },
      { key: 'marketedBy', label: 'MARKETED BY', type: 'textarea' },
      { key: 'distributorName', label: 'DISTRIBUTOR NAME' },
    ],
  },
  {
    title: 'BATCH / STOCK DETAILS',
    fields: [
      { key: 'batchNumber', label: 'BATCH NUMBER' },
      { key: 'manufactureDate', label: 'DATE OF MANUFACTURE', type: 'date' },
      { key: 'expiryDate', label: 'DATE OF EXPIRY', type: 'date' },
      { key: 'packingCondition', label: 'PACKING CONDITION', type: 'select', options: packingOptions },
      { key: 'sampleQuantity', label: 'QUANTITY OF SAMPLE TAKEN' },
      { key: 'sampleQuantityAnalysis', label: 'QTY. DRAWN FOR ANALYSIS' },
      { key: 'stockBeforeSampling', label: 'STOCK BEFORE SAMPLING' },
      { key: 'stockAfterSampling', label: 'STOCK AFTER SAMPLING' },
      { key: 'stockRegisterFolio', label: 'STOCK REGISTER FOLIO / PAGE NO.' },
      { key: 'stockReceiptDetails', label: 'DATE OF RECEIPT / SOURCE RECEIVED', type: 'textarea' },
      { key: 'invoiceParticulars', label: 'PARTICULARS OF INVOICE', type: 'textarea' },
      { key: 'stockPosition', label: 'STOCK POSITION OF BATCH', type: 'textarea' },
      { key: 'qciSealParticulars', label: 'Q.C.I. SEAL PARTICULARS' },
      { key: 'caSealParticulars', label: 'C.A. SEAL PARTICULARS' },
      { key: 'otherInformation', label: 'ANY OTHER RELEVANT INFORMATION', type: 'textarea' },
    ],
  },
];

export function PesticideStatutoryPdfTool({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<PesticidePdfValues>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialPesticidePdfValues, ...JSON.parse(saved) } : initialPesticidePdfValues;
    } catch {
      return initialPesticidePdfValues;
    }
  });
  const [message, setMessage] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<SavedPesticideDraft[]>(() => loadDrafts());
  const [busy, setBusy] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<
    | { type: 'preview'; formType: PesticideStatutoryFormType }
    | { type: 'download'; formType: PesticideStatutoryFormType }
    | { type: 'previewAll' }
    | { type: 'downloadAll' }
    | null
  >(null);
  const [highlightDetails, setHighlightDetails] = useState(false);
  const sampleDetailsRef = useRef<HTMLDivElement | null>(null);
  const dealerDetailsRef = useRef<HTMLDivElement | null>(null);
  const sections = useMemo(() => fieldSections, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const setField = (key: keyof PesticidePdfValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'officerName') {
        const currentDraftName = draftName.trim();
        const previousOfficerName = current.officerName.trim();
        if (!currentDraftName || currentDraftName === previousOfficerName) setDraftName(value.trim());
      }
      if (key === 'place' && (!current.premisesLocation || current.premisesLocation === current.place)) {
        next.premisesLocation = value;
      }
      if (key === 'sampleDrawnDate') {
        const date = new Date(`${value}T00:00:00`);
        if (!Number.isNaN(date.getTime())) {
          next.sampleDrawnDay = String(date.getDate()).padStart(2, '0');
          next.sampleDrawnMonth = date.toLocaleString('en-IN', { month: 'long' });
          next.sampleDrawnYear = String(date.getFullYear()).slice(-2);
        }
      }
      return next;
    });
    setMessage(null);
    setPreviewError(null);
  };

  const saveDraft = () => {
    const name = buildDraftName(draftName, values);
    const nextDrafts = upsertDraft(savedDrafts, { name, values, updatedAt: new Date().toISOString() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setDraftName(name);
    setSavedDrafts(nextDrafts);
    setMessage(`Draft saved: ${name}`);
  };

  const resetDraft = () => {
    if (!window.confirm('Reset pesticide form draft?')) return;
    setValues(initialPesticidePdfValues);
    window.localStorage.removeItem(STORAGE_KEY);
    setMessage('Draft reset.');
    setPreviewError(null);
  };

  const loadDraft = (name: string) => {
    const draft = savedDrafts.find((item) => item.name === name);
    if (!draft) return;
    setValues({ ...initialPesticidePdfValues, ...draft.values });
    setDraftName(draft.name);
    setMessage(`Draft loaded: ${draft.name}`);
    setPreviewError(null);
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

  const completePreview = async (formType: PesticideStatutoryFormType) => {
    const targetWindow = openBlankPdfTab();
    setBusy(true);
    try {
      const doc = await generatePesticideStatutoryPdf(formType, values);
      openDocInTab(doc, getPesticidePdfFileName(formType, values), targetWindow);
      rememberGeneratedData(values);
      setMessage('PDF preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview pesticide PDF:', error);
      targetWindow?.close();
      setPreviewError('PDF preview could not open. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const preview = async (formType: PesticideStatutoryFormType) => {
    await completePreview(formType);
  };

  const completeDownload = async (formType: PesticideStatutoryFormType) => {
    setBusy(true);
    try {
      const doc = await generatePesticideStatutoryPdf(formType, values);
      const fileName = getPesticidePdfFileName(formType, values);
      downloadDoc(doc, fileName);
      rememberGeneratedData(values);
      setMessage(`PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download pesticide PDF:', error);
      setPreviewError('PDF could not download. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const download = async (formType: PesticideStatutoryFormType) => {
    if (isDuplicateGeneration(values)) {
      setDuplicateAction({ type: 'download', formType });
      return;
    }
    await completeDownload(formType);
  };

  const completePreviewAll = async () => {
    const targetWindow = openBlankPdfTab();
    setBusy(true);
    try {
      const doc = await generateAllPesticideStatutoryPdf(values);
      openDocInTab(doc, getAllPesticidePdfFileName(values), targetWindow);
      rememberGeneratedData(values);
      setMessage('All pesticide forms preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview all pesticide PDFs:', error);
      targetWindow?.close();
      setPreviewError('Preview All could not open. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const previewAll = async () => {
    await completePreviewAll();
  };

  const completeDownloadAll = async () => {
    setBusy(true);
    try {
      const doc = await generateAllPesticideStatutoryPdf(values);
      const fileName = getAllPesticidePdfFileName(values);
      downloadDoc(doc, fileName);
      rememberGeneratedData(values);
      setMessage(`All forms PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download all pesticide PDFs:', error);
      setPreviewError('All forms PDF could not download. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (isDuplicateGeneration(values)) {
      setDuplicateAction({ type: 'downloadAll' });
      return;
    }
    await completeDownloadAll();
  };

  const reviewDuplicateDetails = () => {
    setDuplicateAction(null);
    setHighlightDetails(true);
    sampleDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => dealerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 450);
    window.setTimeout(() => setHighlightDetails(false), 3500);
  };

  const downloadAnyway = async () => {
    const action = duplicateAction;
    setDuplicateAction(null);
    if (!action) return;
    if (action.type === 'preview') await completePreview(action.formType);
    if (action.type === 'download') await completeDownload(action.formType);
    if (action.type === 'previewAll') await completePreviewAll();
    if (action.type === 'downloadAll') await completeDownloadAll();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Pesticide sampling</p>
            <h2 className="max-w-full whitespace-normal text-sm font-black leading-snug text-slate-950 sm:text-base">Generate FORM V(C) / V(D) / V(E) / Docket Sheet</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-red-700 px-3 py-2 text-white hover:bg-red-800"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
            <div className="mb-2 flex justify-end gap-1">
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-50 px-2.5 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100"
                title="Save draft"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                title="Reset draft"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
            </div>

          <div className="mb-2 rounded-lg border border-red-700 bg-red-50 p-2">
            <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-red-800">SAVED DRAFTS</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input type="text" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Draft name" className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              <select value="" onChange={(event) => loadDraft(event.target.value)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="">Load saved draft...</option>
                {savedDrafts.map((draft) => <option key={draft.name} value={draft.name}>{draft.name}</option>)}
              </select>
              <button type="button" onClick={deleteDraft} className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-50">Delete</button>
            </div>
          </div>

          {previewError && <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{previewError}</div>}
          {message && <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">{message}</div>}

          <div className="grid gap-3 lg:grid-cols-2">
            {sections.map((section) => {
              const colorMap: Record<string, 'emerald' | 'blue' | 'amber' | 'slate'> = {
                'INSPECTOR DETAILS': 'emerald',
                'COMMON DETAILS': 'blue',
                'DEALER DETAILS': 'amber',
                'INSECTICIDE DETAILS': 'slate',
                'BATCH / STOCK DETAILS': 'emerald',
              };
              const color = colorMap[section.title] || 'slate';
              return (
                <div
                  key={section.title}
                  ref={section.title === 'COMMON DETAILS' ? sampleDetailsRef : section.title === 'DEALER DETAILS' ? dealerDetailsRef : undefined}
                  className={highlightDetails && (section.title === 'COMMON DETAILS' || section.title === 'DEALER DETAILS') ? 'rounded-xl ring-4 ring-amber-300 ring-offset-2 ring-offset-white' : ''}
                >
                  <FieldSection title={section.title} color={color}>
                    {section.fields.map((field) => <PdfInput key={field.key} field={field} value={values[field.key]} onChange={(value) => setField(field.key, value)} />)}
                  </FieldSection>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-600">PDF Generation</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <PesticidePdfAction label="Form V(C)" busy={busy} onPreview={() => preview('VC')} onDownload={() => download('VC')} />
              <PesticidePdfAction label="Form V(D)" busy={busy} onPreview={() => preview('VD')} onDownload={() => download('VD')} />
              <PesticidePdfAction label="Form V(E)" busy={busy} onPreview={() => preview('VE')} onDownload={() => download('VE')} />
              <PesticidePdfAction label="Docket Sheet" busy={busy} onPreview={() => preview('DOCKET')} onDownload={() => download('DOCKET')} />
              <PesticidePdfAction label="All Forms" busy={busy} onPreview={previewAll} onDownload={downloadAll} primary />
            </div>
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold leading-4 text-amber-800">
              Note: Please update sample details and dealer details before generating a new file.
            </p>
          </div>
        </div>
      </section>
      {duplicateAction && <DuplicateDownloadModal onReview={reviewDuplicateDetails} onContinue={downloadAnyway} onClose={() => setDuplicateAction(null)} />}
    </div>
  );
}

function FieldSection({ title, children, color = 'slate' }: { title: string; children: React.ReactNode; color?: 'emerald' | 'blue' | 'amber' | 'slate' }) {
  const colorStyles = {
    emerald: 'border-emerald-200 bg-emerald-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    slate: 'border-slate-200 bg-slate-50/50',
  };
  
  const headerColors = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    slate: 'text-slate-700',
  };
  
  return (
    <div className={`rounded-lg border ${colorStyles[color]} bg-white p-3 shadow-sm`}>
      <h3 className={`mb-2 text-sm font-black ${headerColors[color]}`}>{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function PdfInput({ field, value, onChange }: { field: FieldConfig; value: string; onChange: (value: string) => void }) {
  const commonClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';
  return (
    <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <span className="mb-0.5 block text-[11px] font-black tracking-wide text-slate-600">{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} placeholder={field.placeholder} className={commonClass} />
      ) : field.type === 'select' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={commonClass}>
          <option value="">Select...</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input type={field.type === 'date' ? 'date' : 'text'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={commonClass} />
      )}
    </label>
  );
}

function PesticidePdfAction({ label, onPreview, onDownload, busy, primary = false }: { label: string; onPreview: () => void; onDownload: () => void; busy: boolean; primary?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 ${primary ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black text-slate-800">{label}</p>
        {primary && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">All</span>}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" onClick={onPreview} disabled={busy} className="inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button type="button" onClick={onDownload} disabled={busy} className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-black disabled:opacity-60 ${primary ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}

function DuplicateDownloadModal({ onReview, onContinue, onClose }: { onReview: () => void; onContinue: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-5 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-wide text-amber-700">Duplicate details warning</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{DUPLICATE_WARNING_MESSAGE}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onReview} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">Review/Edit Details</button>
          <button type="button" onClick={onContinue} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800">Download Anyway</button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-red-700 px-3 py-2 text-red-800 hover:bg-red-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function loadDrafts(): SavedPesticideDraft[] {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildDraftName(name: string, values: PesticidePdfValues) {
  const fallback = values.officerName.trim() || values.cdaCode.trim() || values.batchNumber.trim() || values.dealerName.trim();
  return (name.trim() || fallback || `Draft ${new Date().toLocaleString('en-IN')}`).slice(0, 80);
}

function upsertDraft(drafts: SavedPesticideDraft[], draft: SavedPesticideDraft) {
  return [draft, ...drafts.filter((item) => item.name !== draft.name)].slice(0, 30);
}

function generationSnapshot(values: PesticidePdfValues) {
  return stableString({
    cdaCode: values.cdaCode,
    sampleDrawnDate: values.sampleDrawnDate,
    dealerName: values.dealerName,
    dealerAddress: values.dealerAddress,
    premisesLocation: values.premisesLocation,
    licenseNumber: values.licenseNumber,
    insecticideCommonName: values.insecticideCommonName,
    tradeName: values.tradeName,
    batchNumber: values.batchNumber,
    manufactureDate: values.manufactureDate,
    expiryDate: values.expiryDate,
    sampleQuantity: values.sampleQuantity,
  });
}

function isDuplicateGeneration(values: PesticidePdfValues) {
  try {
    return window.localStorage.getItem(LAST_GENERATED_KEY) === generationSnapshot(values);
  } catch {
    return false;
  }
}

function rememberGeneratedData(values: PesticidePdfValues) {
  try {
    window.localStorage.setItem(LAST_GENERATED_KEY, generationSnapshot(values));
  } catch {
    // Duplicate warning is best-effort only.
  }
}

function stableString(value: Record<string, string>) {
  return JSON.stringify(Object.keys(value).sort().reduce<Record<string, string>>((acc, key) => {
    acc[key] = String(value[key] ?? '').trim();
    return acc;
  }, {}));
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

function openDocInTab(doc: { output: (type: 'blob') => Blob }, fileName: string, targetWindow: Window | null) {
  const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  if (targetWindow && !targetWindow.closed) targetWindow.location.href = blobUrl;
  else window.open(blobUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function downloadDoc(doc: { output: (type: 'blob') => Blob }, fileName: string) {
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
}
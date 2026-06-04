import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, RotateCcw, Save, X } from 'lucide-react';
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
};

const STORAGE_KEY = 'tiryani-fertilizer-forms-draft';
const DRAFTS_KEY = 'tiryani-fertilizer-forms-named-drafts';

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

const compositionFields: FieldConfig[] = [
  { key: 'compositionN', label: 'N (%)' },
  { key: 'compositionP', label: 'P (%)' },
  { key: 'compositionK', label: 'K (%)' },
  { key: 'compositionS', label: 'S (%)' },
  { key: 'compositionCa', label: 'Ca (%)' },
];

const fertilizerFieldSections: { title: string; fields: FieldConfig[] }[] = [
  {
    title: 'Common Details',
    fields: [
      { key: 'no', label: 'No.' },
      { key: 'sampleCode', label: 'Code no. of sample' },
      { key: 'codeNumber', label: 'Code Number' },
      { key: 'samplingDate', label: 'Date of sampling', type: 'date' },
      { key: 'place', label: 'Place' },
      { key: 'date', label: 'Form Date', type: 'date' },
    ],
  },
  {
    title: 'Dealer / Fertilizer Details',
    fields: [
      { key: 'dealerNameAddress', label: 'Name and address of dealer/manufacturer/importer', type: 'textarea' },
      { key: 'authorizationNumber', label: 'Letter of authorization Number' },
      { key: 'fertilizerTypeGrade', label: 'Type and grade of fertilizer' },
      { key: 'nameGrade', label: 'Name and Grade of Fertilizer' },
      { key: 'dealerManufacturerImporterName', label: 'Name of dealer/manufacturer/importer' },
      { key: 'batchDetails', label: 'Batch No. and date of manufacture/import' },
      { key: 'stockReceiptDate', label: 'Date of receipt of stock', type: 'date' },
      { key: 'stockPosition', label: 'Stock position of lot' },
      { key: 'physicalCondition', label: 'Physical condition of sample', type: 'select', options: physicalConditionOptions },
      { key: 'bagSource', label: 'Samples drawn from open bags / stitched bags / bulk', type: 'select', options: bagSourceOptions },
    ],
  },
  {
    title: 'Composition',
    fields: [
      ...compositionFields,
      { key: 'composition', label: 'Additional composition remarks', type: 'textarea' },
    ],
  },
  {
    title: 'Inspector / Form K Details',
    fields: [
      { key: 'inspectorNameAddress', label: 'Name and Address of Fertilizer Inspector drawing sample', type: 'textarea' },
    ],
  },
];

export function FertilizerStatutoryPdfTool({ onClose }: { onClose: () => void }) {
  const [formType, setFormType] = useState<FertilizerStatutoryFormType>('J');
  const [values, setValues] = useState<FertilizerPdfValues>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialFertilizerPdfValues, ...JSON.parse(saved) } : initialFertilizerPdfValues;
    } catch {
      return initialFertilizerPdfValues;
    }
  });
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<SavedFertilizerDraft[]>(() => loadFertilizerDrafts());
  const [busyAction, setBusyAction] = useState<'preview' | 'download' | 'downloadAll' | null>(null);
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
      if (key === 'inspectorNameAddress') {
        next.fromAddress = value;
        next.forwardReportAddress = value;
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
    setValues({ ...initialFertilizerPdfValues, ...draft.values });
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

  const previewPdf = async (type = formType) => {
    const targetWindow = openBlankPdfTab();
    setBusyAction('preview');
    setPreviewError(null);
    try {
      const doc = await generateFertilizerStatutoryPdf(type, values);
      openFertilizerDocInTab(doc, getFertilizerPdfFileName(type, values), targetWindow);
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

  const previewAllPdf = async () => {
    const targetWindow = openBlankPdfTab();
    setBusyAction('preview');
    setPreviewError(null);
    try {
      const doc = await generateAllFertilizerStatutoryPdf(values);
      openFertilizerDocInTab(doc, getAllFertilizerPdfFileName(values), targetWindow);
      setMessage('All forms preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview all fertilizer PDFs:', error);
      targetWindow?.close();
      setPreviewError('Preview All could not open. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadPdf = async (type = formType) => {
    const targetWindow = openBlankPdfTab();
    setBusyAction('download');
    try {
      const doc = await generateFertilizerStatutoryPdf(type, values);
      openFertilizerDocInTab(doc, getFertilizerPdfFileName(type, values), targetWindow);
      setFormType(type);
      setMessage('PDF opened in a new tab.');
    } catch (error) {
      console.error('Unable to download fertilizer PDF:', error);
      targetWindow?.close();
      setPreviewError('PDF could not open. Please try Preview.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadAllPdf = async () => {
    const targetWindow = openBlankPdfTab();
    setBusyAction('downloadAll');
    try {
      const doc = await generateAllFertilizerStatutoryPdf(values);
      openFertilizerDocInTab(doc, getAllFertilizerPdfFileName(values), targetWindow);
      setMessage('All forms PDF opened in a new tab.');
    } catch (error) {
      console.error('Unable to download all fertilizer PDFs:', error);
      targetWindow?.close();
      setPreviewError('All forms PDF could not open. Please try Preview All.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Fertilizer sampling PDF</p>
            <h2 className="truncate text-lg font-black text-slate-950">Generate FORM J / FORM K / FORM P</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
              title="Save draft"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
              title="Reset draft"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
            <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-600">Multiple user drafts</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Draft name / officer / dealer"
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
              {allFields.map((section) => (
                <FieldSection key={section.title} title={section.title}>
                  {section.fields.map((field) => (
                    <PdfInput
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      onChange={(value) => setField(field.key, value)}
                    />
                  ))}
                </FieldSection>
              ))}
            </div>

            <div className="sticky bottom-0 mt-3 border-t border-slate-200 bg-white pt-2">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-600">PDF Generation</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <FertilizerPdfAction label="Form J" busy={busyAction !== null} onPreview={() => previewPdf('J')} onDownload={() => downloadPdf('J')} />
                <FertilizerPdfAction label="Form K ADA" busy={busyAction !== null} onPreview={() => previewPdf('K_ADA')} onDownload={() => downloadPdf('K_ADA')} />
                <FertilizerPdfAction label="Form K JDA" busy={busyAction !== null} onPreview={() => previewPdf('K_JDA')} onDownload={() => downloadPdf('K_JDA')} />
                <FertilizerPdfAction label="Form P" busy={busyAction !== null} onPreview={() => previewPdf('P')} onDownload={() => downloadPdf('P')} />
                <FertilizerPdfAction label="All Forms" busy={busyAction !== null} onPreview={previewAllPdf} onDownload={downloadAllPdf} primary />
              </div>
            </div>

        </div>
      </section>
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
  const fallback = values.sampleCode.trim() || values.no.trim() || values.dealerManufacturerImporterName.trim();
  return (name.trim() || fallback || `Draft ${new Date().toLocaleString('en-IN')}`).slice(0, 80);
}

function upsertFertilizerDraft(drafts: SavedFertilizerDraft[], draft: SavedFertilizerDraft) {
  return [draft, ...drafts.filter((item) => item.name !== draft.name)].slice(0, 30);
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-black text-slate-900">{title}</h3>
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
          PDF
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
      <span className="mb-0.5 block text-[11px] font-black uppercase tracking-wide text-slate-600">{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} className={commonClass} />
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

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Loader2, Printer, RotateCcw, Save, X } from 'lucide-react';
import {
  createAllFertilizerPdfBlobUrl,
  createFertilizerPdfBlobUrl,
  FERTILIZER_K_ADDRESS_OPTIONS,
  FertilizerPdfValues,
  fertilizerFormTitles,
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

const commonTopFields: FieldConfig[] = [
  { key: 'no', label: 'No.' },
];

const STORAGE_KEY = 'tiryani-fertilizer-forms-draft';
const DRAFTS_KEY = 'tiryani-fertilizer-forms-named-drafts';

type SavedFertilizerDraft = {
  name: string;
  values: FertilizerPdfValues;
  updatedAt: string;
};

const commonBottomFields: FieldConfig[] = [
  { key: 'place', label: 'Place' },
  { key: 'date', label: 'Date', type: 'date' },
];

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

const formKFields: FieldConfig[] = [
  ...commonTopFields,
  { key: 'fromAddress', label: 'From address', type: 'textarea' },
  { key: 'fertilizerTypeGrade', label: 'Type of fertilizer & Grade' },
  { key: 'samplingDate', label: 'Date of sampling', type: 'date' },
  { key: 'physicalCondition', label: 'Physical condition of sample', type: 'select', options: physicalConditionOptions },
  { key: 'sampleCode', label: 'Code number of Sample' },
  { key: 'forwardReportAddress', label: 'Forward analysis report to address', type: 'textarea' },
  ...commonBottomFields,
];

const formFields: Record<FertilizerStatutoryFormType, FieldConfig[]> = {
  J: [
    ...commonTopFields,
    { key: 'dealerNameAddress', label: 'Name and address of dealer/manufacturer/importer', type: 'textarea' },
    { key: 'authorizationNumber', label: 'Letter of authorization Number' },
    { key: 'samplingDate', label: 'Date of sampling', type: 'date' },
    { key: 'markings', label: 'Details of markings on the bags from where sample has been taken', type: 'textarea' },
    { key: 'fertilizerTypeGrade', label: 'Type and grade of fertilizer' },
    { key: 'dealerManufacturerImporterName', label: 'Name of dealer/manufacturer/importer' },
    { key: 'batchDetails', label: 'Batch No. and date of manufacture/import' },
    ...compositionFields,
    { key: 'stockReceiptDate', label: 'Date of receipt of stock by dealer/manufacturer/importer/pool handling agency', type: 'date' },
    { key: 'sampleCode', label: 'Code no. of sample' },
    { key: 'stockPosition', label: 'Stock position of lot' },
    { key: 'physicalCondition', label: 'Physical condition of sample', type: 'select', options: physicalConditionOptions },
    { key: 'bagSource', label: 'Samples drawn from open bags / stitched bags / bulk', type: 'select', options: bagSourceOptions },
    { key: 'inspectorNameAddress', label: 'Name and Address of Fertilizer Inspector drawing sample', type: 'textarea' },
    { key: 'dealerReceipt', label: 'Receipt of dealer', type: 'textarea' },
    ...commonBottomFields,
  ],
  K_ADA: formKFields,
  K_JDA: formKFields,
  P: [
    ...commonTopFields,
    { key: 'nameGrade', label: 'Name and Grade of Fertilizer' },
    ...compositionFields,
    { key: 'physicalCondition', label: 'Physical Condition of sample', type: 'select', options: physicalConditionOptions },
    { key: 'codeNumber', label: 'Code Number' },
    { key: 'samplingDate', label: 'Date of sampling', type: 'date' },
    { key: 'inspectorNameAddress', label: 'Name & Address of Fertilizer Inspector drawing sample', type: 'textarea' },
  ],
};

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<SavedFertilizerDraft[]>(() => loadFertilizerDrafts());
  const [busyAction, setBusyAction] = useState<'preview' | 'download' | 'downloadAll' | null>(null);
  const activeFields = useMemo(() => formFields[formType], [formType]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
        if (!current.fromAddress || current.fromAddress === current.inspectorNameAddress) {
          next.fromAddress = value;
        }
        if (!current.forwardReportAddress || current.forwardReportAddress === current.inspectorNameAddress) {
          next.forwardReportAddress = value;
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
    setPreviewUrl(null);
    setMessage('Draft reset.');
  };

  const loadDraft = (name: string) => {
    const draft = savedDrafts.find((item) => item.name === name);
    if (!draft) return;
    setValues({ ...initialFertilizerPdfValues, ...draft.values });
    setDraftName(draft.name);
    setPreviewError(null);
    setPreviewUrl(null);
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

  const previewPdf = async () => {
    setBusyAction('preview');
    setPreviewError(null);
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = await createFertilizerPdfBlobUrl(formType, values);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Unable to preview fertilizer PDF:', error);
      setPreviewError('PDF preview could not open. Please try Download Selected.');
    } finally {
      setBusyAction(null);
    }
  };

  const previewAllPdf = async () => {
    setBusyAction('preview');
    setPreviewError(null);
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = await createAllFertilizerPdfBlobUrl(values);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Unable to preview all fertilizer PDFs:', error);
      setPreviewError('Preview All could not open. Please try Download All Forms.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadPdf = async () => {
    setBusyAction('download');
    try {
      const doc = await generateFertilizerStatutoryPdf(formType, values);
      downloadFertilizerDoc(doc, getFertilizerPdfFileName(formType, values));
      setMessage('PDF generated.');
    } catch (error) {
      console.error('Unable to download fertilizer PDF:', error);
      setPreviewError('Download could not start. Please try Preview PDF and use Open.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadAllPdf = async () => {
    setBusyAction('downloadAll');
    try {
      const doc = await generateAllFertilizerStatutoryPdf(values);
      downloadFertilizerDoc(doc, getAllFertilizerPdfFileName(values));
      setMessage('All forms PDF generated.');
    } catch (error) {
      console.error('Unable to download all fertilizer PDFs:', error);
      setPreviewError('Download All could not start. Please try Preview All and use Open.');
    } finally {
      setBusyAction(null);
    }
  };

  const printPreview = () => {
    if (!previewUrl) return;
    const frame = document.getElementById('fertilizer-pdf-preview') as HTMLIFrameElement | null;
    frame?.contentWindow?.print();
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
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-black sm:grid-cols-4">
              {(['J', 'K_ADA', 'K_JDA', 'P'] as FertilizerStatutoryFormType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormType(type);
                    if (type === 'K_ADA' || type === 'K_JDA') {
                      setField('toAddress', FERTILIZER_K_ADDRESS_OPTIONS[type].value);
                    }
                    setPreviewError(null);
                    setPreviewUrl(null);
                  }}
                  className={`rounded-md px-3 py-2 ${
                    formType === type ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {fertilizerFormTitles[type]}
                </button>
              ))}
            </div>

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

            <div className="grid gap-2 sm:grid-cols-2">
              {activeFields.map((field) => (
                <PdfInput
                  key={`${formType}-${field.key}`}
                  field={field}
                  value={values[field.key]}
                  onChange={(value) => setField(field.key, value)}
                />
              ))}
            </div>

            <div className="sticky bottom-0 mt-3 grid gap-2 border-t border-slate-200 bg-white pt-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={previewPdf}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
              >
                {busyAction === 'preview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Preview PDF
              </button>
              <button
                type="button"
                onClick={previewAllPdf}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-black text-teal-800 transition hover:bg-teal-100 disabled:opacity-60"
              >
                {busyAction === 'preview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Preview All
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {busyAction === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Selected
              </button>
              <button
                type="button"
                onClick={downloadAllPdf}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {busyAction === 'downloadAll' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download All Forms
              </button>
            </div>
        </div>

        {previewUrl && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/75 p-2 sm:p-4">
            <div className="flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  A4 PDF Preview
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-100"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={printPreview}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Close preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <iframe
                key={previewUrl}
                id="fertilizer-pdf-preview"
                src={previewUrl}
                title="Fertilizer statutory PDF preview"
                className="min-h-0 flex-1 border-0 bg-white"
                onError={() => setPreviewError('PDF preview could not open. Please use the download button.')}
              />
            </div>
          </div>
        )}
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

function downloadFertilizerDoc(doc: { save: (fileName: string) => void; output: (type: 'blob') => Blob }, fileName: string) {
  try {
    doc.save(fileName);
    return;
  } catch (error) {
    console.warn('jsPDF save failed; falling back to blob download.', error);
  }

  const blobUrl = URL.createObjectURL(doc.output('blob'));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

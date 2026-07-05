import React, { useState } from 'react';
import { Download, Edit3, Eye, RotateCcw, Save, X } from 'lucide-react';
import {
  FertilizerFormPdfValues,
  generateFertilizerFormPdf,
  getFertilizerFormPdfFileName,
  initialFertilizerFormPdfValues,
} from '../../lib/fertilizerFormsPdf';
import type { FertilizerFormEntry } from '../../data/fertilizerForms';

const STORAGE_KEY = 'tiryani-fertilizer-forms-pdf-draft';

type FieldConfig = {
  key: keyof FertilizerFormPdfValues;
  label: string;
  type?: 'text' | 'date' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
};

const designationOptions = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture', value: 'Asst. Director of Agriculture' },
  { label: 'Joint Director of Agriculture', value: 'Joint Director of Agriculture' },
];

const formFieldSections: { title: string; fields: FieldConfig[] }[] = [
  {
    title: 'Officer details',
    fields: [
      { key: 'officerName', label: 'Officer name' },
      { key: 'designation', label: 'Designation', type: 'select', options: designationOptions },
      { key: 'officeAddress', label: 'Office address', type: 'textarea' },
    ],
  },
  {
    title: 'Dealer / applicant details',
    fields: [
      { key: 'dealerName', label: 'Name of dealer/applicant' },
      { key: 'dealerAddress', label: 'Address', type: 'textarea' },
      { key: 'premisesLocation', label: 'Premises location / mandal' },
      { key: 'authorizationNumber', label: 'Authorization / certificate number' },
    ],
  },
  {
    title: 'Fertilizer details',
    fields: [
      { key: 'fertilizerTypeGrade', label: 'Type and grade of fertilizer' },
      { key: 'manufacturerName', label: 'Name of manufacturer/supplier' },
      { key: 'batchDetails', label: 'Batch number / quantity / details' },
      { key: 'composition', label: 'Composition', type: 'textarea' },
      { key: 'sampleCode', label: 'Sample code / reference number' },
    ],
  },
  {
    title: 'Date, place and remarks',
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'place', label: 'Place' },
      { key: 'remarks', label: 'Additional remarks', type: 'textarea' },
    ],
  },
];

export function FertilizerFormPdfGenerator({ form, onClose }: { form: FertilizerFormEntry; onClose: () => void }) {
  const [values, setValues] = useState<FertilizerFormPdfValues>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialFertilizerFormPdfValues, ...JSON.parse(saved) } : initialFertilizerFormPdfValues;
    } catch {
      return initialFertilizerFormPdfValues;
    }
  });
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'preview' | 'download' | null>(null);
  const [showFillPanel, setShowFillPanel] = useState(false);

  const setField = (key: keyof FertilizerFormPdfValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const resetDraft = () => {
    if (!window.confirm('Reset form draft?')) return;
    setValues(initialFertilizerFormPdfValues);
    window.localStorage.removeItem(STORAGE_KEY);
    setPreviewError(null);
    setMessage('Draft reset.');
  };

  const saveDraft = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    setMessage('Draft saved.');
  };

  const previewGeneratedPdf = async () => {
    const targetWindow = window.open('', '_blank');
    setBusyAction('preview');
    setPreviewError(null);
    try {
      const doc = await generateFertilizerFormPdf(form, values);
      const blob = new File([doc.output('blob')], getFertilizerFormPdfFileName(form, values), { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      if (targetWindow && !targetWindow.closed) {
        targetWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      setMessage('Filled PDF preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview PDF:', error);
      targetWindow?.close();
      setPreviewError('Filled PDF preview could not open. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadGeneratedPdf = async () => {
    setBusyAction('download');
    setPreviewError(null);
    try {
      const doc = await generateFertilizerFormPdf(form, values);
      const fileName = getFertilizerFormPdfFileName(form, values);
      const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      setMessage(`Filled PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download PDF:', error);
      setPreviewError('Filled PDF could not download. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-950">
        <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{form.category}</p>
            <h2 className="max-w-full whitespace-normal text-sm font-black leading-snug text-slate-950 dark:text-white sm:text-base">
              {form.formNo} - {form.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <a
              href={form.pdfPath}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </a>
            <button
              type="button"
              onClick={() => setShowFillPanel((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              title="Fill details"
            >
              <Edit3 className="h-4 w-4" />
              <span>{showFillPanel ? 'Hide Fill' : 'Fill Details'}</span>
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 bg-slate-100 dark:bg-slate-900 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-h-[72vh] overflow-hidden bg-slate-200 dark:bg-slate-900">
            <iframe
              title={`${form.formNo} PDF preview`}
              src={`${form.pdfPath}#page=${form.page}&zoom=page-width`}
              className="h-full min-h-[72vh] w-full border-0 bg-white"
            />
          </div>

          <aside className={`${showFillPanel ? 'block' : 'hidden lg:block'} min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 lg:border-l lg:border-t-0`}>
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

            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-400">Fill details</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Optional filled PDF generator</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={saveDraft} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200" title="Save draft">
                  <Save className="h-4 w-4" />
                </button>
                <button type="button" onClick={resetDraft} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200" title="Reset draft">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {formFieldSections.map((section) => (
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

            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">Filled PDF</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={previewGeneratedPdf}
                  disabled={busyAction !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-200"
                >
                  <Eye className="h-4 w-4" />
                  Preview Filled PDF
                </button>
                <button
                  type="button"
                  onClick={downloadGeneratedPdf}
                  disabled={busyAction !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  Download Filled PDF
                </button>
              </div>
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold leading-4 text-amber-800">
                Verify with the latest FCO gazette before official use.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h3 className="mb-2 text-sm font-black text-slate-900 dark:text-white">{title}</h3>
      <div className="grid gap-2">{children}</div>
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
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

  return (
    <label className="block min-w-0">
      <span className="mb-0.5 block text-[11px] font-black leading-4 text-slate-600 dark:text-slate-300">{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          placeholder={field.placeholder}
          className={commonClass}
        />
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
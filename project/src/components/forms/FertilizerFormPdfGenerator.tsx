import React, { useState } from 'react';
import { Download, Eye, RotateCcw, Save, X } from 'lucide-react';
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
    title: 'OFFICER DETAILS',
    fields: [
      { key: 'officerName', label: 'OFFICER NAME' },
      { key: 'designation', label: 'DESIGNATION', type: 'select', options: designationOptions },
      { key: 'officeAddress', label: 'OFFICE ADDRESS', type: 'textarea' },
    ],
  },
  {
    title: 'DEALER / APPLICANT DETAILS',
    fields: [
      { key: 'dealerName', label: 'NAME OF DEALER/APPLICANT' },
      { key: 'dealerAddress', label: 'ADDRESS', type: 'textarea' },
      { key: 'premisesLocation', label: 'PREMISES LOCATION (MANDAL)' },
      { key: 'authorizationNumber', label: 'AUTHORIZATION/CERTIFICATE NUMBER' },
    ],
  },
  {
    title: 'FERTILIZER DETAILS',
    fields: [
      { key: 'fertilizerTypeGrade', label: 'TYPE AND GRADE OF FERTILIZER' },
      { key: 'manufacturerName', label: 'NAME OF MANUFACTURER/SUPPLIER' },
      { key: 'batchDetails', label: 'BATCH NO. / DETAILS' },
      { key: 'composition', label: 'COMPOSITION', type: 'textarea' },
      { key: 'sampleCode', label: 'SAMPLE CODE / REFERENCE NUMBER' },
    ],
  },
  {
    title: 'DATE & PLACE',
    fields: [
      { key: 'date', label: 'DATE', type: 'date' },
      { key: 'place', label: 'PLACE' },
    ],
  },
  {
    title: 'REMARKS',
    fields: [
      { key: 'remarks', label: 'ADDITIONAL REMARKS', type: 'textarea' },
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

  const previewPdf = async () => {
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
      setMessage('PDF preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview PDF:', error);
      targetWindow?.close();
      setPreviewError('PDF preview could not open. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadPdf = async () => {
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
      setMessage(`PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download PDF:', error);
      setPreviewError('PDF could not download. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">{form.category}</p>
            <h2 className="max-w-full whitespace-normal text-sm font-black leading-snug text-slate-950 sm:text-base">
              {form.formNo} - {form.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
              title="Save draft"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save Draft</span>
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

          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-600">PDF Generation</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={previewPdf}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
              >
                <Eye className="h-4 w-4" />
                Preview PDF
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold leading-4 text-amber-800">
              Note: This generates a form-specific PDF with your entered details. For official use, verify with the latest FCO gazette.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-black text-slate-900">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
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

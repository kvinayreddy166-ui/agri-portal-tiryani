import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Loader2, Printer, X } from 'lucide-react';
import {
  createFertilizerPdfBlobUrl,
  FERTILIZER_TO_ADDRESS_OPTIONS,
  FertilizerPdfValues,
  fertilizerFormTitles,
  FertilizerStatutoryFormType,
  generateFertilizerStatutoryPdf,
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

const commonBottomFields: FieldConfig[] = [
  { key: 'place', label: 'Place' },
  { key: 'date', label: 'Date', type: 'date' },
];

const physicalConditionOptions = [
  { label: 'Good', value: 'Good' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Moist', value: 'Moist' },
  { label: 'Caked', value: 'Caked' },
  { label: 'Damaged', value: 'Damaged' },
];

const bagSourceOptions = [
  { label: 'Open bags', value: 'Open bags' },
  { label: 'Stitched bags', value: 'Stitched bags' },
  { label: 'Bulk', value: 'Bulk' },
];

const fertilizerGradeOptions = [
  { label: 'Urea', value: 'Urea' },
  { label: 'DAP', value: 'DAP' },
  { label: 'MOP', value: 'MOP' },
  { label: 'SSP', value: 'SSP' },
  { label: 'Complex', value: 'Complex' },
  { label: 'Organic Fertilizer', value: 'Organic Fertilizer' },
  { label: 'Bio-Fertilizer', value: 'Bio-Fertilizer' },
];

const formFields: Record<FertilizerStatutoryFormType, FieldConfig[]> = {
  J: [
    ...commonTopFields,
    { key: 'dealerNameAddress', label: 'Name and address of dealer/manufacturer/importer', type: 'textarea' },
    { key: 'authorizationNumber', label: 'Letter of authorization Number' },
    { key: 'samplingDate', label: 'Date of sampling', type: 'date' },
    { key: 'markings', label: 'Details of markings on the bags from where sample has been taken', type: 'textarea' },
    { key: 'fertilizerTypeGrade', label: 'Type and grade of fertilizer', type: 'select', options: fertilizerGradeOptions },
    { key: 'dealerManufacturerImporterName', label: 'Name of dealer/manufacturer/importer' },
    { key: 'batchDetails', label: 'Batch No. and date of manufacture/import' },
    { key: 'composition', label: 'Composition of Fertilizer', type: 'textarea' },
    { key: 'stockReceiptDate', label: 'Date of receipt of stock by dealer/manufacturer/importer/pool handling agency', type: 'date' },
    { key: 'sampleCode', label: 'Code no. of sample' },
    { key: 'stockPosition', label: 'Stock position of lot' },
    { key: 'physicalCondition', label: 'Physical condition of fertilizer', type: 'select', options: physicalConditionOptions },
    { key: 'bagSource', label: 'Samples drawn from open bags / stitched bags / bulk', type: 'select', options: bagSourceOptions },
    { key: 'inspectorNameAddress', label: 'Name and Address of Fertilizer Inspector drawing sample', type: 'textarea' },
    { key: 'dealerReceipt', label: 'Receipt of dealer', type: 'textarea' },
    ...commonBottomFields,
  ],
  K: [
    ...commonTopFields,
    { key: 'fromAddress', label: 'From address', type: 'textarea' },
    {
      key: 'toAddress',
      label: 'To address',
      type: 'select',
      options: FERTILIZER_TO_ADDRESS_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
    },
    { key: 'fertilizerTypeGrade', label: 'Type of fertilizer & Grade', type: 'select', options: fertilizerGradeOptions },
    { key: 'samplingDate', label: 'Date of sampling', type: 'date' },
    { key: 'physicalCondition', label: 'Physical condition of fertilizer', type: 'select', options: physicalConditionOptions },
    { key: 'sampleCode', label: 'Code number of Sample' },
    { key: 'forwardReportAddress', label: 'Forward analysis report to address', type: 'textarea' },
    ...commonBottomFields,
  ],
  P: [
    ...commonTopFields,
    { key: 'nameGrade', label: 'Name and Grade of Fertilizer', type: 'select', options: fertilizerGradeOptions },
    { key: 'composition', label: 'Composition', type: 'textarea' },
    { key: 'physicalCondition', label: 'Physical Condition of Fertilizer', type: 'select', options: physicalConditionOptions },
    { key: 'codeNumber', label: 'Code Number' },
    { key: 'samplingDate', label: 'Date of sampling', type: 'date' },
    { key: 'inspectorNameAddress', label: 'Name & Address of Fertilizer Inspector drawing sample', type: 'textarea' },
    ...commonBottomFields,
  ],
};

export function FertilizerStatutoryPdfTool({ onClose }: { onClose: () => void }) {
  const [formType, setFormType] = useState<FertilizerStatutoryFormType>('J');
  const [values, setValues] = useState<FertilizerPdfValues>(initialFertilizerPdfValues);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'preview' | 'download' | null>(null);
  const activeFields = useMemo(() => formFields[formType], [formType]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const setField = (key: keyof FertilizerPdfValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const previewPdf = async () => {
    setBusyAction('preview');
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = await createFertilizerPdfBlobUrl(formType, values);
      setPreviewUrl(url);
    } finally {
      setBusyAction(null);
    }
  };

  const downloadPdf = async () => {
    setBusyAction('download');
    try {
      const doc = await generateFertilizerStatutoryPdf(formType, values);
      doc.save(getFertilizerPdfFileName(formType, values));
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
      <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Fertilizer sampling PDF</p>
            <h2 className="truncate text-lg font-black text-slate-950">Generate FORM J / FORM K / FORM P</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-3 lg:border-b-0 lg:border-r sm:p-4">
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-black">
              {(['J', 'K', 'P'] as FertilizerStatutoryFormType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormType(type);
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

            <div className="grid gap-3 sm:grid-cols-2">
              {activeFields.map((field) => (
                <PdfInput
                  key={`${formType}-${field.key}`}
                  field={field}
                  value={values[field.key]}
                  onChange={(value) => setField(field.key, value)}
                />
              ))}
            </div>

            <div className="sticky bottom-0 mt-4 grid gap-2 border-t border-slate-200 bg-white pt-3 sm:grid-cols-2">
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
                onClick={downloadPdf}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {busyAction === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </button>
            </div>
          </div>

          <div className="flex min-h-[45vh] flex-col bg-slate-100 p-3 sm:p-4 lg:min-h-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                <FileText className="h-4 w-4 text-emerald-700" />
                A4 PDF Preview
              </div>
              <button
                type="button"
                onClick={printPreview}
                disabled={!previewUrl}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-black text-slate-700 hover:bg-white disabled:opacity-40"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>

            {previewUrl ? (
              <iframe
                id="fertilizer-pdf-preview"
                src={previewUrl}
                title="Fertilizer statutory PDF preview"
                className="min-h-[58vh] flex-1 rounded-lg border border-slate-200 bg-white shadow-sm lg:min-h-0"
              />
            ) : (
              <div className="flex min-h-[58vh] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 lg:min-h-0">
                <FileText className="mb-3 h-12 w-12 text-slate-300" />
                <p className="text-sm font-bold">Fill the required fields and tap Preview PDF.</p>
                <p className="mt-1 max-w-md text-xs">
                  The generated document uses A4 page size with government-style title, clause, numbering, place, date,
                  signature, and metallic seal impression space.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
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
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';

  return (
    <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className={commonClass} />
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

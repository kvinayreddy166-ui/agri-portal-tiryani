import React, { useMemo, useState } from 'react';
import { FileText, Printer, RotateCcw } from 'lucide-react';

type FormFieldKey =
  | 'dealerNameAddress'
  | 'registrationNumber'
  | 'samplingDate'
  | 'markingDetails'
  | 'fertilizerTypeGrade'
  | 'manufacturerImporter'
  | 'samplesTaken'
  | 'batchDetails'
  | 'compositionN'
  | 'compositionP'
  | 'compositionK'
  | 'compositionS'
  | 'stockReceiptDate'
  | 'sampleCode'
  | 'stockPosition'
  | 'physicalCondition'
  | 'bagCondition'
  | 'inspectorNameAddress';

type FormState = Record<FormFieldKey, string>;

type AddressOption = {
  id: string;
  label: string;
  lines: string[];
};

const ADDRESS_OPTIONS: AddressOption[] = [
  {
    id: 'jda-soil-correlator',
    label: 'JDA Soil Correlator',
    lines: ['The Designated Authority', 'JDA Soil Correlator'],
  },
  {
    id: 'fertilizer-coding-centre',
    label: 'Fertilizer Coding Centre, Hyderabad',
    lines: [
      'The Designated Authority',
      'JDA Soil Correlator',
      'Fertilizer Coding Centre,',
      'SAMETI Complex, Old Malakpet,',
      'Hyderabad.',
    ],
  },
  {
    id: 'assistant-director-agriculture',
    label: 'Assistant Director of Agriculture',
    lines: [
      'Assistant Director of Agriculture,',
      'Fertilizer Coding Centre,',
      'SAMETI Complex, Old Malakpet,',
      'Hyderabad.',
    ],
  },
];

const FORM_FIELDS: { key: FormFieldKey; label: string; multiline?: boolean }[] = [
  { key: 'dealerNameAddress', label: '(1) Name and address of dealer/manufacturer/importer', multiline: true },
  { key: 'registrationNumber', label: '(1A) Certificate of Registration Number' },
  { key: 'samplingDate', label: '(2) Date of sampling' },
  { key: 'markingDetails', label: '(3) Details of markings on bags from where sample has been taken', multiline: true },
  { key: 'fertilizerTypeGrade', label: '(i) Type and grade of fertilizer' },
  { key: 'manufacturerImporter', label: '(ii) Name of manufacturer/importer' },
  { key: 'samplesTaken', label: 'No.of Samples Taken' },
  { key: 'batchDetails', label: '(iv) Batch No. (if applicable) and date of manufacture/import' },
  { key: 'stockReceiptDate', label: '(4) Date of receipt of the stock by the dealer/manufacturer/importer/pool handling agency' },
  { key: 'sampleCode', label: '(5) Code No. of sample' },
  { key: 'stockPosition', label: '(6) Stock position of the lot' },
  { key: 'physicalCondition', label: '(7) Physical condition of fertilizer' },
  { key: 'bagCondition', label: '(8) Whether samples drawn from open bags or stitched bags' },
  { key: 'inspectorNameAddress', label: '(9) Name & Address of Fertilizer Inspector drawing sample :', multiline: true },
];

const initialFormState: FormState = {
  dealerNameAddress: '',
  registrationNumber: '',
  samplingDate: new Date().toISOString().slice(0, 10),
  markingDetails: '',
  fertilizerTypeGrade: '',
  manufacturerImporter: '',
  samplesTaken: '',
  batchDetails: '',
  compositionN: '',
  compositionP: '',
  compositionK: '',
  compositionS: '',
  stockReceiptDate: '',
  sampleCode: '',
  stockPosition: '',
  physicalCondition: '',
  bagCondition: '',
  inspectorNameAddress: '',
};

export function FertilizerSamplePdfGenerator() {
  const [formJAddressId, setFormJAddressId] = useState(ADDRESS_OPTIONS[0].id);
  const [formKAddressId, setFormKAddressId] = useState(ADDRESS_OPTIONS[1].id);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [printError, setPrintError] = useState('');

  const formJAddress = useMemo(
    () => ADDRESS_OPTIONS.find((option) => option.id === formJAddressId) || ADDRESS_OPTIONS[0],
    [formJAddressId]
  );
  const formKAddress = useMemo(
    () => ADDRESS_OPTIONS.find((option) => option.id === formKAddressId) || ADDRESS_OPTIONS[1],
    [formKAddressId]
  );

  const updateField = (key: FormFieldKey, value: string) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setFormJAddressId(ADDRESS_OPTIONS[0].id);
    setFormKAddressId(ADDRESS_OPTIONS[1].id);
    setFormState(initialFormState);
    setPrintError('');
  };

  const generateSinglePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setPrintError('Please allow popups, then try Generate single PDF again.');
      return;
    }

    setPrintError('');
    printWindow.document.write(buildCombinedFormsHtml(formJAddress, formKAddress, formState));
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
  };

  return (
    <section className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="h-fit rounded-lg bg-amber-50 p-2 text-amber-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">Fertilizer Form J, K, P PDF Generator</h2>
            <p className="text-sm text-gray-500">
              Select the To address for Form J and Form K, fill Form P details once, and create one combined PDF file.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={generateSinglePdf}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-amber-900/10 transition hover:bg-amber-700"
          >
            <Printer className="h-4 w-4" />
            Generate single PDF
          </button>
        </div>
      </div>

      {printError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {printError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Form J To address"
          value={formJAddressId}
          onChange={setFormJAddressId}
          options={ADDRESS_OPTIONS}
        />
        <SelectField
          label="Form K To address"
          value={formKAddressId}
          onChange={setFormKAddressId}
          options={ADDRESS_OPTIONS}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {FORM_FIELDS.map((field) => (
          <TextInput
            key={field.key}
            label={field.label}
            value={formState[field.key]}
            multiline={field.multiline}
            onChange={(value) => updateField(field.key, value)}
          />
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-gray-600">Composition</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {(['compositionN', 'compositionP', 'compositionK', 'compositionS'] as FormFieldKey[]).map((key) => (
            <TextInput
              key={key}
              label={key.replace('composition', '')}
              value={formState[key]}
              onChange={(value) => updateField(key, value)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: AddressOption[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-bold text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
      ) : (
        <input
          type={label.toLowerCase().includes('date') ? 'date' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
      )}
    </div>
  );
}

function buildCombinedFormsHtml(formJAddress: AddressOption, formKAddress: AddressOption, values: FormState) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Form J K P - Fertilizer Sample</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.35; }
    .page { min-height: 267mm; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    h1 { margin: 0 0 14px; text-align: center; font-size: 20px; text-transform: uppercase; }
    h2 { margin: 16px 0 8px; font-size: 15px; }
    .address { margin: 18px 0 28px; font-size: 16px; font-weight: 700; line-height: 1.35; }
    .to { margin-bottom: 3px; font-weight: 400; }
    .body-copy { min-height: 170mm; white-space: pre-wrap; }
    .signature { margin-top: 40px; text-align: right; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #9ca3af; padding: 6px 7px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    .label { width: 58%; font-weight: 600; }
    .value { min-height: 24px; white-space: pre-wrap; }
    .composition-label { text-align: right; font-weight: 700; width: 58%; }
    .small-note { margin-top: 10px; color: #333; font-size: 11px; }
  </style>
</head>
<body>
  ${renderFormJ(formJAddress, values)}
  ${renderFormK(formKAddress, values)}
  ${renderFormP(values)}
</body>
</html>`;
}

function renderFormJ(address: AddressOption, values: FormState) {
  return `<section class="page">
    <h1>FORM J</h1>
    ${renderAddressBlock(address)}
    <div class="body-copy">${nl2br(values.markingDetails || 'Fertilizer sample details are enclosed for necessary action.')}</div>
    <div class="signature">Fertilizer Inspector</div>
  </section>`;
}

function renderFormK(address: AddressOption, values: FormState) {
  return `<section class="page">
    <h1>FORM K</h1>
    ${renderAddressBlock(address)}
    <div class="body-copy">${nl2br(values.markingDetails || 'Fertilizer sample details are enclosed for analysis and further action.')}</div>
    <div class="signature">Fertilizer Inspector</div>
  </section>`;
}

function renderFormP(values: FormState) {
  return `<section class="page">
    <h1>FORM P</h1>
    <table>
      ${renderRow('(1) Name and address of dealer/manufacturer/importer', values.dealerNameAddress)}
      ${renderRow('(1A) Certificate of Registration Number', values.registrationNumber)}
      ${renderRow('(2) Date of sampling', formatDate(values.samplingDate))}
      ${renderRow('(3) Details of markings on bags from where sample has been taken', values.markingDetails)}
      ${renderRow('(i) Type and grade of fertilizer', values.fertilizerTypeGrade)}
      ${renderRow('(ii) Name of manufacturer/importer', values.manufacturerImporter)}
      ${renderRow('No.of Samples Taken', values.samplesTaken)}
      ${renderRow('(iv) Batch No. (if applicable) and date of manufacture/import', values.batchDetails)}
      <tr><td class="label">(v) Composition</td><td class="value">&nbsp;</td></tr>
      ${renderCompositionRow('N', values.compositionN)}
      ${renderCompositionRow('P', values.compositionP)}
      ${renderCompositionRow('K', values.compositionK)}
      ${renderCompositionRow('S', values.compositionS)}
      ${renderRow('(4) Date of receipt of the stock by the dealer/manufacturer/importer/pool handling agency', formatDate(values.stockReceiptDate))}
      ${renderRow('(5) Code No. of sample', values.sampleCode)}
      ${renderRow('(6) Stock position of the lot', values.stockPosition)}
      ${renderRow('(7) Physical condition of fertilizer', values.physicalCondition)}
      ${renderRow('(8) Whether samples drawn from open bags or stitched bags', values.bagCondition)}
      ${renderRow('(9) Name & Address of Fertilizer Inspector drawing sample :', values.inspectorNameAddress)}
    </table>
  </section>`;
}

function renderAddressBlock(address: AddressOption) {
  return `<div class="address"><div class="to">To</div>${address.lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</div>`;
}

function renderRow(label: string, value: string) {
  return `<tr><td class="label">${escapeHtml(label)}</td><td class="value">${value ? nl2br(value) : '&nbsp;'}</td></tr>`;
}

function renderCompositionRow(label: string, value: string) {
  return `<tr><td class="composition-label">${escapeHtml(label)}</td><td class="value">${value ? nl2br(value) : '&nbsp;'}</td></tr>`;
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

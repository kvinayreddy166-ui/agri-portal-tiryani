import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Edit3, FileText, FileType, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { currentFinancialYear } from '../../../shared/utils/financialYear';
import { withOthersOption, effectiveLocationValue } from '../../../shared/data/assistantDirectorLocation';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../../../shared/data/telanganaDistrictMandalData';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import {
  buildNoticeWordDocument,
  designationOptionsFor,
  formatNoticeDate,
  isAdaDesignation,
  isDaoDesignation,
  isMaoDesignation,
  noticeBlocksHtml,
  readStatutoryDetails,
  renderNoticePdfDocument,
  resolveDistrict,
  resolveMandal,
  SelectInput,
  TextInput,
  type NoticeBlock,
} from './ShowCauseNoticeEntry';
import { CROP_OPTIONS } from '../pages/SeedDealerInspection';

interface SeedSeizureProductRow {
  id: string;
  crop: string;
  cropOther: string;
  variety: string;
  lotNo: string;
  source: string;
  quantity: string;
  remarks: string;
}

interface SeedSeizureFormState {
  refNumber: string;
  seizureDate: string;
  officerName: string;
  officerDesignation: string;
  mandal: string;
  manualMandal: string;
  district: string;
  manualDistrict: string;
  division: string;
  firmName: string;
  dealerAddress: string;
  recordsDetails: string;
  products: SeedSeizureProductRow[];
}

interface SavedSeedSeizureOrder extends SeedSeizureFormState {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'agri-legal-seed-seizure-orders';
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const emptyProduct = (): SeedSeizureProductRow => ({
  id: uid(),
  crop: '',
  cropOther: '',
  variety: '',
  lotNo: '',
  source: '',
  quantity: '',
  remarks: '',
});

function readSavedOrders(): SavedSeedSeizureOrder[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedOrders(orders: SavedSeedSeizureOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

const FORM_DRAFT_KEY = `${STORAGE_KEY}-draft`;

function normalizeProducts(rows: (Partial<SeedSeizureProductRow> & { name?: string; company?: string; batchNo?: string })[] | undefined): SeedSeizureProductRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return [emptyProduct()];
  return rows.map((row) => ({
    ...emptyProduct(),
    ...row,
    variety: row.variety ?? row.name ?? '',
    source: row.source ?? row.company ?? '',
    lotNo: row.lotNo ?? row.batchNo ?? '',
    id: row.id || uid(),
  }));
}

function readFormDraft(): SeedSeizureFormState | null {
  try {
    const raw = window.localStorage.getItem(FORM_DRAFT_KEY);
    if (!raw) return null;
    const parsed = { ...makeInitialForm(), ...(JSON.parse(raw) as Partial<SeedSeizureFormState>) };
    parsed.products = normalizeProducts(parsed.products);
    return parsed;
  } catch {
    return null;
  }
}

function makeInitialForm(): SeedSeizureFormState {
  const fy = currentFinancialYear();
  const statutory = readStatutoryDetails('seed');
  const resolvedDistrict = resolveDistrict(statutory.district || 'Kumuram Bheem Asifabad', statutory.manualDistrict || '');
  const resolvedMandal = resolveMandal(resolvedDistrict.district, statutory.mandal || 'Tiryani', statutory.manualMandal || '');
  return {
    refNumber: `REC/S/${fy}`,
    seizureDate: today(),
    officerName: statutory.officerName || '',
    officerDesignation: statutory.officerDesignation || 'Mandal Agriculture Officer & Seed Inspector',
    mandal: resolvedMandal.mandal,
    manualMandal: resolvedMandal.manualMandal,
    district: resolvedDistrict.district,
    manualDistrict: resolvedDistrict.manualDistrict,
    division: statutory.division || '',
    firmName: statutory.dealerName || '',
    dealerAddress: statutory.dealerAddress || '',
    recordsDetails: '',
    products: [emptyProduct()],
  };
}

// Form IV — Form of Receipt of Records seized under Clause (4) of
// Sub-section (1) of Section 14 of the Seeds Act, 1966 (No. 54 of 1966).
function buildSeizureModel(form: SeedSeizureFormState): NoticeBlock[] {
  const mandalValue = effectiveLocationValue(form.mandal, form.manualMandal) || '________________';
  const districtValue = effectiveLocationValue(form.district, form.manualDistrict) || '________________';
  const districtDisplay = districtValue.toLowerCase() === 'kumrambheem asifabad' ? 'Kumuram Bheem Asifabad' : districtValue;
  const divisionName = form.division.trim() || '________________';
  const officerDesignation = form.officerDesignation || 'Seed Inspector';
  const firmDisplay = form.firmName.trim() || '____________________________';
  const premisesDisplay = [
    form.dealerAddress.replace(/\s+/g, ' ').trim().replace(/,+$/, ''),
    `${mandalValue} Mandal`,
    `${districtDisplay} District`,
  ].filter(Boolean).join(', ') || '____________________________';
  const dateValue = form.seizureDate ? formatNoticeDate(form.seizureDate) : '__________';

  const designationParts = officerDesignation.split('&').map((part) => part.trim()).filter(Boolean);
  const signatureItems: { text: string; bold?: boolean }[][] = designationParts.length > 1
    ? [[{ text: `${designationParts[0]} &`, bold: true }], [{ text: designationParts.slice(1).join(' & ').replace(/,+$/, ''), bold: true }]]
    : [[{ text: officerDesignation, bold: true }]];
  const issuedByPlace = isDaoDesignation(officerDesignation)
    ? districtDisplay
    : isAdaDesignation(officerDesignation)
      ? divisionName
      : mandalValue;
  const issuedByDisplay = `${officerDesignation}, ${issuedByPlace}`;

  const addressLines = form.dealerAddress.split('\n').map((line) => line.trim()).filter(Boolean);
  const dealerItems = [
    [{ text: `M/s. ${firmDisplay},`, bold: true }],
    ...addressLines.map((line) => [{ text: `${line.replace(/,+$/, '')},`, bold: true }]),
    [{ text: `${mandalValue} Mandal,`, bold: true }],
    [{ text: `${districtDisplay} District.`, bold: true }],
  ];

  const recordLines = form.recordsDetails
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const recordItems = recordLines.length
    ? recordLines.map((line, index) => [{ text: `${index + 1}. ${line}` }])
    : [[{ text: '1. ...................................................................................' }],
       [{ text: '2. ...................................................................................' }],
       [{ text: '3. ...................................................................................' }]];

  const filledProducts = form.products.filter((item) =>
    [item.crop, item.cropOther, item.variety, item.lotNo, item.source, item.quantity, item.remarks].some((field) => field?.trim())
  );
  const tableRows = filledProducts.map((item, index) => {
    const crop = item.crop === 'Others' ? item.cropOther.trim() : item.crop;
    const seedName = [crop, item.variety.trim()].filter(Boolean).join(' / ');
    return [
      String(index + 1),
      seedName,
      item.lotNo,
      item.source,
      item.quantity,
      item.remarks,
    ];
  });

  return [
    { kind: 'center', text: 'FORM IV', bold: true, size: 14 },
    { kind: 'center', text: '(Form of Receipt of Records)', bold: true, size: 14 },
    { kind: 'gap', mm: 4 },
    ...(form.refNumber.trim()
      ? [
          { kind: 'memoRow', left: [{ text: 'No: ' }, { text: form.refNumber.trim(), bold: true }], right: [{ text: 'Date: ' }, { text: dateValue, bold: true }] } as NoticeBlock,
          { kind: 'gap', mm: 2 } as NoticeBlock,
        ]
      : []),
    { kind: 'lines', items: [[{ text: 'To,', bold: true }]] },
    { kind: 'lines', items: dealerItems, indent: 8 },
    { kind: 'gap', mm: 4 },
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'The records detailed below have this day been Seized by me, ' },
        { text: issuedByDisplay, bold: true },
        { text: ' under the provisions of Clause (4) of Sub section (1) of section 14 of the ' },
        { text: 'Seeds Act, 1966', bold: true },
        { text: ' (No. 54 of 1966) from the premises of ' },
        { text: `M/s. ${firmDisplay}`, bold: true },
        { text: ' situated at ' },
        { text: premisesDisplay, bold: true },
        { text: '.' },
      ],
    },
    { kind: 'gap', mm: 5 },
    { kind: 'lines', items: [[{ text: 'Details of seed stock seized', bold: true, underline: true }]], keepWithNext: true },
    { kind: 'gap', mm: 1, keepWithNext: true },
    {
      kind: 'gridTable',
      header: ['S.No.', 'Name of Seed (Crop & Variety)', 'Lot / Batch No.', 'Source / Purchased from', 'Quantity', 'Remarks'],
      colWeights: [7, 28, 14, 22, 12, 17],
      rows: tableRows.length ? tableRows : [['1', '', '', '', '', '']],
    },
    { kind: 'gap', mm: 4 },
    { kind: 'lines', items: [[{ text: 'Details of records Seized', bold: true, underline: true }]] },
    { kind: 'gap', mm: 2 },
    { kind: 'lines', items: recordItems },
    { kind: 'gap', mm: 8 },
    {
      kind: 'memoRow',
      leftLines: [
        [{ text: 'Place : ' }, { text: mandalValue, bold: true }],
        [{ text: 'Date : ' }, { text: dateValue, bold: true }],
      ],
      rightLines: signatureItems,
      keepWithNext: true,
    },
    { kind: 'gap', mm: 10, keepWithNext: true },
    { kind: 'lines', items: [[{ text: 'Copy to:', bold: true }]], keepWithNext: true },
    ...(isDaoDesignation(officerDesignation)
      ? `1. The Commissioner & Director of Agriculture, Telangana State, for favour of information and necessary action.\n2. The Asst. Director of Agriculture (R) concerned, for information and to serve the order on the dealer under proper dated acknowledgement.\n3. Stock File / Spare.`
      : isAdaDesignation(officerDesignation)
        ? `1. The District Agriculture Officer, ${districtDisplay}, for favour of information and necessary action.\n2. The Mandal Agriculture Officer concerned, for information and to serve the order on the dealer under proper dated acknowledgement.\n3. Stock File / Spare.`
        : `1. The Asst. Director of Agriculture (R), ${divisionName}, for information and necessary action.\n2. The District Agriculture Officer, ${districtDisplay}, for information and necessary action.\n3. Copy to Stock File.`
    ).split('\n').map((line, index, arr): NoticeBlock => {
      const keepWithNext = index < arr.length - 1;
      const match = line.match(/^(\d+\.)\s*(.*)$/);
      return match
        ? { kind: 'labelPara', label: match[1], labelBold: false, segments: [{ text: match[2] }], keepWithNext }
        : { kind: 'lines', items: [[{ text: line }]], keepWithNext };
    }),
  ];
}

export function SeedSeizureOrderEntry() {
  const [form, setForm] = useState<SeedSeizureFormState>(() => readFormDraft() ?? makeInitialForm());
  const [savedOrders, setSavedOrders] = useState<SavedSeedSeizureOrder[]>(() => readSavedOrders());
  const [savedSearch, setSavedSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [resetSpinKey, setResetSpinKey] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo, showWarning } = useToast();

  const noticeBlocks = useMemo(() => buildSeizureModel(form), [form]);
  const previewHtml = useMemo(() => noticeBlocksHtml(noticeBlocks), [noticeBlocks]);

  const districtOptions = useMemo(
    () => withOthersOption(TELANGANA_DISTRICTS.map((item) => ({ label: item, value: item }))),
    []
  );
  const mandalOptions = useMemo(() => {
    if (form.district && form.district !== 'Others') {
      return withOthersOption(getMandalsForDistrict(form.district).map((item) => ({ label: item, value: item })));
    }
    return [{ label: 'Others', value: 'Others' }];
  }, [form.district]);
  const designationOptions = useMemo(() => {
    const base = designationOptionsFor('seed');
    return form.officerDesignation && !base.some((item) => item.value === form.officerDesignation)
      ? [{ label: form.officerDesignation, value: form.officerDesignation }, ...base]
      : base;
  }, [form.officerDesignation]);

  const isADAOfficer = isAdaDesignation(form.officerDesignation);
  const isDAOOfficer = isDaoDesignation(form.officerDesignation);
  const isMAOOfficer = isMaoDesignation(form.officerDesignation);

  useEffect(() => {
    writeSavedOrders(savedOrders);
  }, [savedOrders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const updateForm = (patch: Partial<SeedSeizureFormState>) => setForm((current) => ({ ...current, ...patch }));

  const updateProduct = (id: string, patch: Partial<SeedSeizureProductRow>) =>
    setForm((current) => ({
      ...current,
      products: current.products.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));

  const addProduct = () => setForm((current) => ({ ...current, products: [...current.products, emptyProduct()] }));
  const removeProduct = (id: string) =>
    setForm((current) => ({ ...current, products: current.products.filter((row) => row.id !== id) }));

  const saveOrder = () => {
    const entry: SavedSeedSeizureOrder = {
      ...form,
      id: editingId || uid(),
      savedAt: new Date().toISOString(),
    };
    setSavedOrders((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    setEditingId(entry.id);
    showSaved('Order saved', entry.refNumber || 'Receipt of Records');
  };

  const editSavedOrder = (order: SavedSeedSeizureOrder) => {
    setForm({ ...order, products: normalizeProducts(order.products) });
    setEditingId(order.id);
    setShowPreview(false);
    showLoaded('Order loaded', order.refNumber || 'Receipt of Records');
  };

  const deleteSavedOrder = (order: SavedSeedSeizureOrder) => {
    setSavedOrders((current) => current.filter((item) => item.id !== order.id));
    if (editingId === order.id) setEditingId(null);
    showDeleted('Order deleted', order.refNumber || 'Untitled order');
  };

  const performReset = () => {
    setResetSpinKey((current) => current + 1);
    const next = makeInitialForm();
    setForm({
      ...next,
      refNumber: '',
      seizureDate: '',
      officerName: '',
      officerDesignation: '',
      mandal: '',
      district: '',
      manualMandal: '',
      manualDistrict: '',
      division: '',
      firmName: '',
      dealerAddress: '',
      recordsDetails: '',
      products: [emptyProduct()],
    });
    setEditingId(null);
    setShowPreview(false);
    showReset('Form reset');
  };

  const filteredSaved = useMemo(() => {
    const term = savedSearch.trim().toLowerCase();
    if (!term) return savedOrders;
    return savedOrders.filter((order) =>
      [order.refNumber, order.firmName, order.seizureDate].join(' ').toLowerCase().includes(term)
    );
  }, [savedOrders, savedSearch]);

  const fileBase = () => `${form.refNumber || 'receipt-of-records'}`.replace(/[\\/]/g, '-');

  const downloadPdf = async () => {
    const doc = await renderNoticePdfDocument(noticeBlocks, form.refNumber || 'Receipt of Records', 'bookAntiqua');
    doc.save(`${fileBase()}.pdf`);
    showSuccess('PDF downloaded', `${fileBase()}.pdf`);
  };

  const downloadWord = async () => {
    try {
      const blob = await buildNoticeWordDocument(noticeBlocks, 'bookAntiqua');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileBase()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showSuccess('Word downloaded', `${fileBase()}.docx`);
    } catch (error) {
      console.error('Unable to generate record receipt Word document:', error);
      showWarning('Word export failed', 'Please try again.');
    }
  };

  const previewOrder = () => {
    setShowPreview(true);
    showInfo('Preview ready');
    window.requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset form?"
        message="All entered details will be cleared."
        onConfirm={() => { setResetConfirmOpen(false); performReset(); }}
        onCancel={() => setResetConfirmOpen(false)}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => setResetConfirmOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-50 dark:border-red-800/50 dark:bg-slate-900 dark:text-red-300 sm:text-sm">
          <RotateCcw key={resetSpinKey} className="h-4 w-4 reset-ccw-spin" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Officer Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Seed Inspector" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
          <SelectInput label="Designation" value={form.officerDesignation} onChange={(value) => updateForm({ officerDesignation: value })} options={designationOptions} />
          <SelectInput
            label="District"
            value={form.district}
            onChange={(value) => updateForm({ district: value, mandal: '', manualMandal: '', manualDistrict: '' })}
            options={districtOptions}
          />
          {form.district === 'Others' && (
            <TextInput label="Enter District Name" value={form.manualDistrict} onChange={(value) => updateForm({ manualDistrict: value })} />
          )}
          {(isADAOfficer || isMAOOfficer) && (
            <TextInput
              label="Division"
              value={form.division}
              onChange={(value) => updateForm({ division: value })}
            />
          )}
          <SelectInput
            label={isADAOfficer || isDAOOfficer ? 'Mandal (Place of seizure)' : 'Mandal (Area)'}
            value={form.mandal}
            onChange={(value) => updateForm({ mandal: value, manualMandal: value === 'Others' ? form.manualMandal : '' })}
            options={mandalOptions}
          />
          {form.mandal === 'Others' && (
            <TextInput label="Enter Mandal / Area Name" value={form.manualMandal} onChange={(value) => updateForm({ manualMandal: value })} />
          )}
          <TextInput label="Notice No." optional value={form.refNumber} onChange={(value) => updateForm({ refNumber: value })} />
          <TextInput label="Date" type="date" value={form.seizureDate} onChange={(value) => updateForm({ seizureDate: value })} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Dealer Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value })} />
          <label className="block md:col-span-3">
            <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Firm Address</span>
            <span className="mb-1 block text-[10px] font-semibold leading-tight text-slate-400 dark:text-slate-500">
              {effectiveLocationValue(form.mandal, form.manualMandal) || 'Mandal'} Mandal,<br />
              {effectiveLocationValue(form.district, form.manualDistrict) || 'District'} District. (auto-added)
            </span>
            <textarea
              value={form.dealerAddress}
              onChange={(event) => updateForm({ dealerAddress: event.target.value })}
              placeholder="D.No, Road, Village"
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Details of Records Seized</h3>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold leading-tight text-slate-400 dark:text-slate-500">
            One record per line — e.g., stock register, sale bills, purchase invoices
          </span>
          <textarea
            value={form.recordsDetails}
            onChange={(event) => updateForm({ recordsDetails: event.target.value })}
            placeholder={'Stock register\nSale bills\nPurchase invoices'}
            rows={4}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Seized Stock Details</h3>
          <button
            type="button"
            onClick={addProduct}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </button>
        </div>
        <div className="space-y-3">
          {form.products.map((row, index) => (
            <div key={row.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeProduct(row.id)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-red-600 hover:bg-red-50 dark:text-red-300"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <SelectInput
                  label="Crop"
                  value={row.crop}
                  onChange={(value) => updateProduct(row.id, { crop: value, cropOther: value === 'Others' ? row.cropOther : '' })}
                  options={withOthersOption(CROP_OPTIONS.map((item) => ({ label: item, value: item })))}
                />
                {row.crop === 'Others' ? (
                  <TextInput label="Enter Crop" value={row.cropOther} onChange={(value) => updateProduct(row.id, { cropOther: value })} />
                ) : (
                  <TextInput label="Variety" value={row.variety} onChange={(value) => updateProduct(row.id, { variety: value })} />
                )}
                {row.crop === 'Others' && (
                  <TextInput label="Variety" value={row.variety} onChange={(value) => updateProduct(row.id, { variety: value })} />
                )}
                <TextInput label="Lot / Batch No." value={row.lotNo} onChange={(value) => updateProduct(row.id, { lotNo: value })} />
                <TextInput label="Source / Purchased from" value={row.source} onChange={(value) => updateProduct(row.id, { source: value })} />
                <TextInput label="Quantity" value={row.quantity} onChange={(value) => updateProduct(row.id, { quantity: value })} />
                <TextInput label="Remarks" value={row.remarks} onChange={(value) => updateProduct(row.id, { remarks: value })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={previewOrder} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 sm:text-sm">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Preview
        </button>
        <button type="button" onClick={saveOrder} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-900 sm:text-sm">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Draft
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:text-sm"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
            <ChevronDown className={`h-4 w-4 transition-transform ${exportOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {exportOpen && (
            <>
              <button
                type="button"
                aria-label="Close export menu"
                onClick={() => setExportOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => { setExportOpen(false); void downloadPdf(); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => { setExportOpen(false); void downloadWord(); }}
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-xs font-black text-blue-700 transition hover:bg-blue-50 dark:border-slate-800 dark:text-blue-300 dark:hover:bg-slate-800 sm:text-sm"
                >
                  <FileType className="h-4 w-4" aria-hidden="true" />
                  WORD
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showPreview && (
        <section ref={previewRef} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Form IV — Receipt of Records Preview</h3>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
              Close Preview
            </button>
          </div>
          <div
            className="max-h-[520px] overflow-auto rounded-lg bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white shadow-inner ring-1 ring-slate-100"
            style={{ fontFamily: `'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', 'Nirmala UI', serif`, fontSize: '12pt', lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </section>
      )}

      <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Saved Orders</h3>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={savedSearch}
              onChange={(event) => setSavedSearch(event.target.value)}
              placeholder="Search saved orders"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Ref No.</th>
                <th className="px-3 py-2">Firm</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSaved.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-black">{order.refNumber}</td>
                  <td className="px-3 py-2">{order.firmName || '-'}</td>
                  <td className="px-3 py-2">{formatNoticeDate(order.seizureDate) || '-'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => editSavedOrder(order)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteSavedOrder(order)} aria-label="Delete saved order" className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 dark:text-red-300 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSaved.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center font-semibold text-slate-500 dark:text-slate-400">No saved orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

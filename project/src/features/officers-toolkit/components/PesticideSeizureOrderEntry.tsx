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

interface PestSeizureProductRow {
  id: string;
  name: string;
  manufacturedBy: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  quantity: string;
  remarks: string;
}

interface PestSeizureFormState {
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
  premisesAt: string;
  folioNo: string;
  products: PestSeizureProductRow[];
}

interface SavedPestSeizureOrder extends PestSeizureFormState {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'agri-legal-pesticide-seizure-orders';
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const emptyProduct = (): PestSeizureProductRow => ({
  id: uid(),
  name: '',
  manufacturedBy: '',
  batchNo: '',
  mfgDate: '',
  expiryDate: '',
  quantity: '',
  remarks: '',
});

function readSavedOrders(): SavedPestSeizureOrder[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedOrders(orders: SavedPestSeizureOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

const FORM_DRAFT_KEY = `${STORAGE_KEY}-draft`;

function readFormDraft(): PestSeizureFormState | null {
  try {
    const raw = window.localStorage.getItem(FORM_DRAFT_KEY);
    if (!raw) return null;
    return { ...makeInitialForm(), ...(JSON.parse(raw) as Partial<PestSeizureFormState>) };
  } catch {
    return null;
  }
}

function makeInitialForm(): PestSeizureFormState {
  const fy = currentFinancialYear();
  const statutory = readStatutoryDetails('pesticide');
  const resolvedDistrict = resolveDistrict(statutory.district || 'Kumuram Bheem Asifabad', statutory.manualDistrict || '');
  const resolvedMandal = resolveMandal(resolvedDistrict.district, statutory.mandal || 'Tiryani', statutory.manualMandal || '');
  return {
    refNumber: `REC/P/${fy}`,
    seizureDate: today(),
    officerName: statutory.officerName || '',
    officerDesignation: statutory.officerDesignation || 'Mandal Agriculture Officer & Insecticide Inspector',
    mandal: resolvedMandal.mandal,
    manualMandal: resolvedMandal.manualMandal,
    district: resolvedDistrict.district,
    manualDistrict: resolvedDistrict.manualDistrict,
    division: statutory.division || '',
    firmName: statutory.dealerName || '',
    premisesAt: '',
    folioNo: '',
    products: [emptyProduct()],
  };
}

// Form V(B) — Form of Receipt for the Seized Insecticides [See rule 32],
// seizure under clause (d) of sub-section (1) of section 21 of the
// Insecticides Act, 1968.
function buildSeizureModel(form: PestSeizureFormState): NoticeBlock[] {
  const officerDesignation = form.officerDesignation || 'Insecticide Inspector';
  const mandalValue = effectiveLocationValue(form.mandal, form.manualMandal) || '________________';
  const districtValue = effectiveLocationValue(form.district, form.manualDistrict) || '________________';
  const districtDisplay = districtValue.toLowerCase() === 'kumrambheem asifabad' ? 'Kumuram Bheem Asifabad' : districtValue;
  const firmDisplay = form.firmName.trim() || '____________________________';
  const premisesInline = form.premisesAt.replace(/\s+/g, ' ').trim().replace(/,+$/, '');
  const premisesDisplay = `${premisesInline ? `${premisesInline}, ` : ''}${mandalValue} Mandal, ${districtDisplay} District`;
  const folioDisplay = form.folioNo.trim() || '__________';
  const divisionName = form.division.trim() || '________________';
  const dateValue = form.seizureDate ? formatNoticeDate(form.seizureDate) : '__________';

  const parsed = form.seizureDate ? new Date(`${form.seizureDate}T00:00:00`) : null;
  const dayDisplay = parsed ? String(parsed.getDate()).padStart(2, '0') : '____';
  const monthDisplay = parsed ? parsed.toLocaleString('en-US', { month: 'long' }) : '________';
  const yearDisplay = parsed ? String(parsed.getFullYear()).slice(2) : '____';

  const addressLines = form.premisesAt.split('\n').map((line) => line.trim()).filter(Boolean);
  const dealerItems: { text: string; bold?: boolean }[][] = [
    [{ text: `M/s. ${firmDisplay},`, bold: true }],
    ...addressLines.map((line) => [{ text: `${line.replace(/,+$/, '')},`, bold: true }] as { text: string; bold?: boolean }[]),
    [{ text: `${mandalValue} Mandal,`, bold: true }],
    [{ text: `${districtDisplay} District.`, bold: true }],
  ];

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

  const filledProducts = form.products.filter((item) =>
    [item.name, item.manufacturedBy, item.batchNo, item.mfgDate, item.expiryDate, item.quantity, item.remarks].some((field) => field.trim())
  );
  const tableRows = filledProducts.map((item, index) => [
    String(index + 1),
    item.name,
    item.manufacturedBy,
    item.batchNo,
    [item.mfgDate, item.expiryDate].filter(Boolean).join(' / '),
    item.quantity,
    item.remarks,
  ]);

  return [
    { kind: 'center', text: 'V (B): FORM OF RECEIPT FOR THE SEIZED INSECTICIDES', bold: true, size: 13 },
    { kind: 'center', text: '[See rule 32]', bold: true },
    { kind: 'gap', mm: 4 },
    ...(form.refNumber.trim()
      ? [
          { kind: 'memoRow', left: [{ text: 'No: ' }, { text: form.refNumber.trim(), bold: true }], right: [{ text: 'Date: ' }, { text: dateValue, bold: true }] } as NoticeBlock,
          { kind: 'gap', mm: 2 } as NoticeBlock,
        ]
      : []),
    { kind: 'lines', items: [[{ text: 'To,', bold: true }]] },
    { kind: 'lines', items: dealerItems, indent: 8 },
    { kind: 'gap', mm: 3 },
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'The stock of the insecticide(s) detailed below has this day ' },
        { text: dayDisplay, bold: true },
        { text: ' of the month ' },
        { text: monthDisplay, bold: true },
        { text: ' of year 20' },
        { text: yearDisplay, bold: true },
        { text: ' been seized by me, ' },
        { text: issuedByDisplay, bold: true },
        { text: ' under the provisions of clause (d) of sub-section (1) of section 21 of the ' },
        { text: 'Insecticides Act, 1968', bold: true },
        { text: ', from the premises of ' },
        { text: `M/s ${firmDisplay}`, bold: true },
        { text: ' situated at ' },
        { text: premisesDisplay, bold: true },
        { text: ' :' },
      ],
    },
    { kind: 'gap', mm: 2 },
    {
      kind: 'gridTable',
      header: [
        'Sl. No.',
        'Name of the insecticide with complete details, like purity, type of formulation, etc.',
        'Manufactured by',
        'Batch Number',
        'Date of manufacture and date of expiry',
        'Stock quantity as on date (indicate units also)',
        'Remarks (Mention page/folio number of the stock register)',
      ],
      colWeights: [6, 24, 13, 11, 15, 15, 16],
      rows: tableRows.length ? tableRows : [['1', '', '', '', '', '', '']],
    },
    { kind: 'gap', mm: 3 },
    {
      kind: 'para',
      firstLineIndent: 10,
      keepWithNext: true,
      segments: [
        { text: 'I have appended my signatures with date and seal on the page/folio number ' },
        { text: folioDisplay, bold: true },
        { text: ' of the stock register of insecticides and taken a copy thereof for record.' },
      ],
    },
    { kind: 'gap', mm: 10, keepWithNext: true },
    {
      kind: 'memoRow',
      leftLines: [
        [{ text: 'Place: ' }, { text: mandalValue, bold: true }],
        [{ text: 'Date: ' }, { text: dateValue, bold: true }],
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

export function PesticideSeizureOrderEntry() {
  const [form, setForm] = useState<PestSeizureFormState>(() => readFormDraft() ?? makeInitialForm());
  const [savedOrders, setSavedOrders] = useState<SavedPestSeizureOrder[]>(() => readSavedOrders());
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
    const base = designationOptionsFor('pesticide');
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

  const updateForm = (patch: Partial<PestSeizureFormState>) => setForm((current) => ({ ...current, ...patch }));

  const updateProduct = (id: string, patch: Partial<PestSeizureProductRow>) =>
    setForm((current) => ({
      ...current,
      products: current.products.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));

  const addProduct = () => setForm((current) => ({ ...current, products: [...current.products, emptyProduct()] }));
  const removeProduct = (id: string) =>
    setForm((current) => ({ ...current, products: current.products.filter((row) => row.id !== id) }));

  const saveOrder = () => {
    const entry: SavedPestSeizureOrder = {
      ...form,
      id: editingId || uid(),
      savedAt: new Date().toISOString(),
    };
    setSavedOrders((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    setEditingId(entry.id);
    showSaved('Order saved', entry.refNumber || 'Receipt for Seized Insecticides');
  };

  const editSavedOrder = (order: SavedPestSeizureOrder) => {
    setForm({ ...order, products: order.products?.length ? order.products : [emptyProduct()] });
    setEditingId(order.id);
    setShowPreview(false);
    showLoaded('Order loaded', order.refNumber || 'Receipt for Seized Insecticides');
  };

  const deleteSavedOrder = (order: SavedPestSeizureOrder) => {
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
      premisesAt: '',
      folioNo: '',
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

  const fileBase = () => `${form.refNumber || 'receipt-seized-insecticides'}`.replace(/[\\/]/g, '-');

  const downloadPdf = async () => {
    const doc = await renderNoticePdfDocument(noticeBlocks, form.refNumber || 'Receipt for Seized Insecticides', 'bookAntiqua');
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
      console.error('Unable to generate seizure receipt Word document:', error);
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
          <TextInput label="Insecticide Inspector" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
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
            label={isADAOfficer || isDAOOfficer ? 'Mandal (Place of seizure)' : 'Mandal'}
            value={form.mandal}
            onChange={(value) => updateForm({ mandal: value, manualMandal: value === 'Others' ? form.manualMandal : '' })}
            options={mandalOptions}
          />
          {form.mandal === 'Others' && (
            <TextInput label="Enter Mandal Name" value={form.manualMandal} onChange={(value) => updateForm({ manualMandal: value })} />
          )}
          <TextInput label="Order No." optional value={form.refNumber} onChange={(value) => updateForm({ refNumber: value })} />
          <TextInput label="Date" type="date" value={form.seizureDate} onChange={(value) => updateForm({ seizureDate: value })} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Dealer Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value })} />
          <TextInput label="Page / Folio No. of Stock Register" value={form.folioNo} onChange={(value) => updateForm({ folioNo: value })} />
          <label className="block md:col-span-3">
            <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Firm Address</span>
            <span className="mb-1 block text-[10px] font-semibold leading-tight text-slate-400 dark:text-slate-500">
              {effectiveLocationValue(form.mandal, form.manualMandal) || 'Mandal'} Mandal,<br />
              {effectiveLocationValue(form.district, form.manualDistrict) || 'District'} District. (auto-added)
            </span>
            <textarea
              value={form.premisesAt}
              onChange={(event) => updateForm({ premisesAt: event.target.value })}
              placeholder="D.No, Road, Village"
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Seized Stock Details</h3>
          <button
            type="button"
            onClick={addProduct}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-amber-700"
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
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Name of the Insecticide (purity, formulation etc.)</span>
                  <textarea
                    value={row.name}
                    onChange={(event) => updateProduct(row.id, { name: event.target.value })}
                    rows={1}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <TextInput label="Manufactured by" value={row.manufacturedBy} onChange={(value) => updateProduct(row.id, { manufacturedBy: value })} />
                <TextInput label="Batch Number" value={row.batchNo} onChange={(value) => updateProduct(row.id, { batchNo: value })} />
                <TextInput label="Date of Manufacture" type="date" value={row.mfgDate} onChange={(value) => updateProduct(row.id, { mfgDate: value })} />
                <TextInput label="Date of Expiry" type="date" value={row.expiryDate} onChange={(value) => updateProduct(row.id, { expiryDate: value })} />
                <TextInput label="Stock Quantity (with units)" value={row.quantity} onChange={(value) => updateProduct(row.id, { quantity: value })} />
                <TextInput label="Remarks" value={row.remarks} onChange={(value) => updateProduct(row.id, { remarks: value })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={previewOrder} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-amber-700 sm:text-sm">
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
            <h3 className="text-base font-black text-slate-900 dark:text-white">Form V(B) — Receipt for Seized Insecticides Preview</h3>
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
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSaved.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-black">{order.refNumber}</td>
                  <td className="px-3 py-2">{order.firmName || '-'}</td>
                  <td className="px-3 py-2">{formatNoticeDate(order.seizureDate) || '-'}</td>
                  <td className="px-3 py-2">{order.products.filter((row) => row.name.trim()).length || '-'}</td>
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
                  <td colSpan={5} className="px-3 py-8 text-center font-semibold text-slate-500 dark:text-slate-400">No saved orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

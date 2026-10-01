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

interface FertStopSaleProductRow {
  id: string;
  name: string;
  batchNo: string;
  manufacturer: string;
  quantityMt: string;
  remarks: string;
}

interface FertStopSaleFormState {
  orderNumber: string;
  noticeDate: string;
  officerName: string;
  officerDesignation: string;
  mandal: string;
  manualMandal: string;
  district: string;
  manualDistrict: string;
  division: string;
  firmName: string;
  dealerAddress: string;
  formA2Number: string;
  formA2ValidUpto: string;
  stopDays: string;
  products: FertStopSaleProductRow[];
}

interface SavedFertStopSaleOrder extends FertStopSaleFormState {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'agri-legal-fertilizer-stop-sale-orders';
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numToWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  return String(n);
}

// '15' -> '15 (fifteen)'; non-numeric input is used as typed
function formatStopDays(raw: string): string {
  const trimmed = raw.trim();
  return /^\d{1,2}$/.test(trimmed) ? `${trimmed} (${numToWords(Number(trimmed))})` : trimmed;
}

const emptyProduct = (): FertStopSaleProductRow => ({
  id: uid(),
  name: '',
  batchNo: '',
  manufacturer: '',
  quantityMt: '',
  remarks: '',
});

function readSavedOrders(): SavedFertStopSaleOrder[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedOrders(orders: SavedFertStopSaleOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function makeInitialForm(): FertStopSaleFormState {
  const fy = currentFinancialYear();
  const statutory = readStatutoryDetails('fertiliser');
  const resolvedDistrict = resolveDistrict(statutory.district || 'Kumuram Bheem Asifabad', statutory.manualDistrict || '');
  const resolvedMandal = resolveMandal(resolvedDistrict.district, statutory.mandal || 'Tiryani', statutory.manualMandal || '');
  return {
    orderNumber: `SSN/F/${fy}`,
    noticeDate: today(),
    officerName: statutory.officerName || '',
    officerDesignation: statutory.officerDesignation || 'Mandal Agriculture Officer & Fertilizer Inspector',
    mandal: resolvedMandal.mandal,
    manualMandal: resolvedMandal.manualMandal,
    district: resolvedDistrict.district,
    manualDistrict: resolvedDistrict.manualDistrict,
    division: statutory.division || '',
    firmName: statutory.dealerName || '',
    dealerAddress: statutory.dealerAddress || '',
    formA2Number: '',
    formA2ValidUpto: '',
    stopDays: '15',
    products: [emptyProduct()],
  };
}

// ANNEXURE-A — Stop Sale Notice under clause 28(2) of the Fertilizer
// (Control) Order, 1985; operative order is issued under clause 28.
function buildStopSaleModel(form: FertStopSaleFormState): NoticeBlock[] {
  const officerDesignation = form.officerDesignation || 'Fertilizer Inspector';
  const mandalValue = effectiveLocationValue(form.mandal, form.manualMandal) || '________________';
  const districtValue = effectiveLocationValue(form.district, form.manualDistrict) || '________________';
  const districtDisplay = districtValue.toLowerCase() === 'kumrambheem asifabad' ? 'Kumuram Bheem Asifabad' : districtValue;

  const firmDisplay = form.firmName.trim() || '____________________________';
  const a2Number = form.formA2Number.trim() || '______________';
  const a2ValidUpto = form.formA2ValidUpto ? formatNoticeDate(form.formA2ValidUpto) : '______________';
  const placeValue = mandalValue;
  const dateValue = form.noticeDate ? formatNoticeDate(form.noticeDate) : '__________';

  const filledProducts = form.products.filter((item) =>
    [item.name, item.batchNo, item.manufacturer, item.quantityMt, item.remarks].some((field) => field.trim())
  );
  const productRows = filledProducts.length > 0 ? filledProducts : form.products;
  const tableRows = productRows.map((item, index) => [
    String(index + 1),
    item.name,
    item.batchNo,
    item.manufacturer,
    item.quantityMt,
    item.remarks,
  ]);

  const designationParts = officerDesignation.split('&').map((part) => part.trim()).filter(Boolean);
  const signatureLines: string[] = designationParts.length > 1
    ? [`${designationParts[0]} &`, designationParts.slice(1).join(' & ').replace(/,+$/, '')]
    : [officerDesignation, ''];

  return [
    { kind: 'center', text: 'ANNEXURE-A', bold: true, size: 14 },
    { kind: 'center', text: '(STOP SALE NOTICE)', bold: true, underline: true },
    { kind: 'center', text: '(Order under clause 28(2) of the Fertilizer (Control) Order, 1985', bold: true },
    { kind: 'center', text: 'requiring a person not to dispose of any stock in his possession)', bold: true },
    { kind: 'gap', mm: 4 },
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'Whereas I have reason(s) to believe that a contravention of the ' },
        { text: 'FCO 1985', bold: true },
        { text: ' has been or is being or is about to be committed by ' },
        { text: `M/s. ${firmDisplay}`, bold: true },
        ...(form.dealerAddress.trim()
          ? [{ text: `, ${form.dealerAddress.trim().replace(/\n+/g, ', ')}`, bold: true }]
          : []),
        { text: `, ${mandalValue} Mandal, ${districtDisplay} District`, bold: true },
        { text: ' with Form A2 No. ' },
        { text: a2Number, bold: true },
        { text: ' valid upto ' },
        { text: a2ValidUpto, bold: true },
        { text: '.' },
      ],
    },
    {
      kind: 'para',
      segments: [{ text: 'In respect of the stock of the fertilizer in your possession as detailed below:' }],
    },
    { kind: 'gap', mm: 1 },
    {
      kind: 'gridTable',
      header: ['S.No.', 'Name of Fertilizer', 'Batch No. (if applicable)', 'Name of the Manufacturer / Importer', 'Quantity (MT)', 'Remarks'],
      colWeights: [7, 27, 14, 23, 12, 17],
      rows: tableRows,
    },
    { kind: 'gap', mm: 2 },
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'I hereby require you under ' },
        { text: 'clause 28 of the said Order', bold: true },
        { text: ' to stop the sale, distribution or use of the said stock for a period of ' },
        { text: `${formatStopDays(form.stopDays) || '_____'} days`, bold: true },
        { text: ' from this date ' },
        { text: dateValue, bold: true },
        { text: '.' },
      ],
    },
    { kind: 'gap', mm: 13, keepWithNext: true },
    {
      kind: 'memoRow',
      left: [{ text: 'Place: ' }, { text: `${placeValue},`, bold: true }],
      right: [{ text: signatureLines[0], bold: true }],
      keepWithNext: true,
    },
    {
      kind: 'memoRow',
      left: [{ text: 'Date: ' }, { text: `${dateValue}.`, bold: true }],
      right: [{ text: signatureLines[1], bold: true }],
    },
  ];
}

export function FertilizerStopSaleEntry() {
  const [form, setForm] = useState<FertStopSaleFormState>(() => makeInitialForm());
  const [savedOrders, setSavedOrders] = useState<SavedFertStopSaleOrder[]>(() => readSavedOrders());
  const [savedSearch, setSavedSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [resetSpinKey, setResetSpinKey] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo, showWarning } = useToast();

  const noticeBlocks = useMemo(() => buildStopSaleModel(form), [form]);
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
    const base = designationOptionsFor('fertiliser');
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

  const updateForm = (patch: Partial<FertStopSaleFormState>) => setForm((current) => ({ ...current, ...patch }));

  const updateProduct = (id: string, patch: Partial<FertStopSaleProductRow>) =>
    setForm((current) => ({
      ...current,
      products: current.products.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));

  const addProduct = () => setForm((current) => ({ ...current, products: [...current.products, emptyProduct()] }));
  const removeProduct = (id: string) =>
    setForm((current) => ({ ...current, products: current.products.filter((row) => row.id !== id) }));

  const saveOrder = () => {
    const entry: SavedFertStopSaleOrder = {
      ...form,
      id: editingId || uid(),
      savedAt: new Date().toISOString(),
    };
    setSavedOrders((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    setEditingId(entry.id);
    showSaved('Order saved', entry.orderNumber || 'Stop Sale Notice');
  };

  const editSavedOrder = (order: SavedFertStopSaleOrder) => {
    setForm({ ...order, products: order.products.length ? order.products : [emptyProduct()] });
    setEditingId(order.id);
    setShowPreview(false);
    showLoaded('Order loaded', order.orderNumber || 'Stop Sale Notice');
  };

  const deleteSavedOrder = (order: SavedFertStopSaleOrder) => {
    setSavedOrders((current) => current.filter((item) => item.id !== order.id));
    if (editingId === order.id) setEditingId(null);
    showDeleted('Order deleted', order.orderNumber || 'Untitled order');
  };

  const performReset = () => {
    setResetSpinKey((current) => current + 1);
    setForm(makeInitialForm());
    setEditingId(null);
    setShowPreview(false);
    showReset('Form reset');
  };

  const filteredSaved = useMemo(() => {
    const term = savedSearch.trim().toLowerCase();
    if (!term) return savedOrders;
    return savedOrders.filter((order) =>
      [order.orderNumber, order.firmName, order.noticeDate].join(' ').toLowerCase().includes(term)
    );
  }, [savedOrders, savedSearch]);

  const fileBase = () => `${form.orderNumber || 'stop-sale-notice'}`.replace(/[\\/]/g, '-');

  const downloadPdf = async () => {
    const doc = await renderNoticePdfDocument(noticeBlocks, form.orderNumber || 'Stop Sale Notice', 'robotoSerif');
    doc.save(`${fileBase()}.pdf`);
    showSuccess('PDF downloaded', `${fileBase()}.pdf`);
  };

  const downloadWord = async () => {
    try {
      const blob = await buildNoticeWordDocument(noticeBlocks, 'robotoSerif');
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
      console.error('Unable to generate stop sale Word document:', error);
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
          <TextInput label="Inspecting Officer" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
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
            label={isADAOfficer || isDAOOfficer ? 'Mandal (Place of inspection)' : 'Mandal'}
            value={form.mandal}
            onChange={(value) => updateForm({ mandal: value, manualMandal: value === 'Others' ? form.manualMandal : '' })}
            options={mandalOptions}
          />
          {form.mandal === 'Others' && (
            <TextInput label="Enter Mandal Name" value={form.manualMandal} onChange={(value) => updateForm({ manualMandal: value })} />
          )}
          <TextInput label="Date" type="date" value={form.noticeDate} onChange={(value) => updateForm({ noticeDate: value })} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Dealer Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value })} />
          <TextInput label="Form A2 / Licence No." value={form.formA2Number} onChange={(value) => updateForm({ formA2Number: value })} />
          <TextInput label="Validity" type="date" value={form.formA2ValidUpto} onChange={(value) => updateForm({ formA2ValidUpto: value })} />
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
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Order Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Stop Sale Period (days)" value={form.stopDays} onChange={(value) => updateForm({ stopDays: value })} />
        </div>
        <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Notice issued under Clause 28(2) of the Fertilizer (Control) Order, 1985.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Stock Details</h3>
          <button
            type="button"
            onClick={addProduct}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-sky-700"
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
                  <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Name of Fertilizer</span>
                  <textarea
                    value={row.name}
                    onChange={(event) => updateProduct(row.id, { name: event.target.value })}
                    rows={1}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <TextInput label="Batch No." value={row.batchNo} onChange={(value) => updateProduct(row.id, { batchNo: value })} />
                <TextInput label="Manufacturer / Importer" value={row.manufacturer} onChange={(value) => updateProduct(row.id, { manufacturer: value })} />
                <TextInput label="Quantity (MT)" value={row.quantityMt} onChange={(value) => updateProduct(row.id, { quantityMt: value })} />
                <TextInput label="Remarks" value={row.remarks} onChange={(value) => updateProduct(row.id, { remarks: value })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={previewOrder} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-sky-700 sm:text-sm">
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
            <h3 className="text-base font-black text-slate-900 dark:text-white">Stop Sale Notice Preview</h3>
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
            style={{ fontFamily: `'Roboto Serif', 'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', serif`, fontSize: '12pt', lineHeight: 1.5 }}
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
                  <td className="px-3 py-2 font-black">{order.orderNumber}</td>
                  <td className="px-3 py-2">{order.firmName || '-'}</td>
                  <td className="px-3 py-2">{formatNoticeDate(order.noticeDate) || '-'}</td>
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

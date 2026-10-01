import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Edit3, FileText, FileType, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { currentFinancialYear } from '../../../shared/utils/financialYear';
import { statutoryDesignationDisplay, withOthersOption, effectiveLocationValue } from '../../../shared/data/assistantDirectorLocation';
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
  type NoticeSegment,
} from './ShowCauseNoticeEntry';

interface StopSaleProductRow {
  id: string;
  name: string;
  manufacturer: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  quantity: string;
  remarks: string;
}

interface StopSaleFormState {
  orderNumber: string;
  orderDate: string;
  officerName: string;
  officerDesignation: string;
  mandal: string;
  manualMandal: string;
  district: string;
  manualDistrict: string;
  division: string;
  firmName: string;
  dealerName: string;
  dealerAddress: string;
  licenceNumber: string;
  actSection: string;
  rulesRef: string;
  stopDays: string;
  products: StopSaleProductRow[];
}

interface SavedStopSaleOrder extends StopSaleFormState {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'agri-legal-pesticide-stop-sale-orders';
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

const emptyProduct = (): StopSaleProductRow => ({
  id: uid(),
  name: '',
  manufacturer: '',
  batchNo: '',
  mfgDate: '',
  expiryDate: '',
  quantity: '',
  remarks: '',
});

function readSavedOrders(): SavedStopSaleOrder[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedOrders(orders: SavedStopSaleOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function makeInitialForm(): StopSaleFormState {
  const fy = currentFinancialYear();
  const statutory = readStatutoryDetails('pesticide');
  const resolvedDistrict = resolveDistrict(statutory.district || 'Kumuram Bheem Asifabad', statutory.manualDistrict || '');
  const resolvedMandal = resolveMandal(resolvedDistrict.district, statutory.mandal || 'Tiryani', statutory.manualMandal || '');
  return {
    orderNumber: `SSO/P/${fy}`,
    orderDate: today(),
    officerName: statutory.officerName || '',
    officerDesignation: statutory.officerDesignation || 'Mandal Agriculture Officer & Insecticide Inspector',
    mandal: resolvedMandal.mandal,
    manualMandal: resolvedMandal.manualMandal,
    district: resolvedDistrict.district,
    manualDistrict: resolvedDistrict.manualDistrict,
    division: statutory.division || '',
    firmName: statutory.dealerName || '',
    dealerName: '',
    dealerAddress: statutory.dealerAddress || '',
    licenceNumber: '',
    actSection: '',
    rulesRef: '',
    stopDays: '15',
    products: [emptyProduct()],
  };
}

// Form V(A) — "Order not to dispose of any stock" under Rule 30 read with
// Section 21(1)(d) of the Insecticides Act, 1968 / Insecticides Rules, 1971.
function buildStopSaleModel(form: StopSaleFormState): NoticeBlock[] {
  const officerDesignation = form.officerDesignation || 'Insecticide Inspector';
  const displayDesignation = statutoryDesignationDisplay(
    officerDesignation.replace(/\s*&\s*.*$/, '').trim() || officerDesignation
  );
  const mandalValue = effectiveLocationValue(form.mandal, form.manualMandal) || '________________';
  const districtValue = effectiveLocationValue(form.district, form.manualDistrict) || '________________';
  const districtDisplay = districtValue.toLowerCase() === 'kumrambheem asifabad' ? 'Kumuram Bheem Asifabad' : districtValue;

  const orderDateObj = form.orderDate ? new Date(`${form.orderDate}T00:00:00`) : null;
  const dayPart = orderDateObj ? String(orderDateObj.getDate()).padStart(2, '0') : '_____';
  const monthPart = orderDateObj ? orderDateObj.toLocaleString('en', { month: 'long' }) : '__________';
  const yearPart = orderDateObj ? String(orderDateObj.getFullYear()) : '______';

  const firmDisplay = `M/s. ${form.firmName || '____________________________'}`;
  const addressLines = form.dealerAddress.split('\n').map((line) => line.trim()).filter(Boolean);
  const dealerItems: NoticeSegment[][] = [
    [{ text: firmDisplay, bold: true }],
    ...(form.dealerName.trim() ? [[{ text: `(Prop./Dealer: ${form.dealerName.trim()})`, bold: true }]] : []),
    ...addressLines.map((line) => [{ text: line.replace(/,+$/, ''), bold: true }] as NoticeSegment[]),
    [{ text: `${mandalValue} Mandal, ${districtDisplay} District.`, bold: true }],
    ...(form.licenceNumber.trim()
      ? [[{ text: 'Licence No.: ', bold: true }, { text: form.licenceNumber.trim(), bold: true }] as NoticeSegment[]]
      : []),
  ];

  const actSection = form.actSection.trim() || '_____';
  const rulesRef = form.rulesRef.trim() || '__________';

  const filledProducts = form.products.filter((item) =>
    [item.name, item.manufacturer, item.batchNo, item.mfgDate, item.expiryDate, item.quantity, item.remarks].some((field) => field.trim())
  );
  const productRows = filledProducts.length > 0 ? filledProducts : form.products;
  const tableRows = productRows.map((item, index) => [
    String(index + 1),
    item.name,
    item.manufacturer,
    item.batchNo,
    [item.mfgDate && `Mfg: ${formatNoticeDate(item.mfgDate)}`, item.expiryDate && `Exp: ${formatNoticeDate(item.expiryDate)}`].filter(Boolean).join(' / '),
    item.quantity,
    item.remarks,
  ]);

  const designationParts = officerDesignation.split('&').map((part) => part.trim()).filter(Boolean);
  const signatureItems: NoticeSegment[][] = [
    ...(designationParts.length > 1
      ? [[{ text: `${designationParts[0]} &`, bold: true }], [{ text: designationParts.slice(1).join(' & ').replace(/,+$/, ''), bold: true }]]
      : [[{ text: displayDesignation, bold: true }]]),
  ];

  return [
    { kind: 'center', text: 'FORM V(A)', bold: true },
    { kind: 'center', text: 'FORM OF ORDER "NOT TO DISPOSE OF ANY STOCK"', bold: true, underline: true },
    { kind: 'center', text: '[See Rule 30]', bold: true },
    { kind: 'gap', mm: 3 },
    { kind: 'lines', items: [[{ text: 'To,', bold: true }]] },
    { kind: 'lines', items: dealerItems, indent: 8 },
    { kind: 'gap', mm: 3 },
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'Whereas, I have reason(s) to believe that the stock of the following insecticide(s), which is in your possession, is being stored for distribution, sale or exhibited for sale and used in contravention of the provisions of ' },
        { text: `Section ${actSection} of the Insecticides Act, 1968`, bold: true },
        { text: ' and/or ' },
        { text: `${rulesRef} of the Insecticides Rules, 1971`, bold: true },
        { text: ':' },
      ],
    },
    {
      kind: 'gridTable',
      header: ['Sr. No.', 'Name of the Insecticide with complete details', 'Manufactured by', 'Batch No.', 'Date of Manufacture and Date of Expiry', 'Stock Quantity as on Date (indicate units also)', 'Remarks'],
      colWeights: [6, 26, 15, 10, 15, 14, 14],
      rows: tableRows,
    },
    { kind: 'gap', mm: 2 },
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'I hereby require you under ' },
        { text: 'clause (d) of sub-section (1) of Section 21 of the Insecticides Act, 1968', bold: true },
        { text: ' to stop the distribution, sales or exhibit for sale and use of the said stock for a period of ' },
        { text: `${formatStopDays(form.stopDays) || '_____'} days`, bold: true },
        { text: ` from this ` },
        { text: dayPart, bold: true },
        { text: ' day of ' },
        { text: monthPart, bold: true },
        { text: ' month of the year ' },
        { text: yearPart, bold: true },
        { text: '.' },
      ],
    },
    { kind: 'gap', mm: 8, keepWithNext: true },
    { kind: 'lines', items: signatureItems, align: 'right', centerLines: true, offsetX: 5, keepWithNext: true },
  ];
}

export function PesticideStopSaleEntry() {
  const [form, setForm] = useState<StopSaleFormState>(() => makeInitialForm());
  const [savedOrders, setSavedOrders] = useState<SavedStopSaleOrder[]>(() => readSavedOrders());
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

  const updateForm = (patch: Partial<StopSaleFormState>) => setForm((current) => ({ ...current, ...patch }));

  const updateProduct = (id: string, patch: Partial<StopSaleProductRow>) =>
    setForm((current) => ({
      ...current,
      products: current.products.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));

  const addProduct = () => setForm((current) => ({ ...current, products: [...current.products, emptyProduct()] }));
  const removeProduct = (id: string) =>
    setForm((current) => ({ ...current, products: current.products.filter((row) => row.id !== id) }));

  const saveOrder = () => {
    const entry: SavedStopSaleOrder = {
      ...form,
      id: editingId || uid(),
      savedAt: new Date().toISOString(),
    };
    setSavedOrders((current) => {
      const rest = current.filter((item) => item.id !== entry.id);
      return [entry, ...rest];
    });
    setEditingId(entry.id);
    showSaved('Order saved', entry.orderNumber || 'Stop Sale Order');
  };

  const editSavedOrder = (order: SavedStopSaleOrder) => {
    setForm({ ...order, products: order.products.length ? order.products : [emptyProduct()] });
    setEditingId(order.id);
    setShowPreview(false);
    showLoaded('Order loaded', order.orderNumber || 'Stop Sale Order');
  };

  const deleteSavedOrder = (order: SavedStopSaleOrder) => {
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
      [order.orderNumber, order.dealerName, order.firmName, order.orderDate].join(' ').toLowerCase().includes(term)
    );
  }, [savedOrders, savedSearch]);

  const fileBase = () => `${form.orderNumber || 'stop-sale-order'}`.replace(/[\\/]/g, '-');

  const downloadPdf = async () => {
    const doc = await renderNoticePdfDocument(noticeBlocks, form.orderNumber || 'Stop Sale Order', 'robotoSerif');
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
          <TextInput label="Date" type="date" value={form.orderDate} onChange={(value) => updateForm({ orderDate: value })} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Dealer Details (To)</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value })} />
          <label className="block md:col-span-2">
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
          <TextInput label="Licence Number" value={form.licenceNumber} onChange={(value) => updateForm({ licenceNumber: value })} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Contravention &amp; Order Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput
            label="Section — Insecticides Act, 1968"
            value={form.actSection}
            onChange={(value) => updateForm({ actSection: value })}
          />
          <TextInput
            label="Rule — Insecticides Rules, 1971"
            value={form.rulesRef}
            onChange={(value) => updateForm({ rulesRef: value })}
          />
          <TextInput label="Stop Sale Period (days)" value={form.stopDays} onChange={(value) => updateForm({ stopDays: value })} />
        </div>
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
                  <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Insecticide Name &amp; Details</span>
                  <textarea
                    value={row.name}
                    onChange={(event) => updateProduct(row.id, { name: event.target.value })}
                    rows={1}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <TextInput label="Manufactured By" value={row.manufacturer} onChange={(value) => updateProduct(row.id, { manufacturer: value })} />
                <TextInput label="Batch No." value={row.batchNo} onChange={(value) => updateProduct(row.id, { batchNo: value })} />
                <TextInput label="Mfg. Date" type="date" value={row.mfgDate} onChange={(value) => updateProduct(row.id, { mfgDate: value })} />
                <TextInput label="Expiry Date" type="date" value={row.expiryDate} onChange={(value) => updateProduct(row.id, { expiryDate: value })} />
                <TextInput label="Stock Qty (with units)" value={row.quantity} onChange={(value) => updateProduct(row.id, { quantity: value })} />
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
            <h3 className="text-base font-black text-slate-900 dark:text-white">Stop Sale Order Preview</h3>
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
                <th className="px-3 py-2">Order No.</th>
                <th className="px-3 py-2">Dealer</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSaved.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-black">{order.orderNumber}</td>
                  <td className="px-3 py-2">{order.firmName || order.dealerName || '-'}</td>
                  <td className="px-3 py-2">{formatNoticeDate(order.orderDate) || '-'}</td>
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

import { localTodayDate } from '../../../shared/utils/dateUtils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Eye, FolderOpen, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { ActionButton } from '../../../shared/components/ui/DesignSystem';
import { ExportActionsMenu } from '../../../shared/components/ui/ExportActionsMenu';
import { currentFinancialYear } from '../../../shared/utils/financialYear';
import { withOthersOption, effectiveLocationValue } from '../../../shared/data/assistantDirectorLocation';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../../../shared/data/telanganaDistrictMandalData';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../../shared/components/ui/useConfirmDialog';
import {
  buildNoticeWordDocument,
  designationOptionsFor,
  formatNoticeDate,
  isAdaDesignation,
  isDaoDesignation,
  isMaoDesignation,
  NOTICE_FONT_STACK,
  noticeBlocksHtml,
  readStatutoryDetails,
  renderNoticePdfDocument,
  resolveDistrict,
  resolveMandal,
  SelectInput,
  stockValueDisplay,
  stockValueTotal,
  TextInput,
  type NoticeBlock,
  type NoticeSegment,
} from './ShowCauseNoticeEntry';

import { safeStorage } from '../../../shared/lib/safeStorage';
import { sha256Hex } from '../../../shared/lib/fileHash';
import { OfficerCloudSyncService } from '../services/officerCloudSyncService';
import { useDealers, dealerAddressLine } from '../../../shared/hooks/useDealers';
import { DealerPartySelect } from '../../../shared/components/DealerPartySelect';

// Keeps legacy/free-typed values selectable in the statutory dropdowns.
const withCurrentOption = (options: { label: string; value: string }[], value: string) =>
  value && value !== 'Other' && !options.some((o) => o.value === value)
    ? [{ label: value, value }, ...options]
    : options;

// Macro + micro + water-soluble fertilizer names & grades (deduped, 'Other' last).
const allFertilizerTypeGradeOptions = [
  ...fertilizerTypeGradeOptions,
  ...microNutrientTypeGradeOptions,
  ...waterSolubleTypeGradeOptions,
]
  .filter((o, i, arr) => arr.findIndex((x) => x.value === o.value) === i)
  .sort((a, b) => (a.value === 'Other' ? 1 : b.value === 'Other' ? -1 : 0));
import { DivisionPicker } from '../../../shared/components/ui/DivisionPicker';
import type { Dealer } from '../../../shared/types/database';
import { fertilizerTypeGradeOptions, microNutrientTypeGradeOptions, waterSolubleTypeGradeOptions, dealerManufacturerImporterOptions } from '../../sampling-hub/components/FertilizerStatutoryPdfTool';
import { OfficerDocumentArchiveService } from '../services/officerDocumentArchiveService';
import { InspectionTheme, Modal } from '../inspection/ui';
interface FertStopSaleProductRow {
  id: string;
  name: string;
  nameOther: string;
  batchNo: string;
  manufacturer: string;
  manufacturerOther: string;
  quantityMt: string;
  value: string;
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
  stopDays: string;
  observations: string;
  products: FertStopSaleProductRow[];
}

export interface SavedFertStopSaleOrder extends FertStopSaleFormState {
  id: string;
  savedAt: string;
  issuedAt?: string;
  /** SHA-256 of the issued PDF, bound on download/print for later verification. */
  issuedPdfSha256?: string;
}

const STORAGE_KEY = 'agri-legal-fertilizer-stop-sale-orders';
const MAX_STOP_DAYS = 21;
const today = () => localTodayDate();
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
  nameOther: '',
  batchNo: '',
  manufacturer: '',
  manufacturerOther: '',
  quantityMt: '',
  value: '',
  remarks: '',
});

function readSavedOrders(): SavedFertStopSaleOrder[] {
  try {
    const parsed = JSON.parse(safeStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedOrders(orders: SavedFertStopSaleOrder[]) {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

const FORM_DRAFT_KEY = `${STORAGE_KEY}-draft`;

function readFormDraft(): FertStopSaleFormState | null {
  try {
    const raw = safeStorage.getItem(FORM_DRAFT_KEY);
    if (!raw) return null;
    return { ...makeInitialForm(), ...(JSON.parse(raw) as Partial<FertStopSaleFormState>) };
  } catch {
    return null;
  }
}

function makeInitialForm(): FertStopSaleFormState {
  const fy = currentFinancialYear();
  const statutory = readStatutoryDetails('fertiliser');
  const resolvedDistrict = resolveDistrict(statutory.district || 'Kumurambheem Asifabad', statutory.manualDistrict || '');
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
    stopDays: '15',
    observations: '',
    products: [emptyProduct()],
  };
}

// ANNEXURE-A — Stop Sale Notice under clause 28(2) of the Fertilizer
// (Control) Order, 1985; operative order is issued under clause 28.
function buildStopSaleModel(form: FertStopSaleFormState): NoticeBlock[] {
  const officerDesignation = form.officerDesignation || 'Fertilizer Inspector';
  const mandalValue = effectiveLocationValue(form.mandal, form.manualMandal) || '________________';
  const districtValue = effectiveLocationValue(form.district, form.manualDistrict) || '________________';
  const districtDisplay = ['kumurambheem asifabad', 'kumrambheem asifabad'].includes(districtValue.toLowerCase()) ? 'Kumurambheem Asifabad' : districtValue;

  const firmDisplay = form.firmName.trim() || '____________________________';
  const a2Number = form.formA2Number.trim() || '______________';
  const placeValue = mandalValue;
  const dateValue = form.noticeDate ? formatNoticeDate(form.noticeDate) : '__________';

  const addressLines = form.dealerAddress.split('\n').map((line) => line.trim()).filter(Boolean);
  const dealerItems: NoticeSegment[][] = [
    [{ text: `M/s. ${firmDisplay},`, bold: true }],
    ...addressLines.map((line) => [{ text: `${line.replace(/,+$/, '')},`, bold: true }] as NoticeSegment[]),
    [{ text: `${mandalValue} Mandal,`, bold: true }],
    [{ text: `${districtDisplay} District.`, bold: true }],
  ];

  const observationLines = form.observations.split('\n').map((line) => line.trim()).filter(Boolean);
  const observationBlocks: NoticeBlock[] = observationLines.map((line, index) => ({
    kind: 'labelPara',
    label: `${index + 1}.`,
    labelBold: false,
    indent: 8,
    segments: [{ text: line }],
  }));

  const fertDisplayName = (item: FertStopSaleProductRow) =>
    item.name === 'Other' ? (item.nameOther ?? '').trim() || 'Other' : item.name;
  const fertDisplayManufacturer = (item: FertStopSaleProductRow) =>
    item.manufacturer === 'Other' ? (item.manufacturerOther ?? '').trim() || 'Other' : item.manufacturer;
  const filledProducts = form.products.filter((item) =>
    [item.name, item.nameOther ?? '', item.batchNo, item.manufacturer, item.manufacturerOther ?? '', item.quantityMt, item.value ?? '', item.remarks].some((field) => field.trim())
  );
  const productRows = filledProducts.length > 0 ? filledProducts : form.products;
  const tableRows = productRows.map((item, index) => [
    String(index + 1),
    fertDisplayName(item),
    item.batchNo,
    fertDisplayManufacturer(item),
    item.quantityMt,
    stockValueDisplay(item.value),
  ]);

  const remarkLines = productRows
    .flatMap((item) => String(item.remarks ?? '').split('\n'))
    .map((line) => line.trim())
    .filter(Boolean);
  const remarkBlocks: NoticeBlock[] = remarkLines.length > 0
    ? [
        { kind: 'lines', items: [[{ text: 'Remarks:', bold: true }]] },
        ...remarkLines.map((line, index): NoticeBlock => ({
          kind: 'labelPara',
          label: `${index + 1}.`,
          labelBold: false,
          indent: 8,
          segments: [{ text: line }],
        })),
      ]
    : [];

  const designationParts = officerDesignation.split('&').map((part) => part.trim()).filter(Boolean);
  const signatureItems: NoticeSegment[][] = designationParts.length > 1
    ? [[{ text: `${designationParts[0]} &`, bold: true }], [{ text: designationParts.slice(1).join(' & ').replace(/,+$/, ''), bold: true }]]
    : [[{ text: officerDesignation, bold: true }]];

  const divisionName = form.division.trim() || '________________';
  const copyLines = (isDaoDesignation(officerDesignation)
    ? `1. The Commissioner & Director of Agriculture, Telangana State, for favour of information and necessary action.\n2. The Asst. Director of Agriculture (R) concerned, for information and to serve the order on the dealer under proper dated acknowledgement.\n3. Stock File / Spare.`
    : isAdaDesignation(officerDesignation)
      ? `1. The District Agriculture Officer, ${districtDisplay}, for favour of information and necessary action.\n2. The Mandal Agriculture Officer concerned, for information and to serve the order on the dealer under proper dated acknowledgement.\n3. Stock File / Spare.`
      : `1. The Asst. Director of Agriculture (R), ${divisionName}, for information and necessary action.\n2. The District Agriculture Officer, ${districtDisplay}, for information and necessary action.\n3. Copy to Stock File.`
  ).split('\n');

  return [
    { kind: 'center', text: 'ANNEXURE-A', bold: true, size: 14 },
    { kind: 'center', text: '(STOP SALE NOTICE)', bold: true, underline: true },
    { kind: 'center', text: '(Order under clause 28(2) of the Fertilizer (Control) Order, 1985', bold: true, spaceAfter: 3.8 },
    { kind: 'center', text: 'requiring a person not to dispose of any stock in his possession)', bold: true },
    { kind: 'gap', mm: 2 },
    {
      kind: 'memoRow',
      left: [{ text: 'No: ' }, { text: form.orderNumber || '______________', bold: true }],
      right: [{ text: 'Dt.: ' }, { text: dateValue, bold: true }],
    },
    { kind: 'gap', mm: 3 },
    { kind: 'lines', items: [[{ text: 'To,', bold: true }]] },
    { kind: 'lines', items: dealerItems, indent: 8 },
    { kind: 'gap', mm: 2 },
    { kind: 'lines', items: [[{ text: 'Form A2 No: ', bold: true }, { text: a2Number }]] },
    { kind: 'gap', mm: 3 },
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'Whereas I have reason(s) to believe that a contravention of the ' },
        { text: 'FCO 1985', bold: true },
        { text: ' has been or is being or is about to be committed by ' },
        { text: 'you' },
        { text: ' in respect of the stock of the fertilizer in your possession as detailed below:' },
      ],
    },
    { kind: 'gap', mm: 2 },
    {
      kind: 'gridTable',
      header: ['S.No.', 'Name of Fertilizer', 'Batch No. (if applicable)', 'Name of the Manufacturer / Importer', 'Quantity (MT)', 'Value (Rs.)'],
      colWeights: [7, 29, 13, 22, 11, 18],
      rows: tableRows,
    },
    { kind: 'gap', mm: 1 },
    {
      kind: 'lines',
      items: [[{ text: 'Total Value: ', bold: true }, { text: stockValueTotal(productRows) || '______________', bold: true }]],
    },
    { kind: 'gap', mm: 2 },
    ...remarkBlocks,
    { kind: 'gap', mm: 2 },
    ...(observationBlocks.length > 0
      ? [
          { kind: 'lines', items: [[{ text: 'Observations:', bold: true }]] } as NoticeBlock,
          ...observationBlocks,
          { kind: 'gap', mm: 2 } as NoticeBlock,
        ]
      : []),
    {
      kind: 'para',
      firstLineIndent: 10,
      segments: [
        { text: 'In exercise of the powers conferred to me under ' },
        { text: 'clause 28(2)', bold: true },
        { text: ', I hereby require you to stop the sale, distribution or use of the said stock for a period of ' },
        { text: `${formatStopDays(form.stopDays) || '_____'} days`, bold: true },
        { text: ' from this date ' },
        { text: dateValue, bold: true },
        { text: ' until further order.' },
      ],
    },
    { kind: 'gap', mm: 13, keepWithNext: true },
    {
      kind: 'memoRow',
      leftLines: [
        [{ text: 'Place: ' }, { text: `${placeValue},`, bold: true }],
        [{ text: 'Date: ' }, { text: `${dateValue}.`, bold: true }],
      ],
      rightLines: signatureItems,
      keepWithNext: true,
    },
    { kind: 'gap', mm: 13.06 },
    { kind: 'lines', items: [[{ text: 'Copy to:', bold: true }]], keepWithNext: true },
    ...copyLines.map((line): NoticeBlock => {
      const keepWithNext = false;
      const match = line.match(/^(\d+\.)\s*(.*)$/);
      return match
        ? { kind: 'labelPara', label: match[1], labelBold: false, segments: [{ text: match[2] }], keepWithNext, spaceAfter: 0 }
        : { kind: 'lines', items: [[{ text: line }]], keepWithNext };
    }),
  ];
}

export function FertilizerStopSaleEntry({ onRevoke }: { onRevoke?: (order: SavedFertStopSaleOrder) => void } = {}) {
  const [form, setForm] = useState<FertStopSaleFormState>(() => readFormDraft() ?? makeInitialForm());
  const [savedOrders, setSavedOrders] = useState<SavedFertStopSaleOrder[]>(() => readSavedOrders());
  const { askConfirm, confirmDialog } = useConfirmDialog();
  const [savedSearch, setSavedSearch] = useState('');
  const [showSavedList, setShowSavedList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [resetSpinKey, setResetSpinKey] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<SavedFertStopSaleOrder | null>(null);
  const overLimitWarned = useRef(false);
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo, showWarning } = useToast();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateStopDays = (value: string) => {
    updateForm({ stopDays: value });
    const days = Number(value.trim());
    const over = value.trim() !== '' && Number.isFinite(days) && days > MAX_STOP_DAYS;
    if (over && !overLimitWarned.current) {
      overLimitWarned.current = true;
      showWarning(`Maximum stop sale period is ${MAX_STOP_DAYS} days`, 'Check the period before issuing the order.');
    } else if (!over) {
      overLimitWarned.current = false;
    }
  };

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

  useEffect(() => {
    try {
      safeStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const updateForm = (patch: Partial<FertStopSaleFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };
  const { dealers: directoryDealers } = useDealers('fertilizer');
  const applyDealerPick = (dealer: Dealer | null) => {
    if (!dealer) return;
    updateForm({
      firmName: dealer.dealer_name,
      dealerAddress: dealerAddressLine(dealer),
      formA2Number: dealer.license_number || form.formA2Number,
    });
  };

  const updateProduct = (id: string, patch: Partial<FertStopSaleProductRow>) =>
    setForm((current) => ({
      ...current,
      products: current.products.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));

  const addProduct = () => setForm((current) => ({ ...current, products: [...current.products, emptyProduct()] }));
  const removeProduct = (id: string) =>
    setForm((current) => ({ ...current, products: current.products.filter((row) => row.id !== id) }));

  const persistOrder = (notify = false, issue = false): SavedFertStopSaleOrder => {
    const entryId = editingId || uid();
    const entry: SavedFertStopSaleOrder = {
      ...form,
      id: entryId,
      savedAt: new Date().toISOString(),
      issuedAt: issue ? new Date().toISOString() : savedOrders.find((item) => item.id === entryId)?.issuedAt,
    };
    setSavedOrders((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    setEditingId(entry.id);
    if (issue) void OfficerCloudSyncService.syncStatutoryOrder('stop_sale', 'fertilizer', entry as unknown as Record<string, unknown>);
    if (notify) showSaved('Order saved', entry.orderNumber || 'Stop Sale Notice');
    return entry;
  };

  const saveOrder = () => persistOrder(true);

  // Persist the record when the document is actually issued (download/print),
  // not merely when the form is filled in.
  const persistOrderForExport = async (): Promise<SavedFertStopSaleOrder | null> => {
    const errors: Record<string, string> = {};
    if (!String(form.firmName ?? '').trim()) errors.firmName = 'Firm name is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      showWarning('Please complete required fields', Object.values(errors)[0]);
      return null;
    }
    const dealer = String(form.firmName ?? '').trim();
    const f = form as unknown as Record<string, unknown>;
    const ref = String(f.orderNumber || f.noticeNumber || f.memoNumber || f.refNumber || '').trim();
    const ok = await askConfirm({
      title: `Issue Stop Sale Notice for ${dealer}${ref ? ` (${ref})` : ''}?`,
      message: 'The record will be saved to cloud records.',
      confirmLabel: 'Issue',
    });
    if (!ok) return null;
    return persistOrder(false, true);
  };

  // Binds the issued PDF's SHA-256 into the saved record + cloud payload so
  // the stored record can be verified against the document later.
  const bindIssuedPdfHash = (entry: SavedFertStopSaleOrder, blob: Blob) => {
    void sha256Hex(blob)
      .then((hash) => {
        const bound: SavedFertStopSaleOrder = { ...entry, issuedPdfSha256: hash };
        setSavedOrders((current) => current.map((item) => (item.id === entry.id ? bound : item)));
        void OfficerCloudSyncService.syncStatutoryOrder('stop_sale', 'fertilizer', bound as unknown as Record<string, unknown>);
      })
      .catch(() => {});
  };

  const editSavedOrder = (order: SavedFertStopSaleOrder) => {
    setForm({
      ...order,
      products: (order.products.length ? order.products : [emptyProduct()]).map((row) => ({
        ...row,
        nameOther: row.nameOther ?? '',
        manufacturerOther: row.manufacturerOther ?? '',
      })),
    });
    setEditingId(order.id);
    setShowPreview(false);
    showLoaded('Order loaded', order.orderNumber || 'Stop Sale Notice');
  };

  const deleteSavedOrder = (order: SavedFertStopSaleOrder) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      setSavedOrders((current) => current.filter((item) => item.id !== orderToDelete.id));
      if (editingId === orderToDelete.id) setEditingId(null);
      const deleted = orderToDelete as unknown as Record<string, unknown>;
      const orderNumber = String(deleted.orderNumber || deleted.noticeNumber || deleted.memoNumber || deleted.refNumber || deleted.id || '');
      if (orderNumber) void OfficerCloudSyncService.deleteStatutoryOrderRecord('stop_sale', 'fertilizer', orderNumber);
      showDeleted('Order deleted', orderToDelete.orderNumber || 'Untitled order');
      setOrderToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const performReset = () => {
    setResetSpinKey((current) => current + 1);
    const next = makeInitialForm();
    setForm({
      ...next,
      orderNumber: '',
      noticeDate: '',
      officerName: '',
      officerDesignation: '',
      mandal: '',
      district: '',
      manualMandal: '',
      manualDistrict: '',
      division: '',
      firmName: '',
      dealerAddress: '',
      formA2Number: '',
      observations: '',
    });
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
    const persisted = await persistOrderForExport();
    if (!persisted) return;
    const doc = await renderNoticePdfDocument(noticeBlocks, form.orderNumber || 'Stop Sale Notice', 'times');
    const pdfBlob = doc.output('blob');
    bindIssuedPdfHash(persisted, pdfBlob);
    const filename = `${fileBase()}.pdf`;
    doc.save(filename);
    showSuccess('PDF downloaded', filename);

    // Auto-archive in background (non-blocking)
    await OfficerDocumentArchiveService.archiveGeneratedDocument(pdfBlob, {
      filename,
      documentCategory: 'order',
      documentNumber: form.orderNumber || undefined,
      documentDate: form.noticeDate,
      sourceModule: 'stop_sale',
      fileFormat: 'pdf',
      metadata: { ...form, commodity: 'fertilizer' },
    });
  };

  const printOrder = async () => {
    try {
      const persisted = await persistOrderForExport();
      if (!persisted) return;
      const doc = await renderNoticePdfDocument(noticeBlocks, form.orderNumber || 'Stop Sale Notice', 'times');
      const pdfBlob = doc.output('blob');
      bindIssuedPdfHash(persisted, pdfBlob);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(pdfUrl);
        };
      } else {
        URL.revokeObjectURL(pdfUrl);
        showWarning('Print blocked', 'Please allow popups for this site to print the document.');
      }
    } catch (error) {
      console.error('Unable to generate PDF for printing:', error);
      showWarning('Print failed', 'Please try again.');
    }
  };

  const downloadWord = async () => {
    try {
      if (!(await persistOrderForExport())) return;
      const blob = await buildNoticeWordDocument(noticeBlocks, 'times');
      const url = URL.createObjectURL(blob);
      const filename = `${fileBase()}.docx`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showSuccess('Word downloaded', filename);

      // Auto-archive in background (non-blocking)
      await OfficerDocumentArchiveService.archiveGeneratedDocument(blob, {
        filename,
        documentCategory: 'order',
        documentNumber: form.orderNumber || undefined,
        documentDate: form.noticeDate,
        sourceModule: 'stop_sale',
        fileFormat: 'docx',
        metadata: { ...form, commodity: 'fertilizer' },
      });
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
    <div className="space-y-4 pb-10">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {confirmDialog}
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset form?"
        message="All entered details will be cleared."
        onConfirm={() => { setResetConfirmOpen(false); performReset(); }}
        onCancel={() => setResetConfirmOpen(false)}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete this order?"
        message={`Delete "${orderToDelete?.orderNumber || 'Untitled order'}"? This action cannot be undone.`}
        onConfirm={confirmDeleteOrder}
        onCancel={() => { setDeleteConfirmOpen(false); setOrderToDelete(null); }}
      />

      <div className="flex flex-wrap items-center justify-start gap-2">
        <ActionButton tone="primary" accent="sky" onClick={saveOrder} icon={Save}>Save Draft</ActionButton>
        <ActionButton tone="secondary" accent="sky" onClick={() => setShowSavedList(true)} icon={FolderOpen}>Drafts{savedOrders.length ? ` (${savedOrders.length})` : ''}</ActionButton>
        <ActionButton tone="secondary" className="text-red-600 dark:text-red-300" onClick={() => setResetConfirmOpen(true)}><RotateCcw key={resetSpinKey} className="h-4 w-4 reset-ccw-spin" aria-hidden="true" />Reset</ActionButton>
      </div>

      <div className="rounded-lg border border-sky-200/80 dark:border-sky-800/60 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2.5 pb-2 border-b border-sky-200/80 dark:border-sky-800/60 text-sm font-black uppercase tracking-wide text-sky-700 dark:text-sky-400 font-black">Officer Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Fertilizer Inspector" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
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
            <DivisionPicker
              label="Division"
              district={form.district}
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
          <TextInput label="Order No." value={form.orderNumber} onChange={(value) => updateForm({ orderNumber: value })} />
          <TextInput label="Date" type="date" value={form.noticeDate} onChange={(value) => updateForm({ noticeDate: value })} />
        </div>
      </div>

      <div className="rounded-lg border border-sky-200/80 dark:border-sky-800/60 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2.5 pb-2 border-b border-sky-200/80 dark:border-sky-800/60 text-sm font-black uppercase tracking-wide text-sky-700 dark:text-sky-400 font-black">Dealer Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <DealerPartySelect dealers={directoryDealers} onPick={applyDealerPick} label="Select dealer / party" />
          <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value })} error={fieldErrors.firmName} />
          <TextInput label="Form A2 / Licence No." value={form.formA2Number} onChange={(value) => updateForm({ formA2Number: value })} />
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
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-sky-200/80 dark:border-sky-800/60 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <h3 className="mb-2.5 pb-2 border-b border-sky-200/80 dark:border-sky-800/60 text-sm font-black uppercase tracking-wide text-sky-700 dark:text-sky-400 font-black">Order Details</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Stop Sale Period (days)" value={form.stopDays} onChange={updateStopDays} />
        </div>
      </div>

      <div className="rounded-lg border border-sky-200/80 dark:border-sky-800/60 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="mb-3 pb-2 border-b border-sky-200/80 dark:border-sky-800/60 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-sky-700 dark:text-sky-400 font-black">Stock Details</h3>
          <ActionButton tone="primary" accent="sky" size="sm" onClick={addProduct} icon={Plus}>Add Row</ActionButton>
        </div>
        <div className="space-y-3">
          {form.products.map((row, index) => (
            <div key={row.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">Item {index + 1}</span>
                <ActionButton tone="tertiary" size="sm" onClick={() => removeProduct(row.id)} icon={Trash2} aria-label="Remove row" className="text-red-600 dark:text-red-300">Remove</ActionButton>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="md:col-span-2 grid gap-3">
                  <SelectInput
                    label="Name of Fertilizer"
                    value={row.name}
                    onChange={(value) => updateProduct(row.id, { name: value })}
                    options={withCurrentOption(allFertilizerTypeGradeOptions, row.name)}
                  />
                  {row.name === 'Other' && (
                    <TextInput label="Enter Fertilizer Name" value={row.nameOther} onChange={(value) => updateProduct(row.id, { nameOther: value })} />
                  )}
                </div>
                <TextInput label="Batch No." value={row.batchNo} onChange={(value) => updateProduct(row.id, { batchNo: value })} />
                <div className="grid gap-3">
                  <SelectInput
                    label="Manufacturer / Importer"
                    value={row.manufacturer}
                    onChange={(value) => updateProduct(row.id, { manufacturer: value })}
                    options={withCurrentOption(dealerManufacturerImporterOptions, row.manufacturer)}
                  />
                  {row.manufacturer === 'Other' && (
                    <TextInput label="Enter Manufacturer Name" value={row.manufacturerOther} onChange={(value) => updateProduct(row.id, { manufacturerOther: value })} />
                  )}
                </div>
                <TextInput label="Quantity (MT)" value={row.quantityMt} onChange={(value) => updateProduct(row.id, { quantityMt: value })} />
                <TextInput label="Value (₹)" value={row.value ?? ''} onChange={(value) => updateProduct(row.id, { value: value })} />
                <TextInput label="Remarks" value={row.remarks} onChange={(value) => updateProduct(row.id, { remarks: value })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton tone="secondary" accent="sky" onClick={previewOrder} icon={Eye}>Preview</ActionButton>
        <ExportActionsMenu accent="sky" onPdf={downloadPdf} onWord={downloadWord} onPrint={printOrder} />
      </div>

      {showPreview && (
        <section ref={previewRef} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Stop Sale Notice Preview</h3>
            <ActionButton tone="secondary" size="sm" onClick={() => setShowPreview(false)} icon={X} aria-label="Close preview" className="!text-red-600 dark:!text-red-400">Close</ActionButton>
          </div>
          <div
            className="max-h-[520px] overflow-auto rounded-lg bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white shadow-inner ring-1 ring-slate-100"
            style={{ fontFamily: NOTICE_FONT_STACK, fontSize: '12pt', lineHeight: 1.15 }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </section>
      )}

      {showSavedList && (
        <InspectionTheme tone="sky">
          <Modal title="Saved orders" wide onClose={() => setShowSavedList(false)}>
            <div className="relative mb-3 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={savedSearch}
                onChange={(event) => setSavedSearch(event.target.value)}
                placeholder="Search saved orders"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Order No.</th>
                    <th className="px-3 py-2">Firm</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Items</th>
                    <th className="px-3 py-2">Status</th>
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
                      <td className="px-3 py-2">
                        {order.issuedAt ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Issued</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Draft</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <ActionButton tone="tertiary" size="sm" onClick={() => { setShowSavedList(false); editSavedOrder(order); }} icon={Edit3}>Edit</ActionButton>
                          {onRevoke && (
                            <ActionButton tone="danger" size="sm" onClick={() => onRevoke(order)}>Revoke</ActionButton>
                          )}
                          <ActionButton tone="danger" size="sm" onClick={() => deleteSavedOrder(order)} aria-label="Delete saved order" className="px-2"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSaved.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center font-semibold text-slate-500 dark:text-slate-400">{savedOrders.length ? 'No matching orders.' : 'No saved orders yet.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Modal>
        </InspectionTheme>
      )}
    </div>
  );
}

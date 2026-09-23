import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Eye, FileText, FileDown, FileUp, FolderOpen, RotateCcw, Save, Trash2 } from 'lucide-react';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { ToolkitPageHeader } from '../components/ui/ToolkitPageHeader';
import { addEmblemImageWatermark } from '../lib/pdfWatermark';
import { ActionButton, Field, InspectionTheme, Modal, RowTable, Section, StatusInput, SummaryChip, useInputClass } from '../components/inspection/ui';
import { emptyStatus, formatDate, listOrNil, statusText } from '../components/inspection/types';
import type { DraftRecord as DraftRecordBase, PdfSubTable, StatusField } from '../components/inspection/types';
import { exportDraftsFile, importDraftsFile, loadPersistedDrafts, loadPersistedForm, persistDraftRecords, savePersistedForm } from '../components/inspection/persistence';
import { confirmDiscardIfDirty, useDirtyGuard } from '../components/inspection/useDirtyGuard';
import { useDocumentAction } from '../hooks/useDocumentAction';
import { savePdfDocument } from '../lib/documentActions';

type DiscrepancyRow = { product: string; registerBalance: string; eposBalance: string; physicalBalance: string; difference: string; remarks: string };
type SampleRow = { product: string; company: string; batchNo: string; quantity: string; sampleDetails: string };
type SeizureRow = { fertilizer: string; batchLotNo: string; quantitySeized: string; reasonViolation: string; seizureMemo: string };
type DetentionRow = { fertilizer: string; batchLotNo: string; quantity: string; reasonDetention: string; detentionMemo: string };
type PurchaseInvoiceRow = { supplierName: string; invoiceNo: string; invoiceDate: string; product: string; quantity: string; remarks: string };

type StockRow = { product: string; currentStock: string };

interface InspectionForm {
  inspectionDate: string;
  dealerName: string;
  licenceNo: string;
  licenceValidUpTo: string;
  salePointAddress: string;
  storagePointAddress: string;

  mfmsId: string;
  eCompanyName: string;
  qrCodeNo: string;
  paymentAggregator: string;
  vpa: string;
  includeMfmsDetails: boolean;
  premisesSameAsLicence: StatusField;

  groundBalance: StatusField;
  discrepancyRows: DiscrepancyRow[];
  stockRegisterUpdated: StatusField;
  registerPagesCertificate: StatusField;
  licenceNoOnInvoices: StatusField;
  biofertilizersAuthorized: StatusField;
  purchasesFromApprovedSources: StatusField;
  purchaseInvoiceRows: PurchaseInvoiceRow[];
  priceListExhibited: StatusField;
  certificateDisplayed: StatusField;
  sellingOtherThanFormO: StatusField;
  billsIssuedWithBatch: StatusField;
  purchaserSignatureOnBills: StatusField;
  stocksStoredAsPerAct: StatusField;
  reportsSubmitted: StatusField;
  formDFailedSince: string;
  stockDetained: StatusField;
  detentionRows: DetentionRow[];
  seizureRows: SeizureRow[];
  majorOffences: StatusField;
  sampleRows: SampleRow[];
  stockRows: StockRow[];
  stockUnit: string;
  remarks: string;
  inspectorName: string;
  inspectorDesignation: string;
  inspectorOffice: string;
}

type DraftRecord = DraftRecordBase<InspectionForm>;

const FORM_KEY = 'tiryani-fertilizer-inspection-form';
const DRAFTS_KEY = 'tiryani-fertilizer-inspection-drafts';

const UNIT_OPTIONS = ['Bags', 'MTs'];
const DESIGNATION_OPTIONS = [
  'Mandal Agriculture Officer & Fertilizer Inspector',
  'Asst. Director of Agriculture & Fertilizer Inspector',
  'District Agriculture Officer & Fertilizer Inspector',
];

const emptyDiscrepancy = (): DiscrepancyRow => ({ product: '', registerBalance: '', eposBalance: '', physicalBalance: '', difference: '', remarks: '' });
const emptySample = (): SampleRow => ({ product: '', company: '', batchNo: '', quantity: '', sampleDetails: '' });
const emptySeizure = (): SeizureRow => ({ fertilizer: '', batchLotNo: '', quantitySeized: '', reasonViolation: '', seizureMemo: '' });
const emptyDetention = (): DetentionRow => ({ fertilizer: '', batchLotNo: '', quantity: '', reasonDetention: '', detentionMemo: '' });
const emptyPurchaseInvoice = (): PurchaseInvoiceRow => ({ supplierName: '', invoiceNo: '', invoiceDate: '', product: '', quantity: '', remarks: '' });

const STOCK_PRODUCTS = ['Urea', 'DAP', 'MOP', 'SSP', 'Complex'];
const emptyStockRow = (product: string): StockRow => ({ product, currentStock: '' });

const initialForm = (): InspectionForm => ({
  inspectionDate: new Date().toISOString().slice(0, 10),
  dealerName: '',
  licenceNo: '',
  licenceValidUpTo: '',
  salePointAddress: '',
  storagePointAddress: '',
  mfmsId: '',
  eCompanyName: '',
  qrCodeNo: '',
  paymentAggregator: '',
  vpa: '',
  includeMfmsDetails: true,
  premisesSameAsLicence: emptyStatus(),
  groundBalance: emptyStatus(),
  discrepancyRows: [],
  stockRegisterUpdated: emptyStatus(),
  registerPagesCertificate: emptyStatus(),
  licenceNoOnInvoices: emptyStatus(),
  biofertilizersAuthorized: emptyStatus(),
  purchasesFromApprovedSources: emptyStatus(),
  purchaseInvoiceRows: [],
  priceListExhibited: emptyStatus(),
  certificateDisplayed: emptyStatus(),
  sellingOtherThanFormO: emptyStatus(),
  billsIssuedWithBatch: emptyStatus(),
  purchaserSignatureOnBills: emptyStatus(),
  stocksStoredAsPerAct: emptyStatus(),
  reportsSubmitted: emptyStatus(),
  formDFailedSince: '',
  stockDetained: emptyStatus(),
  detentionRows: [],
  seizureRows: [],
  majorOffences: emptyStatus(),
  sampleRows: [],
  stockRows: STOCK_PRODUCTS.map((p) => emptyStockRow(p)),
  stockUnit: 'Bags',
  remarks: '',
  inspectorName: '',
  inspectorDesignation: '',
  inspectorOffice: '',
});

/** Normalizes persisted data — stock rows always align with STOCK_PRODUCTS order. */
function migrateForm(parsed: Partial<InspectionForm>): Partial<InspectionForm> {
  return {
    ...parsed,
    stockRows: STOCK_PRODUCTS.map((p, i) => ({ product: p, currentStock: parsed.stockRows?.[i]?.currentStock ?? '' })),
  };
}

export function FertilizerDealerInspection() {
  const navigate = useNavigate();
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo } = useToast();
  const [form, setForm] = useState<InspectionForm>(() => loadPersistedForm(FORM_KEY, initialForm, migrateForm));
  const [drafts, setDrafts] = useState<DraftRecord[]>(() => loadPersistedDrafts(DRAFTS_KEY, migrateForm));
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [sameStorageAsSale, setSameStorageAsSale] = useState(false);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false });
  const [showPreview, setShowPreview] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [error, setError] = useState('');
  const { busy: pdfBusy, run: runPdf } = useDocumentAction((message) => setError(message));
  const [dirty, setDirty] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const inputClass = useInputClass();

  useDirtyGuard(dirty);

  useEffect(() => {
    savePersistedForm(FORM_KEY, form);
  }, [form]);

  const set = <K extends keyof InspectionForm>(key: K, value: InspectionForm[K]) => { setDirty(true); setForm((current) => ({ ...current, [key]: value })); };
  const setStatus = (key: keyof InspectionForm, patch: Partial<StatusField>) => {
    setDirty(true);
    setForm((current) => ({ ...current, [key]: { ...(current[key] as StatusField), ...patch } }));
  };
  const toggleSection = (id: number) => setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  const itemNo = (n: number) => (form.includeMfmsDetails ? n : n - 5);

  const validate = () => {
    if (!form.inspectionDate) return 'Please enter the date of inspection.';
    if (!form.dealerName.trim()) return 'Please enter the name of the dealer.';
    if (!form.licenceNo.trim()) return 'Please enter the license number.';
    return '';
  };

  const saveDraft = () => {
    const name = `${form.dealerName.trim() || 'Untitled dealer'} - ${formatDate(form.inspectionDate)}`;
    const record: DraftRecord = { id: activeDraftId ?? `${Date.now()}`, name, savedAt: new Date().toISOString(), form };
    const next = activeDraftId ? drafts.map((d) => (d.id === activeDraftId ? record : d)) : [record, ...drafts];
    setDrafts(next);
    persistDraftRecords(DRAFTS_KEY, next);
    setActiveDraftId(record.id);
    setDirty(false);
    showSaved('Draft saved', name);
  };

  const loadDraft = (draft: DraftRecord) => {
    setForm({ ...initialForm(), ...migrateForm(draft.form) });
    setActiveDraftId(draft.id);
    setShowDrafts(false);
    setDirty(false);
    showLoaded('Draft loaded', draft.name);
  };

  const deleteDraft = (id: string) => {
    if (!window.confirm('Delete this draft?')) return;
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    persistDraftRecords(DRAFTS_KEY, next);
    if (activeDraftId === id) setActiveDraftId(null);
    showDeleted('Draft deleted');
  };

  const exportDrafts = () => {
    exportDraftsFile('fertilizer', drafts, `fertilizer-inspection-drafts-${new Date().toISOString().slice(0, 10)}.json`);
    showInfo('Drafts exported');
  };

  const importDrafts = async (file: File) => {
    try {
      const imported = await importDraftsFile<InspectionForm>(file);
      const incoming = imported.drafts.map((draft) => ({ ...draft, form: migrateForm(draft.form) as InspectionForm }));
      const next = [...incoming.filter((d) => !drafts.some((existing) => existing.id === d.id)), ...drafts];
      setDrafts(next);
      persistDraftRecords(DRAFTS_KEY, next);
      showSuccess(`${incoming.length} draft(s) imported`);
    } catch {
      setError('Could not import drafts — invalid file.');
    }
  };

  const resetForm = () => {
    if (!window.confirm('Reset the form? Unsaved entries will be lost.')) return;
    setForm(initialForm());
    setActiveDraftId(null);
    setError('');
    setDirty(false);
    showReset('Form reset');
  };

  const openPreview = () => {
    const message = validate();
    setError(message);
    if (message) return;
    setShowPreview(true);
    showInfo('Preview ready');
  };

  const generatePdf = async () => {
    const message = validate();
    setError(message);
    if (message) return;
    try {
      const doc = await buildPdf(form);
      await addEmblemImageWatermark(doc);
      await savePdfDocument(doc, `Fertilizer_Dealer_Inspection_${(form.dealerName || 'Dealer').replace(/[^a-z0-9]+/gi, '_')}_${form.inspectionDate}.pdf`);
      showSuccess('PDF downloaded');
    } catch (error) {
      console.error('PDF generation failed:', error);
      setError('PDF could not be generated. Please check your connection and try again.');
    }
  };

  const stockTotal = useMemo(() => form.stockRows.reduce((acc, r) => acc + (parseFloat(r.currentStock) || 0), 0), [form.stockRows]);

  const summary = useMemo(() => {
    const statusFields: StatusField[] = [
      form.premisesSameAsLicence, form.groundBalance, form.stockRegisterUpdated, form.registerPagesCertificate, form.licenceNoOnInvoices, form.biofertilizersAuthorized,
      form.purchasesFromApprovedSources, form.priceListExhibited, form.certificateDisplayed, form.sellingOtherThanFormO, form.billsIssuedWithBatch, form.purchaserSignatureOnBills,
      form.stocksStoredAsPerAct, form.reportsSubmitted, form.stockDetained, form.majorOffences,
    ];
    const textDone = [
      form.inspectionDate, form.dealerName, form.licenceNo || form.salePointAddress || form.storagePointAddress,
      ...(form.includeMfmsDetails ? [form.mfmsId, form.eCompanyName, form.qrCodeNo, form.paymentAggregator, form.vpa] : []),
    ].filter((v) => v.trim()).length;
    const statusDone = statusFields.filter((f) => f.status !== '').length;
    const samplesDone = form.sampleRows.length ? 1 : 0;
    const remarksDone = form.remarks.trim() ? 1 : 0;
    const all = statusFields.map((f) => f.status);
    return {
      total: form.includeMfmsDetails ? 26 : 21,
      completed: textDone + statusDone + samplesDone + remarksDone,
      yes: all.filter((s) => s === 'yes').length,
      no: all.filter((s) => s === 'no').length,
      na: all.filter((s) => s === 'na').length,
      discrepancies: form.discrepancyRows.length,
      invoices: form.purchaseInvoiceRows.length,
      detained: form.detentionRows.length,
      seized: form.seizureRows.length,
      samples: form.sampleRows.length,
    };
  }, [form]);

  const sectionProgress = useMemo(() => ({
    1: { done: [form.inspectionDate, form.dealerName, form.licenceNo || form.salePointAddress || form.storagePointAddress].filter((v) => v.trim()).length + (form.premisesSameAsLicence.status !== '' ? 1 : 0), total: 4 },
    2: { done: [form.mfmsId, form.eCompanyName, form.qrCodeNo, form.paymentAggregator, form.vpa].filter((v) => v.trim()).length, total: 5 },
    3: { done: [form.certificateDisplayed, form.priceListExhibited, form.licenceNoOnInvoices, form.sellingOtherThanFormO, form.biofertilizersAuthorized].filter((f) => f.status !== '').length, total: 5 },
    4: { done: [form.registerPagesCertificate, form.stockRegisterUpdated, form.groundBalance, form.purchasesFromApprovedSources, form.billsIssuedWithBatch, form.purchaserSignatureOnBills].filter((f) => f.status !== '').length, total: 6 },
    5: { done: [form.stocksStoredAsPerAct, form.reportsSubmitted].filter((f) => f.status !== '').length, total: 2 },
    6: { done: [form.stockDetained, form.majorOffences].filter((f) => f.status !== '').length + (form.sampleRows.length ? 1 : 0), total: 3 },
    7: { done: form.remarks.trim() ? 1 : 0, total: 1 },
  }), [form]);

  return (
    <InspectionTheme tone="sky">
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="relative mx-auto max-w-5xl p-4 pb-28 sm:p-6 lg:p-8">
        <ToolkitPageHeader
          icon={ClipboardCheck}
          tone="sky"
          eyebrow="Fertilizer inspection"
          title="Fertilizer dealer inspection form"
          fallbackPath="/officer-toolkit/inspections-notices"
          onBack={() => {
            if (!confirmDiscardIfDirty(dirty)) return;
            const idx = (window.history.state as { idx?: number } | null)?.idx;
            if (typeof idx === 'number' && idx > 0) navigate(-1);
            else navigate('/officer-toolkit/inspections-notices');
          }}
        />

        {error && <div className="mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm font-bold text-red-700 dark:text-red-300">{error}</div>}

        <div className="mb-3 flex flex-wrap gap-2">
          <ActionButton onClick={saveDraft} icon={Save} tone="sky">Save Draft</ActionButton>
          <ActionButton onClick={() => setShowDrafts(true)} icon={FolderOpen} tone="white">Drafts{drafts.length ? ` (${drafts.length})` : ''}</ActionButton>
          <ActionButton onClick={resetForm} icon={RotateCcw} tone="white">Reset</ActionButton>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Field label="Inspector name" value={form.inspectorName} onChange={(v) => set('inspectorName', v)} placeholder="Inspector full name" />
          <Field label="Designation" value={form.inspectorDesignation} onChange={(v) => set('inspectorDesignation', v)} options={DESIGNATION_OPTIONS} />
          <Field label="Office" value={form.inspectorOffice} onChange={(v) => set('inspectorOffice', v)} placeholder="Office address" />
        </div>

        <div className="space-y-4">
          <Section id={1} title="Dealer Details and Premises" subtitle="Items 1 to 4" open={openSections[1]} onToggle={toggleSection} progress={sectionProgress[1]}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="1. Date of inspection" type="date" value={form.inspectionDate} onChange={(v) => set('inspectionDate', v)} />
              <Field label="2. Name of the Dealer/Distributor" value={form.dealerName} onChange={(v) => set('dealerName', v)} placeholder="Firm / dealer name" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">3. License Details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="3. License number" value={form.licenceNo} onChange={(v) => set('licenceNo', v)} placeholder="License number" />
                <Field label="3(a). Valid up to" type="date" value={form.licenceValidUpTo} onChange={(v) => set('licenceValidUpTo', v)} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">3. Address</p>
              <div className="grid gap-3">
                <Field label="3(a). Sale point address" textarea value={form.salePointAddress} onChange={(v) => { set('salePointAddress', v); if (sameStorageAsSale) set('storagePointAddress', v); }} placeholder="D.no, Village, Mandal" />
                <label className="-my-1 inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={sameStorageAsSale}
                    onChange={(e) => {
                      setSameStorageAsSale(e.target.checked);
                      if (e.target.checked) set('storagePointAddress', form.salePointAddress);
                    }}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-sky-600"
                  />
                  Same as sale point address
                </label>
                <Field label="3(b). Storage point address" textarea value={form.storagePointAddress} onChange={(v) => { set('storagePointAddress', v); if (sameStorageAsSale) setSameStorageAsSale(false); }} placeholder="D.no, Village, Mandal" />
              </div>
            </div>
            <StatusInput label="4. Whether the sale and stock premises are the same as those mentioned in the license" field={form.premisesSameAsLicence} onChange={(p) => setStatus('premisesSameAsLicence', p)} remarksWhen="no" />
          </Section>

          <Section id={2} title="mFMS and Digital Details" subtitle={form.includeMfmsDetails ? 'Items 5 to 9 · Optional' : 'Items 5 to 9 · Disabled — excluded from report'} open={openSections[2]} onToggle={toggleSection} progress={form.includeMfmsDetails ? sectionProgress[2] : undefined}>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-100">
              <input
                type="checkbox"
                checked={form.includeMfmsDetails}
                onChange={(e) => set('includeMfmsDetails', e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-sky-600"
              />
              Include mFMS and digital details (items 5-9) in this inspection
            </label>
            {form.includeMfmsDetails ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="5. mFMS ID number" value={form.mfmsId} onChange={(v) => set('mfmsId', v)} placeholder="mFMS ID" />
                <Field label="6. e-Company name" value={form.eCompanyName} onChange={(v) => set('eCompanyName', v)} placeholder="e-Company name" />
                <Field label="7. QR code number" value={form.qrCodeNo} onChange={(v) => set('qrCodeNo', v)} placeholder="QR code number" />
                <Field label="8. Payment aggregator" value={form.paymentAggregator} onChange={(v) => set('paymentAggregator', v)} placeholder="Payment aggregator" />
                <Field label="9. Virtual payment address (VPA)" value={form.vpa} onChange={(v) => set('vpa', v)} placeholder="VPA / UPI ID" />
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Items 5-9 are disabled and will not appear in the preview or PDF.</p>
            )}
          </Section>

          <Section id={3} title="License Compliance" subtitle={`Items ${itemNo(10)} to ${itemNo(14)}`} open={openSections[3]} onToggle={toggleSection} progress={sectionProgress[3]}>
            <StatusInput label={`${itemNo(10)}. Whether Certificate of Registration (License) displayed prominently or not`} field={form.certificateDisplayed} onChange={(p) => setStatus('certificateDisplayed', p)} remarksWhen="no" />
            <StatusInput label={`${itemNo(11)}. Whether the dealer has exhibited stock board and the price list`} field={form.priceListExhibited} onChange={(p) => setStatus('priceListExhibited', p)} remarksWhen="no" />
            <StatusInput label={`${itemNo(12)}. Whether the license number is mentioned on sales invoices/cash memo`} field={form.licenceNoOnInvoices} onChange={(p) => setStatus('licenceNoOnInvoices', p)} remarksWhen="no" />
            <StatusInput label={`${itemNo(13)}. Whether the dealer is selling fertilizer other than the fertilizers of Form "O" incorporated in CR`} field={form.sellingOtherThanFormO} onChange={(p) => setStatus('sellingOtherThanFormO', p)} remarksWhen="yes" />
            <StatusInput label={`${itemNo(14)}. Whether biofertilizers, if stocked/sold, are from authorized sources and conform to prescribed specifications and labeling requirements`} field={form.biofertilizersAuthorized} onChange={(p) => setStatus('biofertilizersAuthorized', p)} remarksWhen="no" />
          </Section>

          <Section id={4} title="Registers, Records and Bills" subtitle={`Items ${itemNo(15)} to ${itemNo(20)}`} open={openSections[4]} onToggle={toggleSection} progress={sectionProgress[4]}>
            <StatusInput label={`${itemNo(15)}. Whether dealer has obtained a certificate confirming the pages in Stock Register and Sale Bill Books`} field={form.registerPagesCertificate} onChange={(p) => setStatus('registerPagesCertificate', p)} remarksWhen="no" />
            <StatusInput label={`${itemNo(16)}. Whether the Stock Register is updated or not`} field={form.stockRegisterUpdated} onChange={(p) => setStatus('stockRegisterUpdated', p)} remarksWhen="no" />
            <StatusInput label={`${itemNo(17)}. Whether the ground balance of stocks tallies with the stock register and ePOS, or whether there is any discrepancy`} field={form.groundBalance} onChange={(p) => setStatus('groundBalance', p)} remarksWhen="no" />
            {form.groundBalance.status === 'no' && (
              <RowTable<DiscrepancyRow>
                title="Discrepancy details"
                rows={form.discrepancyRows}
                onChange={(rows) => set('discrepancyRows', rows.map((r) => {
                  const epos = parseFloat(r.eposBalance);
                  const physical = parseFloat(r.physicalBalance);
                  return { ...r, difference: Number.isNaN(epos) || Number.isNaN(physical) ? '' : String(epos - physical) };
                }))}
                empty={emptyDiscrepancy}
                addLabel="Add discrepancy"
                columns={[
                  { key: 'product', label: 'Fertilizer' },
                  { key: 'registerBalance', label: 'Register Stock' },
                  { key: 'eposBalance', label: 'ePOS Stock' },
                  { key: 'physicalBalance', label: 'Physical Stock' },
                  { key: 'difference', label: 'Variation', type: 'computed' },
                  { key: 'remarks', label: 'Remarks' },
                ]}
              />
            )}
            <StatusInput label={`${itemNo(18)}. Whether the dealer purchases stocks from approved and authorised sources. Verify the purchase invoices.`} field={form.purchasesFromApprovedSources} onChange={(p) => setStatus('purchasesFromApprovedSources', p)} />
            <RowTable<PurchaseInvoiceRow>
              title="Purchase invoice verification"
              rows={form.purchaseInvoiceRows}
              onChange={(rows) => set('purchaseInvoiceRows', rows)}
              empty={emptyPurchaseInvoice}
              addLabel="Add purchase invoice"
              columns={[
                { key: 'supplierName', label: 'Supplier name' },
                { key: 'invoiceNo', label: 'Invoice number' },
                { key: 'invoiceDate', label: 'Invoice date' },
                { key: 'product', label: 'Fertilizer product' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'remarks', label: 'Remarks' },
              ]}
            />
            <StatusInput label={`${itemNo(19)}. Whether bills are being issued to consumers, duly mentioning the batch number and trade name of fertilizers`} field={form.billsIssuedWithBatch} onChange={(p) => setStatus('billsIssuedWithBatch', p)} />
            <StatusInput label={`${itemNo(20)}. Whether signature of purchaser is obtained on Sale Bills or not`} field={form.purchaserSignatureOnBills} onChange={(p) => setStatus('purchaserSignatureOnBills', p)} remarksWhen="no" />
          </Section>

          <Section id={5} title="Storage and Reporting" subtitle={`Items ${itemNo(21)} to ${itemNo(22)}`} open={openSections[5]} onToggle={toggleSection} progress={sectionProgress[5]}>
            <StatusInput label={`${itemNo(21)}. Whether the Fertilizers are stored as per the provisions of FCO 1985`} field={form.stocksStoredAsPerAct} onChange={(p) => setStatus('stocksStoredAsPerAct', p)} remarksWhen="no" />
            <StatusInput label={`${itemNo(22)}. Whether the dealer / distributor / manufacturer is submitting reports regularly to the licensing officer`} field={form.reportsSubmitted} onChange={(p) => { setStatus('reportsSubmitted', p); if (p.status && p.status !== 'no') set('formDFailedSince', ''); }} remarksWhen="no" extra={form.reportsSubmitted.status === 'no' ? (
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-wide text-slate-500 dark:text-slate-400">If no, since when has the dealer failed to submit Form D</span>
                <input type="date" value={form.formDFailedSince} onChange={(e) => set('formDFailedSince', e.target.value)} className={`${inputClass} sm:w-44`} />
              </label>
            ) : null} />
          </Section>

          <Section id={6} title="Detention, Seizure and Samples" subtitle={`Items ${itemNo(23)} to ${itemNo(25)}`} open={openSections[6]} onToggle={toggleSection} progress={sectionProgress[6]}>
            <StatusInput label={`${itemNo(23)}. Any stock is detained for rectifiable violation`} field={form.stockDetained} onChange={(p) => setStatus('stockDetained', p)} />
            {form.stockDetained.status === 'yes' && (
              <RowTable<DetentionRow>
                title="Detention details"
                rows={form.detentionRows}
                onChange={(rows) => set('detentionRows', rows)}
                empty={emptyDetention}
                addLabel="Add detained stock"
                columns={[
                  { key: 'fertilizer', label: 'Fertilizer' },
                  { key: 'batchLotNo', label: 'Batch / Lot No.' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'reasonDetention', label: 'Reason for Detention' },
                  { key: 'detentionMemo', label: 'Detention Memo No. & Date' },
                ]}
              />
            )}
            <StatusInput label={`${itemNo(24)}. Major offences committed, if any (give details of seizure of stocks)`} field={form.majorOffences} onChange={(p) => setStatus('majorOffences', p)} />
            {form.majorOffences.status === 'yes' && (
              <RowTable<SeizureRow>
                title="Stock seized details"
                rows={form.seizureRows}
                onChange={(rows) => set('seizureRows', rows)}
                empty={emptySeizure}
                addLabel="Add seized stock"
                columns={[
                  { key: 'fertilizer', label: 'Fertilizer' },
                  { key: 'batchLotNo', label: 'Batch / Lot No.' },
                  { key: 'quantitySeized', label: 'Quantity Seized' },
                  { key: 'reasonViolation', label: 'Reason / Violation' },
                  { key: 'seizureMemo', label: 'Seizure Memo No. & Date' },
                ]}
              />
            )}
            <div>
              <p className="mb-1 text-xs font-bold text-slate-800 dark:text-slate-100">{itemNo(25)}. Details of fertilizer samples drawn</p>
              <RowTable<SampleRow>
                title="Samples drawn"
                rows={form.sampleRows}
                onChange={(rows) => set('sampleRows', rows)}
                empty={emptySample}
                addLabel="Add sample"
                columns={[
                  { key: 'product', label: 'Fertilizer' },
                  { key: 'company', label: 'Company' },
                  { key: 'batchNo', label: 'Batch / Lot No.' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'sampleDetails', label: 'Sample details' },
                ]}
              />
            </div>
          </Section>

          <Section id={7} title="Stock Position and Remarks" subtitle={`Current stock as on date of inspection · Item ${itemNo(26)}`} open={openSections[7]} onToggle={toggleSection} progress={sectionProgress[7]}>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Fertilizer stock position as on {formatDate(form.inspectionDate)}
            </p>
            <Field label="Unit" value={form.stockUnit} onChange={(v) => set('stockUnit', v)} options={UNIT_OPTIONS} />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 dark:border-slate-600 text-xs">
                <thead>
                  <tr className="bg-sky-50 dark:bg-sky-950/40">
                    <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-left font-bold">Sl. no.</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-left font-bold">Product</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-left font-bold">Current stock</th>
                  </tr>
                </thead>
                <tbody>
                  {form.stockRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-center font-semibold">{index + 1}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2 py-1 font-semibold">{row.product}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2 py-1"><input type="number" value={row.currentStock} onChange={(e) => set('stockRows', form.stockRows.map((r, i) => (i === index ? { ...r, currentStock: e.target.value } : r)))} className="w-full rounded border border-slate-200 dark:border-slate-700 px-1 py-0.5 text-xs" /></td>
                    </tr>
                  ))}
                  <tr className="bg-sky-100 dark:bg-sky-900/40 font-black">
                    <td className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-center" colSpan={2}>Total</td>
                    <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">{stockTotal || ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Field label={`${itemNo(26)}. Remarks`} textarea value={form.remarks} onChange={(v) => set('remarks', v)} placeholder="Enter overall observations or remarks..." />
          </Section>

        </div>

        <div className="mt-5 rounded-2xl border border-sky-200/60 bg-white/90 p-3 shadow-md dark:border-sky-800/50 dark:bg-slate-900/80">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-sky-800 dark:text-sky-300">Inspection summary</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <SummaryChip label="Total items" value={summary.total} />
            <SummaryChip label="Completed" value={summary.completed} />
            <SummaryChip label="Yes" value={summary.yes} />
            <SummaryChip label="No" value={summary.no} />
            <SummaryChip label="N/A" value={summary.na} />
            <SummaryChip label="Discrepancies" value={summary.discrepancies} />
            <SummaryChip label="Invoices" value={summary.invoices} />
            <SummaryChip label="Detained" value={summary.detained} />
            <SummaryChip label="Seized" value={summary.seized} />
            <SummaryChip label="Samples" value={summary.samples} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-sky-100 pt-3 dark:border-sky-900/40">
            <ActionButton onClick={openPreview} icon={Eye} tone="purple">Preview</ActionButton>
            <ActionButton onClick={() => runPdf(generatePdf)} icon={FileText} tone="sky" busy={pdfBusy}>{pdfBusy ? 'Generating…' : 'PDF'}</ActionButton>
          </div>
        </div>
      </div>

      {showDrafts && (
        <Modal title="Saved drafts" onClose={() => setShowDrafts(false)}>
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" onClick={exportDrafts} disabled={!drafts.length} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-black text-white hover:bg-sky-700 disabled:opacity-50">
              <FileDown className="h-4 w-4" />
              Export drafts
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 dark:border-sky-800/50 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-black text-sky-700 dark:text-sky-300 hover:bg-sky-50">
              <FileUp className="h-4 w-4" />
              Import drafts
            </button>
            <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importDrafts(file); e.target.value = ''; }} />
          </div>
          {drafts.length === 0 ? (
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No drafts saved yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {drafts.map((draft) => (
                <li key={draft.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{draft.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Saved {new Date(draft.savedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => loadDraft(draft)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-black text-white hover:bg-sky-700">Edit</button>
                    <button type="button" onClick={() => deleteDraft(draft.id)} className="rounded-lg border border-red-200 dark:border-red-800/50 bg-white dark:bg-slate-900 px-2 py-1.5 text-red-600 dark:text-red-300 hover:bg-red-50" aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {showPreview && (
        <Modal title="Inspection preview" onClose={() => setShowPreview(false)} wide footer={<ActionButton onClick={() => runPdf(generatePdf)} icon={FileText} tone="sky" busy={pdfBusy}>{pdfBusy ? 'Generating…' : 'PDF'}</ActionButton>}>
          <Preview form={form} stockTotal={stockTotal} />
        </Modal>
      )}

    </div>
    </InspectionTheme>
  );
}

function buildRows(form: InspectionForm, stockTotal: number): { items: string[][]; subTables: PdfSubTable[] } {
  const itemNo = (n: number) => String(form.includeMfmsDetails ? n : n - 5);

  const items: string[][] = [
    ['1', 'Date of inspection', formatDate(form.inspectionDate)],
    ['2', 'Name of the Dealer/Distributor', form.dealerName || '-'],
    ['3', 'License number', [form.licenceNo, form.licenceValidUpTo && `Valid up to: ${formatDate(form.licenceValidUpTo)}`].filter(Boolean).join(' - ') || '-'],
    ['3(a)', 'Sale point address', form.salePointAddress || '-'],
    ['3(b)', 'Storage point address', form.storagePointAddress || '-'],
    ['4', 'Whether the sale and stock premises are the same as those mentioned in the license', statusText(form.premisesSameAsLicence)],
    ...(form.includeMfmsDetails ? [
      ['5', 'mFMS ID number', form.mfmsId || '-'],
      ['6', 'e-Company name', form.eCompanyName || '-'],
      ['7', 'QR code number', form.qrCodeNo || '-'],
      ['8', 'Payment aggregator', form.paymentAggregator || '-'],
      ['9', 'Virtual payment address (VPA)', form.vpa || '-'],
    ] : []),
    [itemNo(10), 'Whether Certificate of Registration (License) displayed prominently or not', statusText(form.certificateDisplayed)],
    [itemNo(11), 'Whether the dealer has exhibited stock board and the price list', statusText(form.priceListExhibited)],
    [itemNo(12), 'Whether the license number is mentioned on sales invoices/cash memo', statusText(form.licenceNoOnInvoices)],
    [itemNo(13), 'Whether the dealer is selling fertilizer other than the fertilizers of Form "O" incorporated in CR', statusText(form.sellingOtherThanFormO)],
    [itemNo(14), 'Whether biofertilizers, if stocked/sold, are from authorized sources and conform to prescribed specifications and labeling requirements', statusText(form.biofertilizersAuthorized)],
    [itemNo(15), 'Whether dealer has obtained a certificate confirming the pages in Stock Register and Sale Bill Books', statusText(form.registerPagesCertificate)],
    [itemNo(16), 'Whether the Stock Register is updated or not', statusText(form.stockRegisterUpdated)],
    [itemNo(17), 'Whether the ground balance of stocks tallies with the stock register and ePOS, or whether there is any discrepancy', `${statusText(form.groundBalance)}${form.groundBalance.status === 'no' && form.discrepancyRows.length ? `\n${listOrNil(form.discrepancyRows, 'discrepancy/ies')}` : ''}`],
    [itemNo(18), 'Whether the dealer purchases stocks from approved and authorised sources. Verify the purchase invoices.', `${statusText(form.purchasesFromApprovedSources)}${form.purchaseInvoiceRows.length ? `\n${listOrNil(form.purchaseInvoiceRows, 'invoice(s)')}` : ''}`],
    [itemNo(19), 'Whether bills are being issued to consumers, duly mentioning the batch number and trade name of fertilizers', statusText(form.billsIssuedWithBatch)],
    [itemNo(20), 'Whether signature of purchaser is obtained on Sale Bills or not', statusText(form.purchaserSignatureOnBills)],
    [itemNo(21), 'Whether the Fertilizers are stored as per the provisions of FCO 1985', statusText(form.stocksStoredAsPerAct)],
    [itemNo(22), 'Whether the dealer / distributor / manufacturer is submitting reports regularly to the licensing officer', [statusText(form.reportsSubmitted), form.reportsSubmitted.status === 'no' && form.formDFailedSince ? `Failed to submit Form D since ${formatDate(form.formDFailedSince)}` : ''].filter(Boolean).join(' - ')],
    [itemNo(23), 'Any stock is detained for rectifiable violation', `${statusText(form.stockDetained)}${form.stockDetained.status === 'yes' && form.detentionRows.length ? `\n${listOrNil(form.detentionRows, 'stock(s) detained')}` : ''}`],
    [itemNo(24), 'Major offences committed, if any (give details of seizure of stocks)', `${statusText(form.majorOffences)}${form.majorOffences.status === 'yes' && form.seizureRows.length ? `\n${listOrNil(form.seizureRows, 'stock(s) seized')}` : ''}`],
    [itemNo(25), 'Details of fertilizer samples drawn', listOrNil(form.sampleRows, 'sample(s)')],
    [itemNo(26), 'Remarks', form.remarks.trim() || '-'],
  ];

  const subTables: PdfSubTable[] = [];
  if (form.groundBalance.status === 'no' && form.discrepancyRows.length) subTables.push({ title: `Item ${itemNo(17)} - Discrepancy details`, head: ['Fertilizer', 'Register Stock', 'ePOS Stock', 'Physical Stock', 'Variation', 'Remarks'], body: form.discrepancyRows.map((r) => { const e = parseFloat(r.eposBalance); const p = parseFloat(r.physicalBalance); return [r.product, r.registerBalance, r.eposBalance, r.physicalBalance, Number.isNaN(e) || Number.isNaN(p) ? '-' : String(e - p), r.remarks]; }) });
  if (form.purchaseInvoiceRows.length) subTables.push({ title: `Item ${itemNo(18)} - Purchase invoice verification`, head: ['Supplier name', 'Invoice number', 'Invoice date', 'Fertilizer product', 'Quantity', 'Remarks'], body: form.purchaseInvoiceRows.map((r) => [r.supplierName, r.invoiceNo, r.invoiceDate, r.product, r.quantity, r.remarks]) });
  if (form.stockDetained.status === 'yes' && form.detentionRows.length) subTables.push({ title: `Item ${itemNo(23)} - Detention details`, head: ['Fertilizer', 'Batch / Lot No.', 'Quantity', 'Reason for Detention', 'Detention Memo No. & Date'], body: form.detentionRows.map((r) => [r.fertilizer, r.batchLotNo, r.quantity, r.reasonDetention, r.detentionMemo]) });
  if (form.majorOffences.status === 'yes' && form.seizureRows.length) subTables.push({ title: `Item ${itemNo(24)} - Stock seized details`, head: ['Fertilizer', 'Batch / Lot No.', 'Quantity Seized', 'Reason / Violation', 'Seizure Memo No. & Date'], body: form.seizureRows.map((r) => [r.fertilizer, r.batchLotNo, r.quantitySeized, r.reasonViolation, r.seizureMemo]) });
  if (form.sampleRows.length) subTables.push({ title: `Item ${itemNo(25)} - Samples drawn`, head: ['Fertilizer', 'Company', 'Batch / Lot No.', 'Quantity', 'Sample details'], body: form.sampleRows.map((r) => [r.product, r.company, r.batchNo, r.quantity, r.sampleDetails]) });
  subTables.push({ title: `Fertilizer stock position as on ${formatDate(form.inspectionDate)}`, head: ['Sl. no.', 'Product', `Current stock (${form.stockUnit || 'Bags'})`], body: [...form.stockRows.map((r, i) => [String(i + 1), r.product, r.currentStock]), ['', 'Total', String(stockTotal)]] });
  return { items, subTables };
}

async function buildPdf(form: InspectionForm) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const bottom = pageHeight - 14;
  const stockTotal = form.stockRows.reduce((acc, r) => acc + (parseFloat(r.currentStock) || 0), 0);
  const { items, subTables } = buildRows(form, stockTotal);

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  const fertTitle = 'Fertilizer Dealer Inspection Report';
  doc.text(fertTitle, pageWidth / 2, 16, { align: 'center' });
  const fertTitleWidth = doc.getTextWidth(fertTitle);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - fertTitleWidth / 2, 18, pageWidth / 2 + fertTitleWidth / 2, 18);
  doc.setFont('times', 'normal');
  doc.setFontSize(10);

  autoTable(doc, {
    startY: 22,
    margin: { top: 16, left: margin, right: margin, bottom: 14 },
    rowPageBreak: 'avoid',
    theme: 'grid',
    head: [['No.', 'Particulars', 'Observation / Remarks']],
    body: items,
    styles: { font: 'times', fontSize: 10, cellPadding: 1.5, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0], valign: 'top' },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 78 }, 2: { cellWidth: pageWidth - margin * 2 - 90 } },
  });

  let y = (doc as any).lastAutoTable.finalY;
  for (const table of subTables) {
    if (y + 20 > bottom) {
      doc.addPage();
      y = 16;
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text(table.title, margin, y + 6);
    autoTable(doc, {
      startY: y + 8,
      margin: { top: 16, left: margin, right: margin, bottom: 14 },
      rowPageBreak: 'avoid',
      theme: 'grid',
      head: [table.head],
      body: table.body,
      styles: { font: 'times', fontSize: 9.5, cellPadding: 1.2, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
    });
    y = (doc as any).lastAutoTable.finalY;
  }

  if (y + 30 > bottom) {
    doc.addPage();
    y = 16;
  }
  const signatureY = y + 14;
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  const dealerLabel = 'Signature of dealer and seal';
  doc.text(dealerLabel, margin, signatureY);
  const dealerCenterX = margin + doc.getTextWidth(dealerLabel) / 2;
  const signatureLabel = 'Signature of fertilizer inspector and seal';
  doc.text(signatureLabel, pageWidth - margin, signatureY, { align: 'right' });
  const signatureCenterX = pageWidth - margin - doc.getTextWidth(signatureLabel) / 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  if (form.dealerName.trim()) doc.text(`(${form.dealerName.trim()})`, dealerCenterX, signatureY + 5, { align: 'center' });
  [
    form.inspectorName.trim() ? `(${form.inspectorName.trim()})` : '',
    form.inspectorDesignation.split('&')[0].trim(),
    form.inspectorOffice.trim(),
  ]
    .filter(Boolean)
    .forEach((line, i) => doc.text(line, signatureCenterX, signatureY + 5 + i * 4, { align: 'center' }));

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(128);
    doc.text('AGRONIX', pageWidth - margin, pageHeight - 6, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
  return doc;
}

function Preview({ form, stockTotal }: { form: InspectionForm; stockTotal: number }) {
  const { items, subTables } = buildRows(form, stockTotal);
  return (
    <div className="text-slate-900 dark:text-white">
      <h3 className="mb-3 text-center text-base font-black">Fertilizer Dealer Inspection Report</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-sky-50 dark:bg-sky-950/40">
              <th className="border border-slate-400 px-2 py-1 text-left font-bold">No.</th>
              <th className="border border-slate-400 px-2 py-1 text-left font-bold">Particulars</th>
              <th className="border border-slate-400 px-2 py-1 text-left font-bold">Observation / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map(([no, label, value], i) => (
              <tr key={i}>
                <td className="border border-slate-400 px-2 py-1 text-center align-top font-semibold">{no}</td>
                <td className="border border-slate-400 px-2 py-1 align-top">{label}</td>
                <td className="whitespace-pre-line border border-slate-400 px-2 py-1 align-top font-semibold">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {subTables.map((table) => (
        <div key={table.title} className="mt-4">
          <p className="mb-1 text-xs font-black">{table.title}</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">{table.head.map((h) => <th key={h} className="border border-slate-400 px-2 py-1 text-left font-bold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {table.body.map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-slate-400 px-2 py-1">{cell || '-'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="mt-8 flex justify-between text-xs font-bold">
        <div className="text-center">
          <p>Signature of dealer and seal</p>
          {form.dealerName.trim() && <p className="font-normal italic">({form.dealerName.trim()})</p>}
        </div>
        <div className="text-center">
          <p>Signature of fertilizer inspector and seal</p>
          {[
            form.inspectorName.trim() ? `(${form.inspectorName.trim()})` : '',
            form.inspectorDesignation.split('&')[0].trim(),
            form.inspectorOffice.trim(),
          ].filter(Boolean).map((line) => (
            <p key={line} className="font-normal italic">{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, ChevronDown, ClipboardCheck, Download, Eye, FlaskConical, FolderOpen, Plus, RotateCcw, Save, Sprout, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastContainer, useToast } from '../components/ui/Toast';

type Status = '' | 'yes' | 'no' | 'na';
type StatusField = { status: Status; remarks: string };

type StockRow = { fertilizer: string; company: string; grade: string; openingBalance: string; receipts: string; sales: string; closingBalance: string };
type DiscrepancyRow = { product: string; registerBalance: string; eposBalance: string; physicalBalance: string; difference: string; remarks: string };
type PurchaseInvoiceRow = { supplierName: string; invoiceNo: string; invoiceDate: string; product: string; quantity: string; remarks: string };
type SampleRow = { product: string; company: string; grade: string; batchNo: string; quantity: string; unit: string; sampleDetails: string };
type ShowCauseRow = { noticeNo: string; date: string; reason: string; status: string; remarks: string };
type SalesRow = { product: string; openingBalance: string; receipt: string; sales: string };

interface InspectionForm {
  inspectionDate: string;
  dealerName: string;
  licenceNo: string;
  licenceValidFrom: string;
  licenceValidUpTo: string;
  salePointAddress: string;
  storagePointAddress: string;
  contactNumber: string;
  mfmsId: string;
  eCompanyName: string;
  qrCodeNo: string;
  paymentAggregator: string;
  vpa: string;
  premisesSameAsLicence: StatusField;
  stockRows: StockRow[];
  groundBalance: StatusField;
  discrepancyRows: DiscrepancyRow[];
  stockRegisterInvoices: StatusField;
  stockRegisterDeficiency: string;
  licenceNoOnInvoices: StatusField;
  purchasesFromApprovedSources: StatusField;
  purchaseInvoiceRows: PurchaseInvoiceRow[];
  priceListExhibited: StatusField;
  billsIssuedWithBatch: StatusField;
  stocksStoredAsPerAct: StatusField;
  reportsSubmitted: StatusField;
  ureaEposQty: string;
  ureaEposUnit: string;
  ureaGroundQty: string;
  ureaGroundUnit: string;
  sampleRows: SampleRow[];
  showCauseIssued: Status;
  showCauseRows: ShowCauseRow[];
  licenceSuspended: Status;
  suspensionDate: string;
  suspensionOrderNo: string;
  suspensionRemarks: string;
  suspensionReasons: string;
  salesRows: SalesRow[];
  salesUnit: string;
  inspectorName: string;
  inspectorDesignation: string;
  inspectorOffice: string;
}

interface DraftRecord {
  id: string;
  name: string;
  savedAt: string;
  form: InspectionForm;
}

const FORM_KEY = 'tiryani-fertilizer-inspection-form';
const DRAFTS_KEY = 'tiryani-fertilizer-inspection-drafts';

const UNIT_OPTIONS = ['Bags', 'MTs'];
const FERTILIZER_PRODUCTS = ['Urea', 'DAP', 'MOP', 'SSP', 'Complex', 'Other'];
const DESIGNATION_OPTIONS = [
  'Mandal Agriculture Officer & Fertilizer Inspector',
  'Asst. Director of Agriculture & Fertilizer Inspector',
  'District Agriculture Officer & Fertilizer Inspector',
];

const emptyStatus = (): StatusField => ({ status: '', remarks: '' });
const emptyStockRow = (): StockRow => ({ fertilizer: '', company: '', grade: '', openingBalance: '', receipts: '', sales: '', closingBalance: '' });
const emptyDiscrepancy = (): DiscrepancyRow => ({ product: '', registerBalance: '', eposBalance: '', physicalBalance: '', difference: '', remarks: '' });
const emptyPurchaseInvoice = (): PurchaseInvoiceRow => ({ supplierName: '', invoiceNo: '', invoiceDate: '', product: '', quantity: '', remarks: '' });
const emptySample = (): SampleRow => ({ product: '', company: '', grade: '', batchNo: '', quantity: '', unit: 'kg', sampleDetails: '' });
const emptyShowCause = (): ShowCauseRow => ({ noticeNo: '', date: '', reason: '', status: '', remarks: '' });

const SALES_PRODUCTS = ['Urea', 'DAP', 'MOP', 'SSP', 'Complex'];
const emptySalesRow = (product: string): SalesRow => ({ product, openingBalance: '', receipt: '', sales: '' });

const initialForm = (): InspectionForm => ({
  inspectionDate: new Date().toISOString().slice(0, 10),
  dealerName: '',
  licenceNo: '',
  licenceValidFrom: '',
  licenceValidUpTo: '',
  salePointAddress: '',
  storagePointAddress: '',
  contactNumber: '',
  mfmsId: '',
  eCompanyName: '',
  qrCodeNo: '',
  paymentAggregator: '',
  vpa: '',
  premisesSameAsLicence: emptyStatus(),
  stockRows: [],
  groundBalance: emptyStatus(),
  discrepancyRows: [],
  stockRegisterInvoices: emptyStatus(),
  stockRegisterDeficiency: '',
  licenceNoOnInvoices: emptyStatus(),
  purchasesFromApprovedSources: emptyStatus(),
  purchaseInvoiceRows: [],
  priceListExhibited: emptyStatus(),
  billsIssuedWithBatch: emptyStatus(),
  stocksStoredAsPerAct: emptyStatus(),
  reportsSubmitted: emptyStatus(),
  ureaEposQty: '',
  ureaEposUnit: 'Bags',
  ureaGroundQty: '',
  ureaGroundUnit: 'Bags',
  sampleRows: [],
  showCauseIssued: '',
  showCauseRows: [],
  licenceSuspended: '',
  suspensionDate: '',
  suspensionOrderNo: '',
  suspensionRemarks: '',
  suspensionReasons: '',
  salesRows: SALES_PRODUCTS.map((p) => emptySalesRow(p)),
  salesUnit: 'Bags',
  inspectorName: '',
  inspectorDesignation: '',
  inspectorOffice: '',
});

function loadForm(): InspectionForm {
  try {
    const saved = window.localStorage.getItem(FORM_KEY);
    if (!saved) return initialForm();
    const parsed = JSON.parse(saved) as Partial<InspectionForm>;
    const base = initialForm();
    return {
      ...base,
      ...parsed,
      salesRows: SALES_PRODUCTS.map((_, i) => parsed.salesRows?.[i] ?? base.salesRows[i]),
    };
  } catch {
    return initialForm();
  }
}

function loadDrafts(): DraftRecord[] {
  try {
    const saved = window.localStorage.getItem(DRAFTS_KEY);
    return saved ? (JSON.parse(saved) as DraftRecord[]) : [];
  } catch {
    return [];
  }
}

function persistDrafts(drafts: DraftRecord[]) {
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function statusLabel(status: Status) {
  return status === 'yes' ? 'Yes' : status === 'no' ? 'No' : status === 'na' ? 'N/A' : '';
}

function formatDate(value: string) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return y && m && d ? `${d}-${m}-${y}` : value;
}

function statusText(field: StatusField) {
  const label = statusLabel(field.status);
  return [label, field.remarks.trim()].filter(Boolean).join(' - ') || '-';
}

function financialYearLabel(inspectionDate: string) {
  if (!inspectionDate) return '';
  const [y, m] = inspectionDate.split('-').map(Number);
  if (!y || !m) return '';
  const startYear = m >= 4 ? y : y - 1;
  return `${startYear}`;
}

export function FertilizerDealerInspection() {
  const navigate = useNavigate();
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo } = useToast();
  const [form, setForm] = useState<InspectionForm>(loadForm);
  const [drafts, setDrafts] = useState<DraftRecord[]>(loadDrafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [sameStorageAsSale, setSameStorageAsSale] = useState(false);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false });
  const [showPreview, setShowPreview] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.localStorage.setItem(FORM_KEY, JSON.stringify(form));
  }, [form]);

  const set = <K extends keyof InspectionForm>(key: K, value: InspectionForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setStatus = (key: keyof InspectionForm, patch: Partial<StatusField>) =>
    setForm((current) => ({ ...current, [key]: { ...(current[key] as StatusField), ...patch } }));
  const toggleSection = (id: number) => setOpenSections((current) => ({ ...current, [id]: !current[id] }));

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
    persistDrafts(next);
    setActiveDraftId(record.id);
    showSaved('Draft saved', name);
  };

  const loadDraft = (draft: DraftRecord) => {
    setForm({ ...initialForm(), ...draft.form });
    setActiveDraftId(draft.id);
    setShowDrafts(false);
    showLoaded('Draft loaded', draft.name);
  };

  const deleteDraft = (id: string) => {
    if (!window.confirm('Delete this draft?')) return;
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    persistDrafts(next);
    if (activeDraftId === id) setActiveDraftId(null);
    showDeleted('Draft deleted');
  };

  const resetForm = () => {
    if (!window.confirm('Reset the form? Unsaved entries will be lost.')) return;
    setForm(initialForm());
    setActiveDraftId(null);
    setError('');
    showReset('Form reset');
  };

  const openPreview = () => {
    const message = validate();
    setError(message);
    if (message) return;
    setShowPreview(true);
    showInfo('Preview ready');
  };

  const generatePdf = () => {
    const message = validate();
    setError(message);
    if (message) return;
    const doc = buildPdf(form);
    doc.save(`Fertilizer_Dealer_Inspection_${(form.dealerName || 'Dealer').replace(/[^a-z0-9]+/gi, '_')}_${form.inspectionDate}.pdf`);
    showSuccess('PDF downloaded');
  };

  const ureaDifference = useMemo(() => {
    const epos = parseFloat(form.ureaEposQty) || 0;
    const ground = parseFloat(form.ureaGroundQty) || 0;
    const diff = epos - ground;
    return { diff, status: diff === 0 ? 'No difference' : diff > 0 ? 'Shortage' : 'Excess' };
  }, [form.ureaEposQty, form.ureaGroundQty]);

  const salesTotals = useMemo(() => {
    const sum = (key: keyof SalesRow) => form.salesRows.reduce((acc, r) => acc + (parseFloat(r[key]) || 0), 0);
    const opening = sum('openingBalance');
    const receipt = sum('receipt');
    const sales = sum('sales');
    return { opening, receipt, total: opening + receipt, sales, closing: opening + receipt - sales };
  }, [form.salesRows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="relative mx-auto max-w-5xl p-4 pb-28 sm:p-6 lg:p-8">
        <div className="mb-5 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sky-600 shadow-sm ring-1 ring-white/20">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-800">Fertilizer inspection</p>
                <h1 className="text-lg font-black text-sky-900 sm:text-xl">Inspection proforma of fertilizer dealer</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/officer-toolkit')}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-300 bg-white/70 px-2 py-1.5 text-xs font-black text-sky-800 shadow-sm transition hover:bg-white hover:border-sky-500"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

        <div className="mb-5 grid grid-cols-3 gap-3">
          <InspectionTypeCard icon={Sprout} label="Seed" tone="emerald" onClick={() => navigate('/officer-toolkit/seed-dealer-inspection')} />
          <InspectionTypeCard icon={FlaskConical} label="Fertilizer" tone="sky" active />
          <InspectionTypeCard icon={Bug} label="Pesticide" tone="rose" />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <ActionButton onClick={saveDraft} icon={Save} tone="sky">Save draft</ActionButton>
          <ActionButton onClick={() => setShowDrafts(true)} icon={FolderOpen} tone="white">Drafts{drafts.length ? ` (${drafts.length})` : ''}</ActionButton>
          <ActionButton onClick={resetForm} icon={RotateCcw} tone="white">Reset</ActionButton>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Field label="Inspector name" value={form.inspectorName} onChange={(v) => set('inspectorName', v)} placeholder="Inspector full name" />
          <Field label="Designation" value={form.inspectorDesignation} onChange={(v) => set('inspectorDesignation', v)} options={DESIGNATION_OPTIONS} />
          <Field label="Office" value={form.inspectorOffice} onChange={(v) => set('inspectorOffice', v)} placeholder="Office address" />
        </div>

        <div className="space-y-4">
          <Section id={1} title="Dealer and inspection details" subtitle="Items 1 to 4" open={openSections[1]} onToggle={toggleSection}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="1. Date of inspection" type="date" value={form.inspectionDate} onChange={(v) => set('inspectionDate', v)} />
              <Field label="2. Name of the dealer" value={form.dealerName} onChange={(v) => set('dealerName', v)} placeholder="Firm / dealer name" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">3. License Details</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="3. License number" value={form.licenceNo} onChange={(v) => set('licenceNo', v)} placeholder="License number" />
                <Field label="3(a). Valid from" type="date" value={form.licenceValidFrom} onChange={(v) => set('licenceValidFrom', v)} />
                <Field label="3(b). Valid up to" type="date" value={form.licenceValidUpTo} onChange={(v) => set('licenceValidUpTo', v)} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">3. Address</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="3(a). Sale point address" textarea value={form.salePointAddress} onChange={(v) => { set('salePointAddress', v); if (sameStorageAsSale) set('storagePointAddress', v); }} placeholder="D.no, Village, Mandal" />
                <div>
                  <Field label="3(b). Storage point address" textarea value={form.storagePointAddress} onChange={(v) => { set('storagePointAddress', v); if (sameStorageAsSale) setSameStorageAsSale(false); }} placeholder="D.no, Village, Mandal" />
                  <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sameStorageAsSale}
                      onChange={(e) => {
                        setSameStorageAsSale(e.target.checked);
                        if (e.target.checked) set('storagePointAddress', form.salePointAddress);
                      }}
                      className="h-4 w-4 cursor-pointer accent-sky-600"
                    />
                    Same as sale point address
                  </label>
                </div>
              </div>
            </div>
            <Field label="4. Contact number of the dealer" type="tel" value={form.contactNumber} onChange={(v) => set('contactNumber', v)} placeholder="Mobile / landline number" />
          </Section>

          <Section id={2} title="mFMS and Digital Details" subtitle="Items 5 to 9" open={openSections[2]} onToggle={toggleSection}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="5. mFMS ID number" value={form.mfmsId} onChange={(v) => set('mfmsId', v)} placeholder="mFMS ID" />
              <Field label="6. e-Company name" value={form.eCompanyName} onChange={(v) => set('eCompanyName', v)} placeholder="e-Company name" />
              <Field label="7. QR code number" value={form.qrCodeNo} onChange={(v) => set('qrCodeNo', v)} placeholder="QR code number" />
              <Field label="8. Payment aggregator" value={form.paymentAggregator} onChange={(v) => set('paymentAggregator', v)} placeholder="Payment aggregator" />
              <Field label="9. Virtual payment address (VPA)" value={form.vpa} onChange={(v) => set('vpa', v)} placeholder="VPA / UPI ID" />
            </div>
          </Section>

          <Section id={3} title="Premises and stock verification" subtitle="Items 10 to 12" open={openSections[3]} onToggle={toggleSection}>
            <StatusInput label="10. Whether the sale and stock premises are the same as those mentioned in the license" field={form.premisesSameAsLicence} onChange={(p) => setStatus('premisesSameAsLicence', p)} remarksWhen="no" />
            <div>
              <p className="mb-1 text-xs font-bold text-slate-800 dark:text-slate-100">11. Stock position at the time of inspection. Details to be furnished.</p>
              <RowTable<StockRow>
                title="Stock position"
                rows={form.stockRows}
                onChange={(rows) => set('stockRows', rows)}
                empty={emptyStockRow}
                addLabel="Add stock details"
                columns={[
                  { key: 'fertilizer', label: 'Fertilizer', type: 'select', options: FERTILIZER_PRODUCTS, allowOther: true },
                  { key: 'company', label: 'Company' },
                  { key: 'grade', label: 'Grade' },
                  { key: 'openingBalance', label: 'Opening balance' },
                  { key: 'receipts', label: 'Receipts' },
                  { key: 'sales', label: 'Sales' },
                  { key: 'closingBalance', label: 'Closing balance' },
                ]}
              />
            </div>
            <StatusInput label="12. Whether the ground balance of stocks tallies with the stock register and ePOS, or whether there is any discrepancy" field={form.groundBalance} onChange={(p) => setStatus('groundBalance', p)} remarksWhen="no" />
            {form.groundBalance.status === 'no' && (
              <RowTable<DiscrepancyRow>
                title="Discrepancy details"
                rows={form.discrepancyRows}
                onChange={(rows) => set('discrepancyRows', rows)}
                empty={emptyDiscrepancy}
                addLabel="Add discrepancy"
                columns={[
                  { key: 'product', label: 'Product' },
                  { key: 'registerBalance', label: 'Stock register balance' },
                  { key: 'eposBalance', label: 'ePOS balance' },
                  { key: 'physicalBalance', label: 'Physical balance' },
                  { key: 'difference', label: 'Difference' },
                  { key: 'remarks', label: 'Remarks' },
                ]}
              />
            )}
          </Section>

          <Section id={4} title="Registers, invoices and purchase verification" subtitle="Items 13 to 17" open={openSections[4]} onToggle={toggleSection}>
            <StatusInput label="13. Whether the stock register and sales invoices are maintained properly. If not, give details." field={form.stockRegisterInvoices} onChange={(p) => setStatus('stockRegisterInvoices', p)} remarksWhen="no" />
            {form.stockRegisterInvoices.status === 'no' && (
              <Field label="Details of deficiency" textarea value={form.stockRegisterDeficiency} onChange={(v) => set('stockRegisterDeficiency', v)} placeholder="Describe the deficiency" />
            )}
            <StatusInput label="14. Whether the selling license number is mentioned on sales invoices" field={form.licenceNoOnInvoices} onChange={(p) => setStatus('licenceNoOnInvoices', p)} remarksWhen="no" />
            <StatusInput label="15. Whether the dealer purchases stocks from approved and authorised sources. Verify the purchase invoices." field={form.purchasesFromApprovedSources} onChange={(p) => setStatus('purchasesFromApprovedSources', p)} remarksWhen="no" />
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
            <StatusInput label="16. Whether the dealer has exhibited the price list as per the E.C. Act" field={form.priceListExhibited} onChange={(p) => setStatus('priceListExhibited', p)} remarksWhen="no" />
            <StatusInput label="17. Whether bills are being issued to consumers, duly mentioning the batch number and trade name of fertilizers" field={form.billsIssuedWithBatch} onChange={(p) => setStatus('billsIssuedWithBatch', p)} remarksWhen="no" />
          </Section>

          <Section id={5} title="Storage and statutory compliance" subtitle="Items 18 to 19" open={openSections[5]} onToggle={toggleSection}>
            <StatusInput label="18. Whether the stocks are stored according to the provisions of the Act and rules" field={form.stocksStoredAsPerAct} onChange={(p) => setStatus('stocksStoredAsPerAct', p)} remarksWhen="no" />
            <StatusInput label="19. Whether the dealer / distributor / manufacturer is submitting reports regularly to the licensing officer" field={form.reportsSubmitted} onChange={(p) => setStatus('reportsSubmitted', p)} remarksWhen="no" />
          </Section>

          <Section id={6} title="Urea stock and enforcement details" subtitle="Items 20 to 25" open={openSections[6]} onToggle={toggleSection}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">20. Urea stock as per ePOS machine</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Quantity" type="number" value={form.ureaEposQty} onChange={(v) => set('ureaEposQty', v)} placeholder="0" />
                  <Field label="Unit" value={form.ureaEposUnit} onChange={(v) => set('ureaEposUnit', v)} options={UNIT_OPTIONS} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">21. Urea stock as per ground balance</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Quantity" type="number" value={form.ureaGroundQty} onChange={(v) => set('ureaGroundQty', v)} placeholder="0" />
                  <Field label="Unit" value={form.ureaGroundUnit} onChange={(v) => set('ureaGroundUnit', v)} options={UNIT_OPTIONS} />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900/50 dark:bg-sky-950/20">
              <p className="mb-1 text-xs font-bold text-sky-800 dark:text-sky-200">Urea stock difference (ePOS − ground balance)</p>
              <p className="text-sm font-black text-sky-900 dark:text-sky-100">
                {ureaDifference.diff} {form.ureaEposUnit} — {ureaDifference.status}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-800 dark:text-slate-100">22. Details of samples drawn</p>
              <RowTable<SampleRow>
                title="Samples drawn"
                rows={form.sampleRows}
                onChange={(rows) => set('sampleRows', rows)}
                empty={emptySample}
                addLabel="Add sample"
                columns={[
                  { key: 'product', label: 'Fertilizer product', type: 'select', options: FERTILIZER_PRODUCTS, allowOther: true },
                  { key: 'company', label: 'Company' },
                  { key: 'grade', label: 'Grade' },
                  { key: 'batchNo', label: 'Batch number' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'unit', label: 'Unit', type: 'select', options: UNIT_OPTIONS },
                  { key: 'sampleDetails', label: 'Sample details' },
                ]}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-800 dark:text-slate-100">23. Any show-cause notices issued during this year</p>
              <StatusButtons value={form.showCauseIssued} onChange={(v) => set('showCauseIssued', v)} />
            </div>
            {form.showCauseIssued === 'yes' && (
              <RowTable<ShowCauseRow>
                title="Show-cause notices"
                rows={form.showCauseRows}
                onChange={(rows) => set('showCauseRows', rows)}
                empty={emptyShowCause}
                addLabel="Add show-cause notice"
                columns={[
                  { key: 'noticeNo', label: 'Notice number' },
                  { key: 'date', label: 'Date' },
                  { key: 'reason', label: 'Reason' },
                  { key: 'status', label: 'Current status' },
                  { key: 'remarks', label: 'Remarks' },
                ]}
              />
            )}
            <div>
              <p className="mb-1 text-xs font-bold text-slate-800 dark:text-slate-100">24. License suspension date</p>
              <StatusButtons value={form.licenceSuspended} onChange={(v) => set('licenceSuspended', v)} />
            </div>
            {form.licenceSuspended === 'yes' && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="24(a). Suspension date" type="date" value={form.suspensionDate} onChange={(v) => set('suspensionDate', v)} />
                <Field label="24(b). Suspension order number" value={form.suspensionOrderNo} onChange={(v) => set('suspensionOrderNo', v)} placeholder="Order number" />
                <Field label="24(c). Remarks" value={form.suspensionRemarks} onChange={(v) => set('suspensionRemarks', v)} placeholder="Remarks" />
              </div>
            )}
            {form.licenceSuspended === 'yes' && (
              <Field label="25. Reasons for suspension" textarea value={form.suspensionReasons} onChange={(v) => set('suspensionReasons', v)} placeholder="Reasons for suspension" />
            )}
          </Section>

          <Section id={7} title="Fertilizer sales and stock statement" subtitle="Sales from 1 April to date" open={openSections[7]} onToggle={toggleSection}>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Fertilizer sales from 1 April {financialYearLabel(form.inspectionDate)} to {formatDate(form.inspectionDate)}
            </p>
            <Field label="Unit" value={form.salesUnit} onChange={(v) => set('salesUnit', v)} options={UNIT_OPTIONS} />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-sky-50">
                    <th className="border border-slate-300 px-2 py-1 text-left font-bold">Sl. no.</th>
                    <th className="border border-slate-300 px-2 py-1 text-left font-bold">Product</th>
                    <th className="border border-slate-300 px-2 py-1 text-left font-bold">Opening balance</th>
                    <th className="border border-slate-300 px-2 py-1 text-left font-bold">Receipt</th>
                    <th className="border border-slate-300 px-2 py-1 text-left font-bold">Total stock</th>
                    <th className="border border-slate-300 px-2 py-1 text-left font-bold">Sales</th>
                    <th className="border border-slate-300 px-2 py-1 text-left font-bold">Closing balance</th>
                  </tr>
                </thead>
                <tbody>
                  {form.salesRows.map((row, index) => {
                    const opening = parseFloat(row.openingBalance) || 0;
                    const receipt = parseFloat(row.receipt) || 0;
                    const sales = parseFloat(row.sales) || 0;
                    const total = opening + receipt;
                    const closing = total - sales;
                    return (
                      <tr key={index}>
                        <td className="border border-slate-300 px-2 py-1 text-center font-semibold">{index + 1}</td>
                        <td className="border border-slate-300 px-2 py-1 font-semibold">{row.product}</td>
                        <td className="border border-slate-300 px-2 py-1"><input type="number" value={row.openingBalance} onChange={(e) => set('salesRows', form.salesRows.map((r, i) => (i === index ? { ...r, openingBalance: e.target.value } : r)))} className="w-full rounded border border-slate-200 px-1 py-0.5 text-xs" /></td>
                        <td className="border border-slate-300 px-2 py-1"><input type="number" value={row.receipt} onChange={(e) => set('salesRows', form.salesRows.map((r, i) => (i === index ? { ...r, receipt: e.target.value } : r)))} className="w-full rounded border border-slate-200 px-1 py-0.5 text-xs" /></td>
                        <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-bold">{total || ''}</td>
                        <td className="border border-slate-300 px-2 py-1"><input type="number" value={row.sales} onChange={(e) => set('salesRows', form.salesRows.map((r, i) => (i === index ? { ...r, sales: e.target.value } : r)))} className="w-full rounded border border-slate-200 px-1 py-0.5 text-xs" /></td>
                        <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-bold">{closing || ''}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-sky-100 font-black">
                    <td className="border border-slate-300 px-2 py-1 text-center" colSpan={2}>Total</td>
                    <td className="border border-slate-300 px-2 py-1">{salesTotals.opening || ''}</td>
                    <td className="border border-slate-300 px-2 py-1">{salesTotals.receipt || ''}</td>
                    <td className="border border-slate-300 px-2 py-1">{salesTotals.total || ''}</td>
                    <td className="border border-slate-300 px-2 py-1">{salesTotals.sales || ''}</td>
                    <td className="border border-slate-300 px-2 py-1">{salesTotals.closing || ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] font-semibold text-slate-400">Total stock and closing balance are calculated automatically.</p>
          </Section>

        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <ActionButton onClick={openPreview} icon={Eye} tone="purple">Preview</ActionButton>
          <ActionButton onClick={generatePdf} icon={Download} tone="sky">PDF</ActionButton>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          <Sprout className="h-3.5 w-3.5 text-sky-600" />
          <span className="bg-gradient-to-r from-sky-700 to-cyan-600 bg-clip-text text-[11px] font-black uppercase tracking-[0.35em] text-transparent">Agronix</span>
        </div>
      </div>

      {showDrafts && (
        <Modal title="Saved drafts" onClose={() => setShowDrafts(false)}>
          {drafts.length === 0 ? (
            <p className="text-sm font-semibold text-slate-500">No drafts saved yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {drafts.map((draft) => (
                <li key={draft.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{draft.name}</p>
                    <p className="text-xs text-slate-500">Saved {new Date(draft.savedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => loadDraft(draft)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-black text-white hover:bg-sky-700">Edit</button>
                    <button type="button" onClick={() => deleteDraft(draft.id)} className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-red-600 hover:bg-red-50" aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {showPreview && (
        <Modal title="Inspection preview" onClose={() => setShowPreview(false)} wide footer={<ActionButton onClick={generatePdf} icon={Download} tone="sky">Download PDF</ActionButton>}>
          <Preview form={form} ureaDifference={ureaDifference} salesTotals={salesTotals} />
        </Modal>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, icon: Icon, tone }: { children: React.ReactNode; onClick: () => void; icon: React.ElementType; tone: 'sky' | 'purple' | 'white' }) {
  const toneClass = {
    sky: 'bg-sky-600 text-white hover:bg-sky-700',
    purple: 'bg-purple-600 text-white hover:bg-purple-700',
    white: 'border border-sky-300 bg-white/80 text-sky-800 hover:bg-white',
  }[tone];
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black shadow-sm transition sm:text-sm ${toneClass}`}>
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function Section({ id, title, subtitle, open, onToggle, children }: { id: number; title: string; subtitle: string; open: boolean; onToggle: (id: number) => void; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200/60 bg-white/90 shadow-md backdrop-blur-sm dark:border-sky-800/50 dark:bg-slate-900/80">
      <button type="button" onClick={() => onToggle(id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-black text-white">{id}</span>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{title}</h2>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-sky-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="grid gap-3 border-t border-sky-100 px-4 py-4 dark:border-sky-900">{children}</div>}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'mb-0.5 block text-[11px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-300';

function Field({ label, value, onChange, type = 'text', textarea = false, placeholder = '', options, helper = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; placeholder?: string; options?: string[]; helper?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      ) : options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Select…</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      )}
      {helper && <span className="mt-0.5 block text-[10px] font-semibold text-slate-400 dark:text-slate-500">{helper}</span>}
    </label>
  );
}

function StatusButtons({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  const options: { value: Status; label: string; active: string }[] = [
    { value: 'yes', label: 'Yes', active: 'bg-emerald-600 text-white border-emerald-600' },
    { value: 'no', label: 'No', active: 'bg-red-600 text-white border-red-600' },
    { value: 'na', label: 'N/A', active: 'bg-slate-600 text-white border-slate-600' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(value === option.value ? '' : option.value)}
          className={`min-w-[80px] rounded-lg border px-3 py-1.5 text-xs font-black transition ${value === option.value ? option.active : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function InspectionTypeCard({ icon: Icon, label, tone, active = false, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: 'emerald' | 'sky' | 'rose'; active?: boolean; onClick?: () => void }) {
  const toneClass = {
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
    sky: 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-100',
    rose: 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-100',
  }[tone];
  const iconBg = {
    emerald: 'bg-emerald-600',
    sky: 'bg-sky-600',
    rose: 'bg-rose-600',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${active ? `${toneClass} shadow-md ring-1 ring-current/20` : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200'}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${active ? iconBg : 'bg-slate-400'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

function StatusInput({ label, field, onChange, remarksLabel = 'Remarks', remarksWhen = 'answered' }: { label: string; field: StatusField; onChange: (patch: Partial<StatusField>) => void; remarksLabel?: string; remarksWhen?: 'answered' | 'no' }) {
  const showRemarks = remarksWhen === 'no' ? field.status === 'no' : Boolean(field.status) && field.status !== 'na';
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <StatusButtons value={field.status} onChange={(status) => onChange(remarksWhen === 'no' && status !== 'no' ? { status, remarks: '' } : { status })} />
        {showRemarks && (
          <input value={field.remarks} onChange={(e) => onChange({ remarks: e.target.value })} placeholder={remarksLabel} className={`${inputClass} sm:flex-1`} />
        )}
      </div>
    </div>
  );
}

type Column<T> = { key: keyof T; label: string; type?: 'text' | 'select' | 'status'; options?: string[]; allowOther?: boolean };

function RowTable<T extends Record<string, string>>({ title, rows, onChange, empty, addLabel, columns }: { title: string; rows: T[]; onChange: (rows: T[]) => void; empty: () => T; addLabel: string; columns: Column<T>[] }) {
  const update = (index: number, key: keyof T, value: string) => onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</p>
        <button type="button" onClick={() => onChange([...rows, empty()])} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-black text-white hover:bg-sky-700">
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs font-semibold text-slate-500">No entries added.</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div key={index} className="relative rounded-lg border border-slate-200 bg-white p-3 pr-10 dark:border-slate-700 dark:bg-slate-900">
              <span className="absolute left-2 top-2 text-[10px] font-black text-slate-400">#{index + 1}</span>
              <button type="button" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="absolute right-2 top-2 rounded-md p-1 text-red-500 hover:bg-red-50" aria-label="Remove row">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {columns.map((column) => (
                  <label key={String(column.key)} className="block">
                    <span className={labelClass}>{column.label}</span>
                    {column.type === 'select' ? (
                      column.allowOther && row[column.key] === '__other__' ? (
                        <input value='' onChange={(e) => update(index, column.key, e.target.value)} placeholder='Enter product' autoFocus className={inputClass} />
                      ) : column.allowOther && row[column.key] && !(column.options ?? []).includes(row[column.key]) && row[column.key] !== '__other__' ? (
                        <div className="flex gap-1">
                          <input value={row[column.key]} onChange={(e) => update(index, column.key, e.target.value)} className={inputClass} />
                          <button type="button" onClick={() => update(index, column.key, '')} className="shrink-0 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-500 hover:bg-slate-50">List</button>
                        </div>
                      ) : (
                        <select value={row[column.key]} onChange={(e) => update(index, column.key, e.target.value)} className={inputClass}>
                          <option value="">Select…</option>
                          {(column.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                          {column.allowOther && <option value="__other__">Others</option>}
                        </select>
                      )
                    ) : column.type === 'status' ? (
                      <StatusButtons value={row[column.key] as Status} onChange={(v) => update(index, column.key, v)} />
                    ) : (
                      <input value={row[column.key]} onChange={(e) => update(index, column.key, e.target.value)} className={inputClass} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, wide = false, footer }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`flex max-h-[90vh] w-full flex-col rounded-2xl border border-sky-200/50 bg-white shadow-2xl dark:border-sky-800/50 dark:bg-slate-900 ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <h2 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700">
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-700">{footer}</div>}
      </div>
    </div>
  );
}

type PdfSubTable = { title: string; head: string[]; body: string[][] };

function buildRows(form: InspectionForm, ureaDifference: { diff: number; status: string }, salesTotals: { opening: number; receipt: number; total: number; sales: number; closing: number }): { items: string[][]; subTables: PdfSubTable[] } {
  const listOrNil = (rows: unknown[], label: string) => (rows.length ? `${rows.length} ${label} (see table below)` : 'Nil');

  const items: string[][] = [
    ['1', 'Date of inspection', formatDate(form.inspectionDate)],
    ['2', 'Name of the dealer', form.dealerName || '-'],
    ['3', 'License number', [form.licenceNo, form.licenceValidFrom && `Valid from: ${formatDate(form.licenceValidFrom)}`, form.licenceValidUpTo && `Valid up to: ${formatDate(form.licenceValidUpTo)}`].filter(Boolean).join(' - ') || '-'],
    ['3(a)', 'Sale point address', form.salePointAddress || '-'],
    ['3(b)', 'Storage point address', form.storagePointAddress || '-'],
    ['4', 'Contact number of the dealer', form.contactNumber || '-'],
    ['5', 'mFMS ID number', form.mfmsId || '-'],
    ['6', 'e-Company name', form.eCompanyName || '-'],
    ['7', 'QR code number', form.qrCodeNo || '-'],
    ['8', 'Payment aggregator', form.paymentAggregator || '-'],
    ['9', 'Virtual payment address (VPA)', form.vpa || '-'],
    ['10', 'Whether the sale and stock premises are the same as those mentioned in the license', statusText(form.premisesSameAsLicence)],
    ['11', 'Stock position at the time of inspection. Details to be furnished.', listOrNil(form.stockRows, 'product(s)')],
    ['12', 'Whether the ground balance of stocks tallies with the stock register and ePOS, or whether there is any discrepancy', `${statusText(form.groundBalance)}${form.groundBalance.status === 'no' && form.discrepancyRows.length ? `\n${listOrNil(form.discrepancyRows, 'discrepancy/ies')}` : ''}`],
    ['13', 'Whether the stock register and sales invoices are maintained properly. If not, give details.', `${statusText(form.stockRegisterInvoices)}${form.stockRegisterInvoices.status === 'no' && form.stockRegisterDeficiency ? `\nDeficiency: ${form.stockRegisterDeficiency}` : ''}`],
    ['14', 'Whether the selling license number is mentioned on sales invoices', statusText(form.licenceNoOnInvoices)],
    ['15', 'Whether the dealer purchases stocks from approved and authorised sources. Verify the purchase invoices.', `${statusText(form.purchasesFromApprovedSources)}${form.purchaseInvoiceRows.length ? `\n${listOrNil(form.purchaseInvoiceRows, 'invoice(s)')}` : ''}`],
    ['16', 'Whether the dealer has exhibited the price list as per the E.C. Act', statusText(form.priceListExhibited)],
    ['17', 'Whether bills are being issued to consumers, duly mentioning the batch number and trade name of fertilizers', statusText(form.billsIssuedWithBatch)],
    ['18', 'Whether the stocks are stored according to the provisions of the Act and rules', statusText(form.stocksStoredAsPerAct)],
    ['19', 'Whether the dealer / distributor / manufacturer is submitting reports regularly to the licensing officer', statusText(form.reportsSubmitted)],
    ['20', 'Urea stock as per ePOS machine', `${form.ureaEposQty || '-'} ${form.ureaEposUnit}`.trim()],
    ['21', 'Urea stock as per ground balance', `${form.ureaGroundQty || '-'} ${form.ureaGroundUnit}`.trim()],
    ['', 'Urea stock difference', `${ureaDifference.diff} ${form.ureaEposUnit} — ${ureaDifference.status}`],
    ['22', 'Details of samples drawn', listOrNil(form.sampleRows, 'sample(s)')],
    ['23', 'Any show-cause notices issued during this year', form.showCauseIssued === 'yes' ? listOrNil(form.showCauseRows, 'notice(s)') : form.showCauseIssued === 'no' ? 'No' : '-'],
    ['24', 'License suspension date', form.licenceSuspended === 'yes' ? [form.suspensionDate && formatDate(form.suspensionDate), form.suspensionOrderNo && `Order: ${form.suspensionOrderNo}`, form.suspensionRemarks].filter(Boolean).join(' - ') || 'Yes' : form.licenceSuspended === 'no' ? 'No' : '-'],
    ['25', 'Reasons for suspension', form.licenceSuspended === 'yes' ? form.suspensionReasons || '-' : '-'],
  ];

  const subTables: PdfSubTable[] = [];
  if (form.stockRows.length) subTables.push({ title: 'Item 11 - Stock position at the time of inspection', head: ['Fertilizer', 'Company', 'Grade', 'Opening balance', 'Receipts', 'Sales', 'Closing balance'], body: form.stockRows.map((r) => [r.fertilizer, r.company, r.grade, r.openingBalance, r.receipts, r.sales, r.closingBalance]) });
  if (form.groundBalance.status === 'no' && form.discrepancyRows.length) subTables.push({ title: 'Item 12 - Discrepancy details', head: ['Product', 'Stock register balance', 'ePOS balance', 'Physical balance', 'Difference', 'Remarks'], body: form.discrepancyRows.map((r) => [r.product, r.registerBalance, r.eposBalance, r.physicalBalance, r.difference, r.remarks]) });
  if (form.purchaseInvoiceRows.length) subTables.push({ title: 'Item 15 - Purchase invoice verification', head: ['Supplier name', 'Invoice number', 'Invoice date', 'Fertilizer product', 'Quantity', 'Remarks'], body: form.purchaseInvoiceRows.map((r) => [r.supplierName, r.invoiceNo, r.invoiceDate, r.product, r.quantity, r.remarks]) });
  if (form.sampleRows.length) subTables.push({ title: 'Item 22 - Samples drawn', head: ['Fertilizer product', 'Company', 'Grade', 'Batch number', 'Quantity', 'Unit', 'Sample details'], body: form.sampleRows.map((r) => [r.product, r.company, r.grade, r.batchNo, r.quantity, r.unit, r.sampleDetails]) });
  if (form.showCauseIssued === 'yes' && form.showCauseRows.length) subTables.push({ title: 'Item 23 - Show-cause notices', head: ['Notice number', 'Date', 'Reason', 'Current status', 'Remarks'], body: form.showCauseRows.map((r) => [r.noticeNo, r.date, r.reason, r.status, r.remarks]) });
  subTables.push({ title: `Fertilizer sales from 1 April ${financialYearLabel(form.inspectionDate)} to ${formatDate(form.inspectionDate)}`, head: ['Sl. no.', 'Product', 'Opening balance', 'Receipt', 'Total stock', 'Sales', 'Closing balance'], body: [...form.salesRows.map((r, i) => { const o = parseFloat(r.openingBalance) || 0; const rc = parseFloat(r.receipt) || 0; const s = parseFloat(r.sales) || 0; return [String(i + 1), r.product, r.openingBalance, r.receipt, String(o + rc), r.sales, String(o + rc - s)]; }), ['', 'Total', String(salesTotals.opening), String(salesTotals.receipt), String(salesTotals.total), String(salesTotals.sales), String(salesTotals.closing)]] });
  return { items, subTables };
}

function buildPdf(form: InspectionForm) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const bottom = pageHeight - 14;
  const ureaEpos = parseFloat(form.ureaEposQty) || 0;
  const ureaGround = parseFloat(form.ureaGroundQty) || 0;
  const ureaDiff = ureaEpos - ureaGround;
  const ureaStatus = ureaDiff === 0 ? 'No difference' : ureaDiff > 0 ? 'Shortage' : 'Excess';
  const salesTotals = { opening: 0, receipt: 0, total: 0, sales: 0, closing: 0 };
  form.salesRows.forEach((r) => { const o = parseFloat(r.openingBalance) || 0; const rc = parseFloat(r.receipt) || 0; const s = parseFloat(r.sales) || 0; salesTotals.opening += o; salesTotals.receipt += rc; salesTotals.total += o + rc; salesTotals.sales += s; salesTotals.closing += o + rc - s; });
  const { items, subTables } = buildRows(form, { diff: ureaDiff, status: ureaStatus }, salesTotals);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const fertTitle = 'Inspection proforma of fertilizer dealer';
  doc.text(fertTitle, pageWidth / 2, 16, { align: 'center' });
  const fertTitleWidth = doc.getTextWidth(fertTitle);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - fertTitleWidth / 2, 18, pageWidth / 2 + fertTitleWidth / 2, 18);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);

  autoTable(doc, {
    startY: 22,
    margin: { top: 16, left: margin, right: margin, bottom: 14 },
    rowPageBreak: 'avoid',
    head: [['No.', 'Particulars', 'Observation / Remarks']],
    body: items,
    styles: { font: 'times', fontSize: 9, cellPadding: 1.5, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0], valign: 'top' },
    headStyles: { fillColor: [254, 243, 199], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 78 }, 2: { cellWidth: pageWidth - margin * 2 - 90 } },
  });

  let y = (doc as any).lastAutoTable.finalY;
  for (const table of subTables) {
    if (y + 20 > bottom) {
      doc.addPage();
      y = 16;
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text(table.title, margin, y + 6);
    autoTable(doc, {
      startY: y + 8,
      margin: { top: 16, left: margin, right: margin, bottom: 14 },
      rowPageBreak: 'avoid',
      head: [table.head],
      body: table.body,
      styles: { font: 'times', fontSize: 8.5, cellPadding: 1.2, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
      headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
    });
    y = (doc as any).lastAutoTable.finalY;
  }

  if (y + 30 > bottom) {
    doc.addPage();
    y = 16;
  }
  const signatureY = y + 22;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('Signature of dealer and seal', margin, signatureY);
  doc.text('Signature of fertilizer inspector and seal', pageWidth - margin, signatureY, { align: 'right' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  if (form.dealerName.trim()) doc.text(`(${form.dealerName.trim()})`, margin, signatureY + 5);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(2, 132, 199);
    doc.text('AGRONIX', pageWidth - margin, pageHeight - 6, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
  return doc;
}

function Preview({ form, ureaDifference, salesTotals }: { form: InspectionForm; ureaDifference: { diff: number; status: string }; salesTotals: { opening: number; receipt: number; total: number; sales: number; closing: number } }) {
  const { items, subTables } = buildRows(form, ureaDifference, salesTotals);
  return (
    <div className="text-slate-900">
      <h3 className="mb-3 text-center text-base font-black">Inspection proforma of fertilizer dealer</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-sky-50">
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
                <tr className="bg-slate-100">{table.head.map((h) => <th key={h} className="border border-slate-400 px-2 py-1 text-left font-bold">{h}</th>)}</tr>
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
        <div>
          <p>Signature of dealer and seal</p>
          <p className="font-semibold">{form.dealerName}</p>
        </div>
        <div className="text-right">
          <p>Signature of fertilizer inspector and seal</p>
        </div>
      </div>
    </div>
  );
}

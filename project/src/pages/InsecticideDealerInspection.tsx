import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ClipboardCheck, Download, Eye, FolderOpen, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { addEmblemImageWatermark } from '../lib/pdfWatermark';


type Status = '' | 'yes' | 'no' | 'na';
type StatusField = { status: Status; remarks: string };

type VariationRow = { productName: string; brandName: string; batchNumber: string; bookStock: string; physicalStock: string; variation: string; remarks: string };
type DetainedRow = { productName: string; brandName: string; manufacturer: string; batchNumber: string; quantity: string; detentionReason: string };
type SeizureRow = { productName: string; brandName: string; manufacturer: string; batchNumber: string; quantity: string; value: string; reason: string };
type SampleRow = { tradeName: string; technicalName: string; manufacturer: string; batchNumber: string; quantity: string; date: string };

interface InspectionForm {
  inspectionDate: string;
  dealerName: string;
  licenceHolderName: string;
  licenceNo: string;
  sellingPointDoorNo: string;
  storagePointDoorNo: string;
  premisesSameAsLicence: StatusField;
  licenceFormIII: StatusField;
  licenceDisplayed: StatusField;
  stockPriceBoard: StatusField;
  stockReportUpdated: StatusField;
  stockBalanceTallied: StatusField;
  variationRows: VariationRow[];
  sellingUnlicensed: StatusField;
  licenceOnInvoices: StatusField;
  purchaserSignature: StatusField;
  purchaseAuthorized: StatusField;
  registerCertificate: StatusField;
  storedAsPerAct: StatusField;
  expiredSegregated: StatusField;
  stockReportsRegular: StatusField;
  formDFailedSince: string;
  detained: Status;
  detentionRows: DetainedRow[];
  rectifiableNature: string;
  majorOffenceCommitted: Status;
  seizureRows: SeizureRow[];
  samplesDrawn: Status;
  sampleRows: SampleRow[];
  remarks: string;
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

const FORM_KEY = 'tiryani-insecticide-inspection-form';
const DRAFTS_KEY = 'tiryani-insecticide-inspection-drafts';

const DESIGNATION_OPTIONS = [
  'Mandal Agriculture Officer & Insecticide Inspector',
  'Asst. Director of Agriculture & Insecticide Inspector',
  'District Agriculture Officer & Insecticide Inspector',
];

const emptyStatus = (): StatusField => ({ status: '', remarks: '' });
const emptyVariation = (): VariationRow => ({ productName: '', brandName: '', batchNumber: '', bookStock: '', physicalStock: '', variation: '', remarks: '' });
const emptyDetained = (): DetainedRow => ({ productName: '', brandName: '', manufacturer: '', batchNumber: '', quantity: '', detentionReason: '' });
const emptySeizure = (): SeizureRow => ({ productName: '', brandName: '', manufacturer: '', batchNumber: '', quantity: '', value: '', reason: '' });
const emptySample = (): SampleRow => ({ tradeName: '', technicalName: '', manufacturer: '', batchNumber: '', quantity: '', date: '' });

const initialForm = (): InspectionForm => ({
  inspectionDate: new Date().toISOString().slice(0, 10),
  dealerName: '',
  licenceHolderName: '',
  licenceNo: '',
  sellingPointDoorNo: '',
  storagePointDoorNo: '',
  premisesSameAsLicence: emptyStatus(),
  licenceFormIII: emptyStatus(),
  licenceDisplayed: emptyStatus(),
  stockPriceBoard: emptyStatus(),
  stockReportUpdated: emptyStatus(),
  stockBalanceTallied: emptyStatus(),
  variationRows: [],
  sellingUnlicensed: emptyStatus(),
  licenceOnInvoices: emptyStatus(),
  purchaserSignature: emptyStatus(),
  purchaseAuthorized: emptyStatus(),
  registerCertificate: emptyStatus(),
  storedAsPerAct: emptyStatus(),
  expiredSegregated: emptyStatus(),
  stockReportsRegular: emptyStatus(),
  formDFailedSince: '',
  detained: '',
  detentionRows: [],
  rectifiableNature: '',
  majorOffenceCommitted: '',
  seizureRows: [],
  samplesDrawn: '',
  sampleRows: [],
  remarks: '',
  inspectorName: '',
  inspectorDesignation: '',
  inspectorOffice: '',
});

function loadForm(): InspectionForm {
  try {
    const saved = window.localStorage.getItem(FORM_KEY);
    if (!saved) return initialForm();
    const parsed = JSON.parse(saved) as Partial<InspectionForm>;
    return { ...initialForm(), ...parsed };
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

export function InsecticideDealerInspection() {
  const navigate = useNavigate();
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo } = useToast();
  const [form, setForm] = useState<InspectionForm>(loadForm);
  const [drafts, setDrafts] = useState<DraftRecord[]>(loadDrafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
  const [sameStorageAsSale, setSameStorageAsSale] = useState(false);
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

  const generatePdf = async () => {
    const message = validate();
    setError(message);
    if (message) return;
    const doc = buildPdf(form);
    await addEmblemImageWatermark(doc);
    doc.save(`Insecticide_Dealer_Inspection_${(form.dealerName || 'Dealer').replace(/[^a-z0-9]+/gi, '_')}_${form.inspectionDate}.pdf`);
    showSuccess('PDF downloaded');
  };

  const summary = useMemo(() => {
    const statusFields: StatusField[] = [
      form.premisesSameAsLicence, form.licenceFormIII, form.licenceDisplayed, form.stockPriceBoard, form.stockReportUpdated, form.stockBalanceTallied,
      form.sellingUnlicensed, form.licenceOnInvoices, form.purchaserSignature, form.purchaseAuthorized,
      form.registerCertificate, form.storedAsPerAct, form.expiredSegregated, form.stockReportsRegular,
    ];
    const toggles: Status[] = [form.detained, form.majorOffenceCommitted, form.samplesDrawn];
    const textDone = [form.inspectionDate, form.dealerName].filter((v) => v.trim()).length
      + ([form.licenceNo, form.sellingPointDoorNo, form.storagePointDoorNo].every((v) => v.trim()) ? 1 : 0);
    const statusDone = statusFields.filter((f) => f.status !== '').length;
    const toggleDone = toggles.filter((s) => s !== '').length;
    const remarksDone = form.remarks.trim() ? 1 : 0;
    const all = [...statusFields.map((f) => f.status), ...toggles];
    return {
      total: 21,
      completed: textDone + statusDone + toggleDone + remarksDone,
      yes: all.filter((s) => s === 'yes').length,
      no: all.filter((s) => s === 'no').length,
      na: all.filter((s) => s === 'na').length,
      variations: form.variationRows.length,
      detained: form.detentionRows.length,
      seized: form.seizureRows.length,
      samples: form.samplesDrawn === 'yes' ? form.sampleRows.length : 0,
    };
  }, [form]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 dark:from-slate-950 dark:via-rose-950 dark:to-red-950">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="relative mx-auto max-w-5xl p-4 pb-28 sm:p-6 lg:p-8">
        <div className="mb-5 rounded-2xl border border-[#FECDD3] bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3] p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#BE123C] shadow-sm ring-1 ring-white/20">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9F1239]">Insecticide inspection</p>
                <h1 className="text-lg font-black text-[#881337] sm:text-xl">Pesticide dealer inspection form</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const idx = (window.history.state as { idx?: number } | null)?.idx;
                if (typeof idx === 'number' && idx > 0) navigate(-1);
                else navigate('/officer-toolkit/inspections-notices');
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#FDA4AF] bg-white/70 px-2 py-1.5 text-xs font-black text-[#9F1239] shadow-sm transition hover:bg-white hover:border-[#FB7185]"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

        <div className="mb-3 flex flex-wrap gap-2">
          <ActionButton onClick={saveDraft} icon={Save} tone="rose">Save draft</ActionButton>
          <ActionButton onClick={() => setShowDrafts(true)} icon={FolderOpen} tone="white">Drafts{drafts.length ? ` (${drafts.length})` : ''}</ActionButton>
          <ActionButton onClick={resetForm} icon={RotateCcw} tone="white">Reset</ActionButton>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Field label="Inspector name" value={form.inspectorName} onChange={(v) => set('inspectorName', v)} placeholder="Inspector full name" />
          <Field label="Designation" value={form.inspectorDesignation} onChange={(v) => set('inspectorDesignation', v)} options={DESIGNATION_OPTIONS} />
          <Field label="Office" value={form.inspectorOffice} onChange={(v) => set('inspectorOffice', v)} placeholder="Office address" />
        </div>

        <div className="space-y-4">
          <Section id={1} title="Dealer, License and Premises" subtitle="Items 1 to 6" open={openSections[1]} onToggle={toggleSection}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="1. Date of inspection" type="date" value={form.inspectionDate} onChange={(v) => set('inspectionDate', v)} />
              <Field label="2. Name of the Dealer/Firm" value={form.dealerName} onChange={(v) => set('dealerName', v)} placeholder="Dealer / firm name" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="3. License No" value={form.licenceNo} onChange={(v) => set('licenceNo', v)} placeholder="License number" />
            </div>
            <div className="grid gap-3">
              <Field label="3(a). Sale point address" textarea value={form.sellingPointDoorNo} onChange={(v) => { set('sellingPointDoorNo', v); if (sameStorageAsSale) set('storagePointDoorNo', v); }} placeholder="D.no, Village, Mandal" />
              <label className="-my-1 inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={sameStorageAsSale}
                  onChange={(e) => {
                    setSameStorageAsSale(e.target.checked);
                    if (e.target.checked) set('storagePointDoorNo', form.sellingPointDoorNo);
                  }}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-rose-600"
                />
                Same as sale point address
              </label>
              <Field label="3(b). Storage point address" textarea value={form.storagePointDoorNo} onChange={(v) => { set('storagePointDoorNo', v); if (sameStorageAsSale) setSameStorageAsSale(false); }} placeholder="D.no, Village, Mandal" />
            </div>
            <StatusInput label="4. Whether the sale and stock premises are the same as those mentioned in the license" field={form.premisesSameAsLicence} onChange={(p) => setStatus('premisesSameAsLicence', p)} remarksWhen="no" />
            <StatusInput label="5. Whether the License is in Form III" field={form.licenceFormIII} onChange={(p) => setStatus('licenceFormIII', p)} remarksWhen="no" />
            <StatusInput label="6. Whether the license is displayed or not" field={form.licenceDisplayed} onChange={(p) => setStatus('licenceDisplayed', p)} remarksWhen="no" />
          </Section>

          <Section id={2} title="Stock Verification" subtitle="Items 7 to 9" open={openSections[2]} onToggle={toggleSection}>
            <StatusInput label="7. Whether stock board and price list are exhibited" field={form.stockPriceBoard} onChange={(p) => setStatus('stockPriceBoard', p)} remarksWhen="no" />
            <StatusInput label="8. Whether the stock report is updated or not" field={form.stockReportUpdated} onChange={(p) => setStatus('stockReportUpdated', p)} remarksWhen="no" />
            <StatusInput label="9. Whether the stock balance is tallied with the stock register or not? If not, enclose the variation statement" field={form.stockBalanceTallied} onChange={(p) => setStatus('stockBalanceTallied', p)} remarksWhen="never" />
            {form.stockBalanceTallied.status === 'no' && (
              <RowTable<VariationRow>
                title="Variation statement"
                rows={form.variationRows}
                onChange={(rows) => set('variationRows', rows)}
                empty={emptyVariation}
                addLabel="Add product"
                columns={[
                  { key: 'productName', label: 'Trade name' },
                  { key: 'brandName', label: 'Technical name' },
                  { key: 'batchNumber', label: 'Batch number' },
                  { key: 'bookStock', label: 'Register stock' },
                  { key: 'physicalStock', label: 'Physical stock' },
                  { key: 'variation', label: 'Variation', compute: (r) => {
                    const physical = parseFloat(r.physicalStock);
                    const book = parseFloat(r.bookStock);
                    if (Number.isNaN(physical) || Number.isNaN(book)) return '';
                    return String(physical - book);
                  }, dependsOn: ['physicalStock', 'bookStock'] },
                  { key: 'remarks', label: 'Remarks' },
                ]}
              />
            )}
          </Section>

          <Section id={3} title="Compliance Verification" subtitle="Items 10 to 13" open={openSections[3]} onToggle={toggleSection}>
            <StatusInput label="10. Whether the dealer is selling insecticides other than those included in the license (PC's)" field={form.sellingUnlicensed} onChange={(p) => setStatus('sellingUnlicensed', p)} remarksWhen="yes" />
            <StatusInput label="11. Whether the license number is mentioned on the sales invoices/cash memos or not" field={form.licenceOnInvoices} onChange={(p) => setStatus('licenceOnInvoices', p)} remarksWhen="no" />
            <StatusInput label="12. Whether the bills are being issued to the farmer duly mentioning name of insecticide, batch number, expiry & farmer signature" field={form.purchaserSignature} onChange={(p) => setStatus('purchaserSignature', p)} remarksWhen="no" />
            <StatusInput label="13. Whether the dealer is purchasing stocks from approved and authorized sources (PC) or not (Verify Purchase invoices)" field={form.purchaseAuthorized} onChange={(p) => setStatus('purchaseAuthorized', p)} remarksWhen="no" />
          </Section>

          <Section id={4} title="Records, Storage and Reporting" subtitle="Items 14 to 17" open={openSections[4]} onToggle={toggleSection}>
            <StatusInput label="14. Whether the dealer has obtained a certificate confirming the pages in the stock register and sale bill books or not" field={form.registerCertificate} onChange={(p) => setStatus('registerCertificate', p)} remarksWhen="no" />
            <StatusInput label="15. Whether the pesticides are stored according to the provisions of the Insecticides Act and the Insecticides Rules" field={form.storedAsPerAct} onChange={(p) => setStatus('storedAsPerAct', p)} remarksWhen="no" />
            <StatusInput label="16. Whether expired chemicals are segregated or not" field={form.expiredSegregated} onChange={(p) => setStatus('expiredSegregated', p)} remarksWhen="no" />
            <StatusInput label="17. Whether the dealer is sending stock reports regularly to the Licensing officer or not" field={form.stockReportsRegular} onChange={(p) => { setStatus('stockReportsRegular', p); if (p.status && p.status !== 'no') set('formDFailedSince', ''); }} remarksWhen="no" remarksLabel="Remarks" extra={form.stockReportsRegular.status === 'no' ? (
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-wide text-slate-500 dark:text-slate-400">If no, since when has the dealer failed to submit Form D</span>
                <input type="date" value={form.formDFailedSince} onChange={(e) => set('formDFailedSince', e.target.value)} className={`${inputClass} sm:w-44`} />
              </label>
            ) : null} />
          </Section>

          <Section id={5} title="Detention and Seizure" subtitle="Items 18 and 19" open={openSections[5]} onToggle={toggleSection}>
            <div>
              <p className="mb-1 text-xs font-black tracking-wide text-slate-600 dark:text-slate-300">18. Whether any stocks are detained for rectifiable violations</p>
              <StatusButtons value={form.detained} onChange={(v) => set('detained', v)} />
            </div>
            {form.detained === 'yes' && (
              <>
                <RowTable<DetainedRow>
                  title="Stocks detained for rectifiable violations"
                  rows={form.detentionRows}
                  onChange={(rows) => set('detentionRows', rows)}
                  empty={emptyDetained}
                  addLabel="Add stock"
                  columns={[
                    { key: 'productName', label: 'Trade name' },
                    { key: 'brandName', label: 'Technical name' },
                    { key: 'manufacturer', label: 'Manufacturer' },
                    { key: 'batchNumber', label: 'Batch number' },
                    { key: 'quantity', label: 'Quantity' },
                    { key: 'detentionReason', label: 'Reason for detention' },
                  ]}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nature of rectifiable violation" value={form.rectifiableNature} onChange={(v) => set('rectifiableNature', v)} placeholder="Nature of violation" />
                </div>
              </>
            )}
            <div>
              <p className="mb-1 text-xs font-black tracking-wide text-slate-600 dark:text-slate-300">19. Whether any major offences have been committed (give details of seizure of stocks)</p>
              <StatusButtons value={form.majorOffenceCommitted} onChange={(v) => set('majorOffenceCommitted', v)} />
            </div>
            {form.majorOffenceCommitted === 'yes' && (
              <>
                <RowTable<SeizureRow>
                  title="Details of seizure of stocks"
                  rows={form.seizureRows}
                  onChange={(rows) => set('seizureRows', rows)}
                  empty={emptySeizure}
                  addLabel="Add seized stock"
                  columns={[
                    { key: 'productName', label: 'Trade name' },
                    { key: 'brandName', label: 'Technical name' },
                    { key: 'manufacturer', label: 'Manufacturer' },
                    { key: 'batchNumber', label: 'Batch number' },
                    { key: 'quantity', label: 'Quantity' },
                    { key: 'value', label: 'Value' },
                    { key: 'reason', label: 'Reason for seizure' },
                  ]}
                />
              </>
            )}
          </Section>

          <Section id={6} title="Samples and Remarks" subtitle="Items 20 and 21" open={openSections[6]} onToggle={toggleSection}>
            <div>
              <p className="mb-1 text-xs font-black tracking-wide text-slate-600 dark:text-slate-300">20. Details of sample drawn</p>
              <StatusButtons value={form.samplesDrawn} onChange={(v) => set('samplesDrawn', v)} />
            </div>
            {form.samplesDrawn === 'yes' && (
              <>
                <RowTable<SampleRow>
                  title="Sample details"
                  rows={form.sampleRows}
                  onChange={(rows) => set('sampleRows', rows)}
                  empty={emptySample}
                  addLabel="Add sample"
                  columns={[
                    { key: 'tradeName', label: 'Trade name' },
                    { key: 'technicalName', label: 'Technical name' },
                    { key: 'manufacturer', label: 'Manufacturer' },
                    { key: 'batchNumber', label: 'Batch no.' },
                    { key: 'quantity', label: 'Quantity' },
                    { key: 'date', label: 'Date' },
                  ]}
                />
              </>
            )}
            <Field label="21. Remarks" textarea value={form.remarks} onChange={(v) => set('remarks', v)} placeholder="Enter additional observations or remarks..." />
          </Section>
        </div>

        <div className="mt-5 rounded-2xl border border-rose-200/60 bg-white/90 p-3 shadow-md dark:border-rose-800/50 dark:bg-slate-900/80">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-rose-800">Inspection summary</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <SummaryChip label="Total items" value={summary.total} />
            <SummaryChip label="Completed" value={summary.completed} />
            <SummaryChip label="Yes" value={summary.yes} />
            <SummaryChip label="No" value={summary.no} />
            <SummaryChip label="N/A" value={summary.na} />
            <SummaryChip label="Variations" value={summary.variations} />
            <SummaryChip label="Detained" value={summary.detained} />
            <SummaryChip label="Seized" value={summary.seized} />
            <SummaryChip label="Samples" value={summary.samples} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-rose-100 pt-3 dark:border-rose-900/40">
            <ActionButton onClick={openPreview} icon={Eye} tone="purple">Preview</ActionButton>
            <ActionButton onClick={generatePdf} icon={Download} tone="rose">PDF</ActionButton>
          </div>
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
                    <button type="button" onClick={() => loadDraft(draft)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-700">Edit</button>
                    <button type="button" onClick={() => deleteDraft(draft.id)} className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-red-600 hover:bg-red-50" aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {showPreview && (
        <Modal title="Inspection preview" onClose={() => setShowPreview(false)} wide footer={<ActionButton onClick={generatePdf} icon={Download} tone="rose">Download PDF</ActionButton>}>
          <Preview form={form} />
        </Modal>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, icon: Icon, tone }: { children: React.ReactNode; onClick: () => void; icon: React.ElementType; tone: 'rose' | 'purple' | 'white' }) {
  const toneClass = {
    rose: 'bg-rose-600 text-white hover:bg-rose-700',
    purple: 'bg-purple-600 text-white hover:bg-purple-700',
    white: 'border border-[#FDA4AF] bg-white/80 text-[#9F1239] hover:bg-white',
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
    <div className="overflow-hidden rounded-2xl border border-rose-200/60 bg-white/90 shadow-md backdrop-blur-sm dark:border-rose-800/50 dark:bg-slate-900/80">
      <button type="button" onClick={() => onToggle(id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 text-sm font-black text-white">{id}</span>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{title}</h2>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-rose-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="grid gap-3 border-t border-rose-100 px-4 py-4 dark:border-rose-900">{children}</div>}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'mb-0.5 block text-[11px] font-black tracking-wide text-slate-600 dark:text-slate-300';

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

function StatusButtons({ value, onChange, allowNa = true }: { value: Status; onChange: (v: Status) => void; allowNa?: boolean }) {
  const options: { value: Status; label: string; active: string }[] = [
    { value: 'yes', label: 'Yes', active: 'bg-emerald-600 text-white border-emerald-600' },
    { value: 'no', label: 'No', active: 'bg-red-600 text-white border-red-600' },
    ...(allowNa ? [{ value: 'na' as Status, label: 'N/A', active: 'bg-slate-600 text-white border-slate-600' }] : []),
  ];
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(value === option.value ? '' : option.value)}
          className={`min-w-[64px] rounded-lg border px-3 py-1.5 text-xs font-black transition ${value === option.value ? option.active : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function StatusInput({ label, field, onChange, remarksLabel = 'Remarks', remarksWhen = 'answered', allowNa = true, extra }: { label: string; field: StatusField; onChange: (patch: Partial<StatusField>) => void; remarksLabel?: string; remarksWhen?: 'answered' | 'yes' | 'no' | 'never'; allowNa?: boolean; extra?: React.ReactNode }) {
  const showRemarks = remarksWhen === 'never' ? false : remarksWhen === 'answered' ? Boolean(field.status) && field.status !== 'na' : field.status === remarksWhen;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <StatusButtons value={field.status} onChange={(status) => onChange(remarksWhen !== 'answered' && status !== remarksWhen ? { status, remarks: '' } : { status })} allowNa={allowNa} />
        {extra}
        {showRemarks && (
          <input value={field.remarks} onChange={(e) => onChange({ remarks: e.target.value })} placeholder={remarksLabel} className={`${inputClass} sm:flex-1`} />
        )}
      </div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-rose-100 bg-rose-50/60 px-2 py-1.5 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
      <p className="text-sm font-black text-rose-700 dark:text-rose-300">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

type Column<T> = { key: keyof T; label: string; type?: 'text' | 'select' | 'status'; options?: string[]; allowOther?: boolean; compute?: (row: T) => string; dependsOn?: (keyof T)[] };

function RowTable<T extends Record<string, string>>({ title, rows, onChange, empty, addLabel, columns }: { title: string; rows: T[]; onChange: (rows: T[]) => void; empty: () => T; addLabel: string; columns: Column<T>[] }) {
  const update = (index: number, key: keyof T, value: string) => {
    const updated = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    const computeCols = columns.filter((c) => c.compute && (!c.dependsOn || c.dependsOn.includes(key)));
    if (computeCols.length) {
      updated[index] = computeCols.reduce((row, c) => ({ ...row, [c.key]: c.compute!(row) }), updated[index]);
    }
    onChange(updated);
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</p>
        <button type="button" onClick={() => onChange([...rows, empty()])} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-black text-white hover:bg-rose-700">
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
                      <select value={row[column.key]} onChange={(e) => update(index, column.key, e.target.value)} className={inputClass}>
                        <option value="">Select…</option>
                        {(column.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : column.compute ? (
                      <input value={row[column.key]} readOnly placeholder="Auto" className={`${inputClass} cursor-not-allowed bg-slate-100 dark:bg-slate-700/60`} />
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

function Modal({ title, onClose, children, wide = false, footer, fullScreen = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode; fullScreen?: boolean }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${fullScreen ? 'sm:p-4' : 'p-4'}`}>
      <div className={`flex w-full flex-col bg-white shadow-2xl dark:bg-slate-900 ${wide ? 'max-w-4xl' : 'max-w-lg'} ${fullScreen ? 'h-full max-h-none sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-rose-200/50 dark:sm:border-rose-800/50' : 'max-h-[90vh] rounded-2xl border border-rose-200/50 dark:border-rose-800/50'}`}>
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

function buildRows(form: InspectionForm): { items: string[][]; subTables: PdfSubTable[] } {
  const listOrNil = (rows: unknown[], label: string) => (rows.length ? `${rows.length} ${label} (see table below)` : 'Nil');
  const toggleText = (status: Status, rows: unknown[], label: string) =>
    status === 'yes' ? (rows.length ? listOrNil(rows, label) : 'Yes') : status === 'no' ? 'No' : '-';

  const items: string[][] = [
    ['1', 'Date of inspection', formatDate(form.inspectionDate)],
    ['2', 'Name of the Dealer/Firm', form.dealerName || '-'],
    ['3', 'License No', form.licenceNo || '-'],
    ['3(a)', 'Sale point address', form.sellingPointDoorNo || '-'],
    ['3(b)', 'Storage point address', form.storagePointDoorNo || '-'],
    ['4', 'Whether the sale and stock premises are the same as those mentioned in the license', statusText(form.premisesSameAsLicence)],
    ['5', 'Whether the License is in Form III', statusText(form.licenceFormIII)],
    ['6', 'Whether the license is displayed or not', statusText(form.licenceDisplayed)],
    ['7', 'Whether stock board and price list are exhibited', statusText(form.stockPriceBoard)],
    ['8', 'Whether the stock report is updated or not', statusText(form.stockReportUpdated)],
    ['9', 'Whether the stock balance is tallied with the stock register or not? If not, enclose the variation statement', `${statusText(form.stockBalanceTallied)}${form.stockBalanceTallied.status === 'no' && form.variationRows.length ? `\n${listOrNil(form.variationRows, 'variation(s)')}` : ''}`],
    ['10', "Whether the dealer is selling insecticides other than those included in the license (PC's)", statusText(form.sellingUnlicensed)],
    ['11', 'Whether the license number is mentioned on the sales invoices/cash memos or not', statusText(form.licenceOnInvoices)],
    ['12', 'Whether the bills are being issued to the farmer duly mentioning name of insecticide, batch number, expiry & farmer signature', statusText(form.purchaserSignature)],
    ['13', 'Whether the dealer is purchasing stocks from approved and authorized sources (PC) or not (Verify Purchase invoices)', statusText(form.purchaseAuthorized)],
    ['14', 'Whether the dealer has obtained a certificate confirming the pages in the stock register and sale bill books or not', statusText(form.registerCertificate)],
    ['15', 'Whether the pesticides are stored according to the provisions of the Insecticides Act and the Insecticides Rules', statusText(form.storedAsPerAct)],
    ['16', 'Whether expired chemicals are segregated or not', statusText(form.expiredSegregated)],
    ['17', 'Whether the dealer is sending stock reports regularly to the Licensing officer or not', [statusText(form.stockReportsRegular), form.stockReportsRegular.status === 'no' && form.formDFailedSince ? `Failed to submit Form D since ${formatDate(form.formDFailedSince)}` : ''].filter(Boolean).join(' - ')],
    ['18', 'Whether any stocks are detained for rectifiable violations', `${toggleText(form.detained, form.detentionRows, 'stock(s) detained')}${form.detained === 'yes' && form.rectifiableNature.trim() ? `\nNature: ${form.rectifiableNature.trim()}` : ''}`],
    ['19', 'Whether any major offences have been committed (give details of seizure of stocks)', form.majorOffenceCommitted === 'yes' ? (form.seizureRows.length ? `${form.seizureRows.length} seized stock(s)` : 'Yes') : form.majorOffenceCommitted === 'no' ? 'No' : form.majorOffenceCommitted === 'na' ? 'N/A' : '-'],
    ['20', 'Details of sample drawn', toggleText(form.samplesDrawn, form.sampleRows, 'sample(s)')],
    ['21', 'Remarks', form.remarks.trim() || '-'],
  ];

  const subTables: PdfSubTable[] = [];
  if (form.stockBalanceTallied.status === 'no' && form.variationRows.length) {
    subTables.push({
      title: 'Annexure - Variation statement (Item 9)',
      head: ['Sl. No.', 'Trade name', 'Technical name', 'Batch number', 'Register stock', 'Physical stock', 'Variation', 'Remarks'],
      body: form.variationRows.map((r, i) => [String(i + 1), r.productName, r.brandName, r.batchNumber, r.bookStock, r.physicalStock, r.variation, r.remarks]),
    });
  }
  if (form.detained === 'yes' && form.detentionRows.length) {
    subTables.push({
      title: 'Annexure - Details of stocks detained for rectifiable violations (Item 18)',
      head: ['Sl. No.', 'Trade name', 'Technical name', 'Manufacturer', 'Batch number', 'Quantity', 'Reason for detention'],
      body: form.detentionRows.map((r, i) => [String(i + 1), r.productName, r.brandName, r.manufacturer, r.batchNumber, r.quantity, r.detentionReason]),
    });
  }
  if (form.majorOffenceCommitted === 'yes' && form.seizureRows.length) {
    subTables.push({
      title: 'Annexure - Details of seizure of stocks (Item 19)',
      head: ['Sl. No.', 'Trade name', 'Technical name', 'Manufacturer', 'Batch number', 'Quantity', 'Value', 'Reason for seizure'],
      body: form.seizureRows.map((r, i) => [String(i + 1), r.productName, r.brandName, r.manufacturer, r.batchNumber, r.quantity, r.value, r.reason]),
    });
  }
  if (form.samplesDrawn === 'yes' && form.sampleRows.length) {
    subTables.push({
      title: 'Item 20 - Insecticide samples drawn',
      head: ['Sl. No.', 'Trade name', 'Technical name', 'Manufacturer', 'Batch no.', 'Quantity', 'Date'],
      body: form.sampleRows.map((r, i) => [String(i + 1), r.tradeName, r.technicalName, r.manufacturer, r.batchNumber, r.quantity, r.date]),
    });
  }
  return { items, subTables };
}

function buildPdf(form: InspectionForm) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const bottom = pageHeight - 14;
  const { items, subTables } = buildRows(form);

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const pdfTitle = 'Insecticide Dealer Inspection Report';
  doc.text(pdfTitle, pageWidth / 2, 16, { align: 'center' });
  const pdfTitleWidth = doc.getTextWidth(pdfTitle);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - pdfTitleWidth / 2, 18, pageWidth / 2 + pdfTitleWidth / 2, 18);
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
  const dealerLabel = 'Signature of dealer';
  doc.text(dealerLabel, margin, signatureY);
  const dealerCenterX = margin + doc.getTextWidth(dealerLabel) / 2;
  const signatureLabel = 'Signature of Insecticide Inspector';
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

function Preview({ form }: { form: InspectionForm }) {
  const { items, subTables } = buildRows(form);
  return (
    <div className="text-slate-900">
      <h3 className="mb-3 text-center text-base font-black">Insecticide Dealer Inspection Report</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-rose-50">
              <th className="border border-slate-400 px-2 py-1 text-left font-bold">No.</th>
              <th className="border border-slate-400 px-2 py-1 text-left font-bold">Particulars</th>
              <th className="border border-slate-400 px-2 py-1 text-left font-bold">Observation / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map(([no, label, value]) => (
              <tr key={no}>
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
        <div className="text-center">
          <p>Signature of dealer</p>
          {form.dealerName.trim() && <p className="font-normal italic">({form.dealerName.trim()})</p>}
        </div>
        <div className="text-center">
          <p>Signature of Insecticide Inspector</p>
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

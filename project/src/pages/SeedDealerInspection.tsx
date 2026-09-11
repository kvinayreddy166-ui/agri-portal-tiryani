import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, ChevronDown, ClipboardCheck, Download, Eye, FlaskConical, FolderOpen, Plus, RotateCcw, Save, Sprout, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastContainer, useToast } from '../components/ui/Toast';

type Status = '' | 'yes' | 'no' | 'na';
type StatusField = { status: Status; remarks: string };

type GroundBalanceRow = { crop: string; variety: string; lotNo: string; physicalStock: string; registerBalance: string };
type FormORow = { lotNo: string; verified: Status; discrepancies: string };
type DetentionRow = { crop: string; variety: string; lotNo: string; quantity: string; unit: string; remarks: string };
type SeizureRow = { crop: string; variety: string; lotNo: string; quantity: string; unit: string; reason: string };
type SampleRow = { crop: string; variety: string; lotNo: string; quantity: string; sampleType: string };
type MajorDefect = { checked: boolean; details: string; crop: string; cropOther: string; variety: string; lotNo: string; quantity: string };
type RectifiableDefect = { checked: boolean; remarks: string };

interface InspectionForm {
  inspectionDate: string;
  dealerName: string;
  storagePlace: string;
  salePlace: string;
  licenceNo: string;
  licenceValidity: string;
  premisesSameAsLicence: StatusField;
  premisesSuitable: StatusField;
  stockPriceBoard: StatusField;
  stockRegisterMaintained: StatusField;
  groundBalance: StatusField;
  groundBalanceRows: GroundBalanceRow[];
  containersLabelled: StatusField;
  formOVerified: StatusField;
  formORows: FormORow[];
  arrivalInformed: StatusField;
  formDSubmitted: StatusField;
  formDSinceWhen: string;
  billsIssued: StatusField;
  rectifiableDefects: RectifiableDefect[];
  detentionMade: Status;
  detentions: DetentionRow[];
  majorDefects: MajorDefect[];
  stockSeized: Status;
  seizures: SeizureRow[];
  samples: SampleRow[];
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

const FORM_KEY = 'tiryani-seed-inspection-form';
const DRAFTS_KEY = 'tiryani-seed-inspection-drafts';

const RECTIFIABLE_DEFECT_LABELS = [
  'Non-display of license at a conspicuous place',
  'Non-display of stock and price list',
  'Non-maintenance of book of accounts in the prescribed format',
  'Issuance of credit/cash bill in incomplete shape',
  'Conduct of business after expiry of license within the grace period',
];

const MAJOR_DEFECT_LABELS = [
  'Selling of seed not included in the license',
  'Improper/incorrect labelling',
  'Misrepresentation and misleading statements with exaggerated claims of yields',
  'Labelling with imaginary names of the product without there being such an authorised name',
  'Labelling with imaginary names of the product without there being such an authorised name as per the variety',
];

const UNIT_OPTIONS = ['kg', 'quintals', 'packets', 'bags'];
const SAMPLE_TYPE_OPTIONS = ['Purity, moisture & germination', 'BT protein', 'Genetic purity', 'Seed health', 'Complete analysis'];
const CROP_OPTIONS = ['Bajra', 'Bengalgram', 'Blackgram', 'Castor', 'Cotton', 'Cowpea', 'Greengram', 'Groundnut', 'Maize', 'Paddy', 'Redgram', 'Safflower', 'Sesamum', 'Sorghum', 'Soybean', 'Sunflower'];
const DESIGNATION_OPTIONS = [
  'Mandal Agriculture Officer & Seed Inspector',
  'Asst. Director of Agriculture & Seed Inspector',
  'District Agriculture Officer & Seed Inspector',
];

const emptyStatus = (): StatusField => ({ status: '', remarks: '' });
const emptyGroundRow = (): GroundBalanceRow => ({ crop: '', variety: '', lotNo: '', physicalStock: '', registerBalance: '' });
const emptyFormORow = (): FormORow => ({ lotNo: '', verified: '', discrepancies: '' });
const emptyDetention = (): DetentionRow => ({ crop: '', variety: '', lotNo: '', quantity: '', unit: 'kg', remarks: '' });
const emptySeizure = (): SeizureRow => ({ crop: '', variety: '', lotNo: '', quantity: '', unit: 'kg', reason: '' });
const emptySample = (): SampleRow => ({ crop: '', variety: '', lotNo: '', quantity: '', sampleType: SAMPLE_TYPE_OPTIONS[0] });

const initialForm = (): InspectionForm => ({
  inspectionDate: new Date().toISOString().slice(0, 10),
  dealerName: '',
  storagePlace: '',
  salePlace: '',
  licenceNo: '',
  licenceValidity: '',
  premisesSameAsLicence: emptyStatus(),
  premisesSuitable: emptyStatus(),
  stockPriceBoard: emptyStatus(),
  stockRegisterMaintained: emptyStatus(),
  groundBalance: emptyStatus(),
  groundBalanceRows: [],
  containersLabelled: emptyStatus(),
  formOVerified: emptyStatus(),
  formORows: [],
  arrivalInformed: emptyStatus(),
  formDSubmitted: emptyStatus(),
  formDSinceWhen: '',
  billsIssued: emptyStatus(),
  rectifiableDefects: RECTIFIABLE_DEFECT_LABELS.map(() => ({ checked: false, remarks: '' })),
  detentionMade: '',
  detentions: [],
  majorDefects: MAJOR_DEFECT_LABELS.map(() => ({ checked: false, details: '', crop: '', cropOther: '', variety: '', lotNo: '', quantity: '' })),
  stockSeized: '',
  seizures: [],
  samples: [],
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
      rectifiableDefects: RECTIFIABLE_DEFECT_LABELS.map((_, i) => parsed.rectifiableDefects?.[i] ?? base.rectifiableDefects[i]),
      majorDefects: MAJOR_DEFECT_LABELS.map((_, i) => parsed.majorDefects?.[i] ?? base.majorDefects[i]),
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

export function SeedDealerInspection() {
  const navigate = useNavigate();
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo } = useToast();
  const [form, setForm] = useState<InspectionForm>(loadForm);
  const [drafts, setDrafts] = useState<DraftRecord[]>(loadDrafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [sameSaleAsStorage, setSameSaleAsStorage] = useState(false);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
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

  const generatePdf = () => {
    const message = validate();
    setError(message);
    if (message) return;
    const doc = buildPdf(form);
    doc.save(`Seed_Dealer_Inspection_${(form.dealerName || 'Dealer').replace(/[^a-z0-9]+/gi, '_')}_${form.inspectionDate}.pdf`);
    showSuccess('PDF downloaded');
  };

  const checkedMajorDefects = useMemo(() => form.majorDefects.filter((d) => d.checked).length, [form.majorDefects]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="relative mx-auto max-w-5xl p-4 pb-28 sm:p-6 lg:p-8">
        <div className="mb-5 rounded-2xl border border-[#BBF7D0] bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0] p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#15803D] shadow-sm ring-1 ring-white/20">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#166534]">Seed inspection</p>
                <h1 className="text-lg font-black text-[#14532D] sm:text-xl">Inspection proforma of seed dealer / distributor</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/officer-toolkit')}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#86EFAC] bg-white/70 px-2 py-1.5 text-xs font-black text-[#166534] shadow-sm transition hover:bg-white hover:border-[#4ADE80]"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

        <div className="mb-5 grid grid-cols-3 gap-3">
          <InspectionTypeCard icon={Sprout} label="Seed" tone="emerald" active />
          <InspectionTypeCard icon={FlaskConical} label="Fertilizer" tone="amber" onClick={() => navigate('/officer-toolkit/fertilizer-dealer-inspection')} />
          <InspectionTypeCard icon={Bug} label="Pesticide" tone="rose" />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <ActionButton onClick={saveDraft} icon={Save} tone="emerald">Save draft</ActionButton>
          <ActionButton onClick={() => setShowDrafts(true)} icon={FolderOpen} tone="white">Drafts{drafts.length ? ` (${drafts.length})` : ''}</ActionButton>
          <ActionButton onClick={resetForm} icon={RotateCcw} tone="white">Reset</ActionButton>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Field label="Inspector name" value={form.inspectorName} onChange={(v) => set('inspectorName', v)} placeholder="Inspector full name" />
          <Field label="Designation" value={form.inspectorDesignation} onChange={(v) => set('inspectorDesignation', v)} options={DESIGNATION_OPTIONS} />
          <Field label="Office" value={form.inspectorOffice} onChange={(v) => set('inspectorOffice', v)} placeholder="Office address" />
        </div>

        <div className="space-y-4">
          <Section id={1} title="Dealer and premises" subtitle="Items 1 to 6" open={openSections[1]} onToggle={toggleSection}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="1. Date of inspection" type="date" value={form.inspectionDate} onChange={(v) => set('inspectionDate', v)} />
              <Field label="2. Name of the dealer" value={form.dealerName} onChange={(v) => set('dealerName', v)} placeholder="Firm / dealer name" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">3. Location and place of business</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="3(a). Storage" value={form.storagePlace} onChange={(v) => { set('storagePlace', v); if (sameSaleAsStorage) set('salePlace', v); }} placeholder="D.no, Village, Mandal" />
                <div>
                  <Field label="3(b). Sale" value={form.salePlace} onChange={(v) => { set('salePlace', v); if (sameSaleAsStorage) setSameSaleAsStorage(false); }} placeholder="D.no, Village, Mandal" />
                  <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sameSaleAsStorage}
                      onChange={(e) => {
                        setSameSaleAsStorage(e.target.checked);
                        if (e.target.checked) set('salePlace', form.storagePlace);
                      }}
                      className="h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                    />
                    Same as storage address
                  </label>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="4(a). Seed license no." value={form.licenceNo} onChange={(v) => set('licenceNo', v)} placeholder="License number" />
              <Field label="4(b). License validity" type="date" value={form.licenceValidity} onChange={(v) => set('licenceValidity', v)} />
            </div>
            <StatusInput label="5. Whether stock and sale premises are the same as mentioned in the license" field={form.premisesSameAsLicence} onChange={(p) => setStatus('premisesSameAsLicence', p)} remarksWhen="no" />
            <StatusInput label="6. Suitability of premises for stocking and sale" field={form.premisesSuitable} onChange={(p) => setStatus('premisesSuitable', p)} remarksWhen="no" />
          </Section>

          <Section id={2} title="Stock and register verification" subtitle="Items 7 to 11" open={openSections[2]} onToggle={toggleSection}>
            <StatusInput label="7. Whether stock and price board exhibited" field={form.stockPriceBoard} onChange={(p) => setStatus('stockPriceBoard', p)} remarksWhen="no" />
            <StatusInput label="8. Whether stock register maintained properly" field={form.stockRegisterMaintained} onChange={(p) => setStatus('stockRegisterMaintained', p)} remarksWhen="no" />
            <StatusInput label="9. Whether ground balance is tallying with the stock register (give lot-wise details separately)" field={form.groundBalance} onChange={(p) => setStatus('groundBalance', p)} remarksWhen="no" />
            {form.groundBalance.status === 'no' && (
              <RowTable<GroundBalanceRow>
                title="Lot-wise details"
                rows={form.groundBalanceRows}
                onChange={(rows) => set('groundBalanceRows', rows)}
                empty={emptyGroundRow}
                addLabel="Add lot"
                columns={[
                  { key: 'crop', label: 'Crop', type: 'select', options: CROP_OPTIONS, allowOther: true },
                  { key: 'variety', label: 'Variety' },
                  { key: 'lotNo', label: 'Lot number' },
                  { key: 'physicalStock', label: 'Physical stock' },
                  { key: 'registerBalance', label: 'Stock register balance' },
                ]}
              />
            )}
            <StatusInput label="10. Whether containers are labelled as per the provisions of the Seeds Act" field={form.containersLabelled} onChange={(p) => setStatus('containersLabelled', p)} remarksWhen="no" />
            <StatusInput label="11. Verify copy of Form No-11 issued by TSSOCA authorities for each of the certified lots" field={form.formOVerified} onChange={(p) => setStatus('formOVerified', p)} remarksLabel="Discrepancies / remarks" />
            {form.formOVerified.status === 'yes' && (
              <RowTable<FormORow>
                title="Certified lot details"
                rows={form.formORows}
                onChange={(rows) => set('formORows', rows)}
                empty={emptyFormORow}
                addLabel="Add certified lot"
                columns={[
                  { key: 'lotNo', label: 'Certified lot number' },
                  { key: 'verified', label: 'Form No-11 verified', type: 'status' },
                  { key: 'discrepancies', label: 'Discrepancies observed' },
                ]}
              />
            )}
          </Section>

          <Section id={3} title="Compliance verification" subtitle="Items 12 to 14" open={openSections[3]} onToggle={toggleSection}>
            <StatusInput label="12. Whether the dealer is informing arrivals of seeds before commencement of sale" field={form.arrivalInformed} onChange={(p) => setStatus('arrivalInformed', p)} remarksWhen="no" />
            <StatusInput label="13. Whether the dealer is submitting Form D regularly" field={form.formDSubmitted} onChange={(p) => setStatus('formDSubmitted', p)} remarksWhen="no" />
            {form.formDSubmitted.status === 'no' && (
              <Field label="If no, since when has the dealer failed to submit Form D" value={form.formDSinceWhen} onChange={(v) => set('formDSinceWhen', v)} placeholder="Month / year or date" />
            )}
            <StatusInput label="14. Whether the dealer is issuing proper bills to the farmer containing details of brand, lot no, price, validity, etc." field={form.billsIssued} onChange={(p) => setStatus('billsIssued', p)} remarksWhen="no" />
          </Section>

          <Section id={4} title="Defects and violations" subtitle="Items 15 and 17" open={openSections[4]} onToggle={toggleSection}>
            <p className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">15. Defects noticed which are rectifiable</p>
            <div className="grid gap-2">
              {RECTIFIABLE_DEFECT_LABELS.map((label, index) => {
                const item = form.rectifiableDefects[index];
                return (
                  <CheckRow
                    key={label}
                    label={label}
                    checked={item.checked}
                    onToggle={(checked) => set('rectifiableDefects', form.rectifiableDefects.map((d, i) => (i === index ? { ...d, checked } : d)))}
                  >
                    <Field label="Remarks" value={item.remarks} onChange={(v) => set('rectifiableDefects', form.rectifiableDefects.map((d, i) => (i === index ? { ...d, remarks: v } : d)))} />
                  </CheckRow>
                );
              })}
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
              17. Major defects noticed (details to be given){checkedMajorDefects ? ` - ${checkedMajorDefects} selected` : ''}
            </p>
            <div className="grid gap-2">
              {MAJOR_DEFECT_LABELS.map((label, index) => {
                const item = form.majorDefects[index];
                const update = (patch: Partial<MajorDefect>) => set('majorDefects', form.majorDefects.map((d, i) => (i === index ? { ...d, ...patch } : d)));
                return (
                  <CheckRow key={label} label={`${index + 1}. ${label}`} checked={item.checked} onToggle={(checked) => update({ checked })} tone="red">
                    <Field label="Details / description" textarea value={item.details} onChange={(v) => update({ details: v })} />
                    <div className="grid gap-2 sm:grid-cols-4">
                      <div>
                        <Field label="Crop" value={item.crop} onChange={(v) => update({ crop: v, cropOther: v === 'Other' ? item.cropOther : '' })} options={[...CROP_OPTIONS, 'Other']} />
                        {item.crop === 'Other' && (
                          <input value={item.cropOther} onChange={(e) => update({ cropOther: e.target.value })} placeholder="Enter crop" className={`${inputClass} mt-1`} autoFocus />
                        )}
                      </div>
                      <Field label="Variety" value={item.variety} onChange={(v) => update({ variety: v })} />
                      <Field label="Lot number" value={item.lotNo} onChange={(v) => update({ lotNo: v })} />
                      <Field label="Quantity" value={item.quantity} onChange={(v) => update({ quantity: v })} />
                    </div>
                  </CheckRow>
                );
              })}
            </div>
          </Section>

          <Section id={5} title="Detention and seizure" subtitle="Items 16 and 18" open={openSections[5]} onToggle={toggleSection}>
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">16. Detentions made, if any</p>
              <StatusButtons value={form.detentionMade} onChange={(v) => set('detentionMade', v)} />
            </div>
            {form.detentionMade === 'yes' && (
              <RowTable<DetentionRow>
                title="Detention details (variety, lot no., quantity detained)"
                rows={form.detentions}
                onChange={(rows) => set('detentions', rows)}
                empty={emptyDetention}
                addLabel="Add detention"
                columns={[
                  { key: 'crop', label: 'Crop', type: 'select', options: CROP_OPTIONS, allowOther: true },
                  { key: 'variety', label: 'Variety' },
                  { key: 'lotNo', label: 'Lot no.' },
                  { key: 'quantity', label: 'Quantity detained' },
                  { key: 'unit', label: 'Unit', type: 'select', options: UNIT_OPTIONS },
                  { key: 'remarks', label: 'Remarks' },
                ]}
              />
            )}
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">18. Was stock seized?</p>
              <StatusButtons value={form.stockSeized} onChange={(v) => set('stockSeized', v)} />
            </div>
            {form.stockSeized === 'yes' && (
              <RowTable<SeizureRow>
                title="Stock seized details"
                rows={form.seizures}
                onChange={(rows) => set('seizures', rows)}
                empty={emptySeizure}
                addLabel="Add seized stock"
                columns={[
                  { key: 'crop', label: 'Crop', type: 'select', options: CROP_OPTIONS, allowOther: true },
                  { key: 'variety', label: 'Variety' },
                  { key: 'lotNo', label: 'Lot number' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'unit', label: 'Unit', type: 'select', options: UNIT_OPTIONS },
                  { key: 'reason', label: 'Reason for seizure' },
                ]}
              />
            )}
          </Section>

          <Section id={6} title="Seed samples" subtitle="Item 19" open={openSections[6]} onToggle={toggleSection}>
            <RowTable<SampleRow>
              title="19. Details of seed samples drawn (crop / variety / lot no.)"
              rows={form.samples}
              onChange={(rows) => set('samples', rows)}
              empty={emptySample}
              addLabel="Add sample"
              columns={[
                { key: 'crop', label: 'Crop', type: 'select', options: CROP_OPTIONS, allowOther: true },
                { key: 'variety', label: 'Variety / hybrid' },
                { key: 'lotNo', label: 'Lot no.' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'sampleType', label: 'Sample type', type: 'select', options: SAMPLE_TYPE_OPTIONS },
              ]}
            />
          </Section>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <ActionButton onClick={openPreview} icon={Eye} tone="purple">Preview</ActionButton>
          <ActionButton onClick={generatePdf} icon={Download} tone="emerald">PDF</ActionButton>
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
                    <button type="button" onClick={() => loadDraft(draft)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700">Edit</button>
                    <button type="button" onClick={() => deleteDraft(draft.id)} className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-red-600 hover:bg-red-50" aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {showPreview && (
        <Modal title="Inspection preview" onClose={() => setShowPreview(false)} wide footer={<ActionButton onClick={generatePdf} icon={Download} tone="emerald">Download PDF</ActionButton>}>
          <Preview form={form} />
        </Modal>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, icon: Icon, tone }: { children: React.ReactNode; onClick: () => void; icon: React.ElementType; tone: 'emerald' | 'purple' | 'white' }) {
  const toneClass = {
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
    purple: 'bg-purple-600 text-white hover:bg-purple-700',
    white: 'border border-[#86EFAC] bg-white/80 text-[#166534] hover:bg-white',
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
    <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-white/90 shadow-md backdrop-blur-sm dark:border-emerald-800/50 dark:bg-slate-900/80">
      <button type="button" onClick={() => onToggle(id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-black text-white">{id}</span>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{title}</h2>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-emerald-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="grid gap-3 border-t border-emerald-100 px-4 py-4 dark:border-emerald-900">{children}</div>}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
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

function InspectionTypeCard({ icon: Icon, label, tone, active = false, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: 'emerald' | 'amber' | 'rose'; active?: boolean; onClick?: () => void }) {
  const toneClass = {
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
    amber: 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    rose: 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-100',
  }[tone];
  const iconBg = {
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
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

function CheckRow({ label, checked, onToggle, children, tone = 'amber' }: { label: string; checked: boolean; onToggle: (checked: boolean) => void; children: React.ReactNode; tone?: 'amber' | 'red' }) {
  const toneClass = tone === 'red' ? 'border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20' : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20';
  return (
    <div className={`rounded-xl border p-3 ${checked ? toneClass : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40'}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
      </label>
      {checked && <div className="mt-3 grid gap-2">{children}</div>}
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
        <button type="button" onClick={() => onChange([...rows, empty()])} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-black text-white hover:bg-emerald-700">
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
                        <input value='' onChange={(e) => update(index, column.key, e.target.value)} placeholder='Enter crop' autoFocus className={inputClass} />
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
      <div className={`flex max-h-[90vh] w-full flex-col rounded-2xl border border-emerald-200/50 bg-white shadow-2xl dark:border-emerald-800/50 dark:bg-slate-900 ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
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
  const rectifiable = form.rectifiableDefects
    .map((d, i) => (d.checked ? `- ${RECTIFIABLE_DEFECT_LABELS[i]}${d.remarks.trim() ? ` (${d.remarks.trim()})` : ''}` : ''))
    .filter(Boolean);
  const major = form.majorDefects
    .map((d, i) => {
      if (!d.checked) return '';
      const cropName = d.crop === 'Other' ? d.cropOther : d.crop;
      const parts = [d.details, cropName && `Crop: ${cropName}`, d.variety && `Variety: ${d.variety}`, d.lotNo && `Lot no.: ${d.lotNo}`, d.quantity && `Qty: ${d.quantity}`].filter((p) => p && p.trim());
      return `${i + 1}. ${MAJOR_DEFECT_LABELS[i]}${parts.length ? `\n   ${parts.join('; ')}` : ''}`;
    })
    .filter(Boolean);
  const listOrNil = (rows: unknown[], label: string) => (rows.length ? `${rows.length} ${label} (see table below)` : 'Nil');

  const items: string[][] = [
    ['1', 'Date of inspection', formatDate(form.inspectionDate)],
    ['2', 'Name of the dealer', form.dealerName || '-'],
    ['3', 'Location and place of business', ''],
    ['3(a)', 'Storage', form.storagePlace || '-'],
    ['3(b)', 'Sale', form.salePlace || '-'],
    ['4', 'Seed license no. and its validity', [form.licenceNo, form.licenceValidity && `Valid up to: ${formatDate(form.licenceValidity)}`].filter(Boolean).join(' - ') || '-'],
    ['5', 'Whether stock and sale premises are the same as mentioned in the license', statusText(form.premisesSameAsLicence)],
    ['6', 'Suitability of premises for stocking and sale', statusText(form.premisesSuitable)],
    ['7', 'Whether stock and price board exhibited', statusText(form.stockPriceBoard)],
    ['8', 'Whether stock register maintained properly', statusText(form.stockRegisterMaintained)],
    ['9', 'Whether ground balance is tallying with the stock register (lot-wise details given separately)', `${statusText(form.groundBalance)}${form.groundBalance.status === 'no' && form.groundBalanceRows.length ? `\n${listOrNil(form.groundBalanceRows, 'lot(s)')}` : ''}`],
    ['10', 'Whether containers are labelled as per the provisions of the Seeds Act', statusText(form.containersLabelled)],
    ['11', 'Verification of copy of Form No-11 issued by TSSOCA authorities for each of the certified lots; discrepancies', `${statusText(form.formOVerified)}${form.formORows.length ? `\n${listOrNil(form.formORows, 'certified lot(s)')}` : ''}`],
    ['12', 'Whether the dealer is informing arrivals of seeds before commencement of sale', statusText(form.arrivalInformed)],
    ['13', 'Whether the dealer is submitting Form D regularly; if not, since how long has he failed', `${statusText(form.formDSubmitted)}${form.formDSubmitted.status === 'no' && form.formDSinceWhen ? `\nSince: ${form.formDSinceWhen}` : ''}`],
    ['14', 'Whether the dealer is issuing proper bills to the farmer containing details of brand, lot no., price, validity, etc.', statusText(form.billsIssued)],
    ['15', 'Defects noticed which are rectifiable', rectifiable.length ? rectifiable.join('\n') : 'Nil'],
    ['16', 'Detentions made, if any (variety, lot no., quantity detained)', form.detentionMade === 'yes' ? listOrNil(form.detentions, 'detention(s)') : form.detentionMade === 'no' ? 'No' : form.detentionMade === 'na' ? 'N/A' : '-'],
    ['17', 'Major defects noticed (details)', major.length ? major.join('\n') : 'Nil'],
    ['18', 'Stock seized', form.stockSeized === 'yes' ? listOrNil(form.seizures, 'seizure(s)') : form.stockSeized === 'no' ? 'No' : form.stockSeized === 'na' ? 'N/A' : '-'],
    ['19', 'Details of seed samples drawn (crop / variety / lot no.)', listOrNil(form.samples, 'sample(s)')],
  ];

  const subTables: PdfSubTable[] = [];
  if (form.groundBalance.status === 'no' && form.groundBalanceRows.length) subTables.push({ title: 'Item 9 - Lot-wise ground balance details', head: ['Crop', 'Variety', 'Lot number', 'Physical stock', 'Stock register balance'], body: form.groundBalanceRows.map((r) => [r.crop, r.variety, r.lotNo, r.physicalStock, r.registerBalance]) });
  if (form.formOVerified.status === 'yes' && form.formORows.length) subTables.push({ title: 'Item 11 - Form No-11 certified lot details', head: ['Certified lot number', 'Form No-11 verified', 'Discrepancies observed'], body: form.formORows.map((r) => [r.lotNo, statusLabel(r.verified), r.discrepancies]) });
  if (form.detentionMade === 'yes' && form.detentions.length) subTables.push({ title: 'Item 16 - Detentions made', head: ['Crop', 'Variety', 'Lot no.', 'Quantity detained', 'Unit', 'Remarks'], body: form.detentions.map((r) => [r.crop, r.variety, r.lotNo, r.quantity, r.unit, r.remarks]) });
  if (form.stockSeized === 'yes' && form.seizures.length) subTables.push({ title: 'Item 18 - Stock seized', head: ['Crop', 'Variety', 'Lot number', 'Quantity', 'Unit', 'Reason for seizure'], body: form.seizures.map((r) => [r.crop, r.variety, r.lotNo, r.quantity, r.unit, r.reason]) });
  if (form.samples.length) subTables.push({ title: 'Item 19 - Seed samples drawn', head: ['Crop', 'Variety / hybrid', 'Lot no.', 'Quantity', 'Sample type'], body: form.samples.map((r) => [r.crop, r.variety, r.lotNo, r.quantity, r.sampleType]) });
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
  doc.setFontSize(13);
  const seedTitle = 'Inspection proforma of seed dealer / distributor';
  doc.text(seedTitle, pageWidth / 2, 16, { align: 'center' });
  const seedTitleWidth = doc.getTextWidth(seedTitle);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - seedTitleWidth / 2, 18, pageWidth / 2 + seedTitleWidth / 2, 18);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);

  autoTable(doc, {
    startY: 22,
    margin: { top: 16, left: margin, right: margin, bottom: 14 },
    rowPageBreak: 'avoid',
    head: [['No.', 'Particulars', 'Observation / Remarks']],
    body: items,
    styles: { font: 'times', fontSize: 9, cellPadding: 1.5, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0], valign: 'top' },
    headStyles: { fillColor: [220, 252, 231], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
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
  doc.text('Signature of the dealer', margin, signatureY);
  doc.text('Signature of the seed inspector', pageWidth - margin, signatureY, { align: 'right' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  if (form.dealerName.trim()) doc.text(`(${form.dealerName.trim()})`, margin, signatureY + 5);
  return doc;
}

function Preview({ form }: { form: InspectionForm }) {
  const { items, subTables } = buildRows(form);
  return (
    <div className="text-slate-900">
      <h3 className="mb-3 text-center text-base font-black">Inspection proforma of seed dealer / distributor</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-emerald-50">
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
        <div>
          <p>Signature of the dealer</p>
          <p className="font-semibold">{form.dealerName}</p>
        </div>
        <div className="text-right">
          <p>Signature of the seed inspector</p>
          <p className="font-semibold">{[form.inspectorName, form.inspectorDesignation, form.inspectorOffice].filter(Boolean).join(', ')}</p>
        </div>
      </div>
    </div>
  );
}

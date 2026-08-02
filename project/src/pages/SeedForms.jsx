import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, RotateCcw, Save, X } from 'lucide-react';
import { SeedInstructionModal } from '../components/ui/SeedInstructionModal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import {
  QUALIFICATION_OPTIONS,
  TELANGANA_DISTRICTS,
  SEED_DESIGNATION_OPTIONS,
  getMandalsForDistrict,
} from '../data/telanganaDistrictMandalData';
import { PopupHintWrapper } from '../components/PopupHint';

const STORAGE_KEY = 'tiryani-seed-forms-draft';
const DRAFTS_KEY = 'tiryani-seed-forms-named-drafts';
const LAST_GENERATED_KEY = 'tiryani-seed-forms-last-generated';
const DUPLICATE_WARNING_MESSAGE =
  'You are generating a file with the same previous sample/dealer details. Please verify whether new sample details or dealer details are required before downloading.';
const PDF_FONT = 'times';
const PDF_BODY_SIZE = 12.5;
const PDF_TITLE_SIZE = 16;
const PDF_SUBTITLE_SIZE = 14;
const FORM_II_COTTON_QUANTITY = '25 G * 3';

const cropOptions = ['Bajra', 'Bengalgram', 'Blackgram', 'Castor', 'Cotton', 'Cowpea', 'Greengram', 'Groundnut', 'Maize', 'Paddy', 'Redgram', 'Safflower', 'Sesamum', 'Sorghum', 'Soybean', 'Sunflower', 'Other'];
const natureOptions = ['Seed sample', 'Other'];

const cropQuantityMapping = {
  'Cotton': '250 Grams * 3',
  'Paddy': '400 Grams * 3',
  'Maize': '1000 Grams * 3',
  'Bajra': '150 Grams * 3',
  'Sorghum': '900 Grams * 3',
  'Safflower': '900 Grams * 3',
  'Blackgram': '1000 Grams * 3',
  'Cowpea': '1000 Grams * 3',
  'Bengalgram': '1000 Grams * 3',
  'Redgram': '1000 Grams * 3',
  'Soybean': '1000 Grams * 3',
  'Castor': '1000 Grams * 3',
  'Groundnut': '1000 Grams * 3',
  'Sunflower': '1000 Grams * 3',
  'Sesamum': '70 Grams * 3',
  'Greengram': '1000 Grams * 3',
};
const classOptions = ['Breeder Seed', 'Foundation Seed', 'Certified Seed', 'Truthfully Labelled Seed', 'Hybrid Seed', 'Other'];
const testOptions = ['Germination, Purity & Moisture Test', 'BT Protein Test', 'Genetic Purity Test', 'Seed Health Test', 'Complete Analysis', 'Other'];
const labOptions = [
  {
    id: 'seed-testing',
    label: 'Seed Testing Laboratory, Rajendranagar',
    value: 'The Asst. Director of Agriculture,\nSeed Testing Laboratory,\nRajendranagar,\nHyderabad - 500030.',
  },
  {
    id: 'dna-lab',
    label: 'DNA Finger Printing Lab, Old Malakpet',
    value: 'The Govt. Analyst/ADA,\nDNA Finger Printing Lab,\nOld Malakpet,\nHyderabad - 500036.',
  },
  { id: 'other', label: 'Other', value: '' },
];

const initialSeedForm = {
  officerName: '',
  designation: '',
  officeAddress: '',
  place: '',
  date: new Date().toISOString().slice(0, 10),
  serialNo: '',
  codeNo: '',
  collectionDate: new Date().toISOString().slice(0, 10),
  collectionPlace: '',
  nature: 'Seed sample',
  natureOther: '',
  crop: 'Paddy',
  cropOther: '',
  variety: '',
  lotNo: '',
  quantityDrawn: '',
  quantityInLot: '',
  seedClass: 'Truthfully Labelled Seed',
  seedClassOther: '',
  packingDate: '',
  sourceOfSupply: '',
  testRequired: 'Germination, Purity & Moisture Test',
  testRequiredOther: '',
  remarks: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  costDemanded: 'No',
  costPaid: 'Not Applicable',
  labId: 'seed-testing',
  customLabAddress: '',
  qualification: '',
  manualQualification: '',
  district: '',
  mandal: '',
  manualDistrict: '',
  manualMandal: '',
  placeManuallyEdited: false,
  collectionPlaceManuallyEdited: false,
};

export function SeedForms() {
  const [showInstructionModal, setShowInstructionModal] = useState(true);
  const [form, setForm] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const loaded = saved ? { ...initialSeedForm, ...JSON.parse(saved) } : initialSeedForm;
      // Ensure manual edit flags are initialized for old saved drafts
      return {
        ...loaded,
        placeManuallyEdited: loaded.placeManuallyEdited ?? false,
        collectionPlaceManuallyEdited: loaded.collectionPlaceManuallyEdited ?? false,
      };
    } catch {
      return initialSeedForm;
    }
  });
  const [message, setMessage] = useState('');
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState(() => loadSeedDrafts());
  const [duplicateAction, setDuplicateAction] = useState(null);
  const [highlightDetails, setHighlightDetails] = useState(false);
  const sampleDetailsRef = useRef(null);
  const dealerDetailsRef = useRef(null);
  const { toasts, removeToast, showSuccess, showInfo, showReset, showSaved, showDeleted, showLoaded } = useToast();

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const resolved = useMemo(() => resolveSeedValues(form), [form]);
  const isCottonCrop = resolved.crop === 'Cotton';

  const setField = (key, value) => {
    setForm((current) => {
      if (key === 'officerName') {
        const currentDraftName = draftName.trim();
        const previousOfficerName = String(current.officerName || '').trim();
        if (!currentDraftName || currentDraftName === previousOfficerName) {
          setDraftName(value.trim());
        }
      }
      if (key === 'crop') {
        const defaultQuantity = cropQuantityMapping[value] || '';
        return { ...current, crop: value, cropOther: '', quantityDrawn: defaultQuantity };
      }
      if (key === 'district') {
        // Reset manual edit flags when district changes
        return { ...current, district: value, mandal: '', manualDistrict: '', manualMandal: '', place: '', placeManuallyEdited: false, collectionPlaceManuallyEdited: false };
      }
      if (key === 'mandal') {
        // Only auto-populate place and collectionPlace if it has NEVER been set before (not just if currently empty)
        const hasNeverBeenSet = !current.placeManuallyEdited && !current.collectionPlaceManuallyEdited;
        if (hasNeverBeenSet && value) {
          const resolvedPlace = value === 'Others' ? current.manualMandal : value;
          // Auto-populate both place and collectionPlace for all designations
          return { ...current, mandal: value, manualMandal: '', place: resolvedPlace, collectionPlace: resolvedPlace };
        }
        return { ...current, mandal: value, manualMandal: '' };
      }
      if (key === 'manualMandal') {
        // Only auto-populate place and collectionPlace if it has NEVER been set before
        const hasNeverBeenSet = !current.placeManuallyEdited && !current.collectionPlaceManuallyEdited;
        if (hasNeverBeenSet && value) {
          // Auto-populate both place and collectionPlace for all designations
          return { ...current, manualMandal: value, place: value, collectionPlace: value };
        }
        return { ...current, manualMandal: value };
      }
      if (key === 'designation') {
        // When designation changes to ADA or Mandal Agriculture Officer, auto-populate place and collectionPlace if NEVER set before
        const resolvedMandal = current.mandal === 'Others' ? current.manualMandal : current.mandal;
        const isADA = value === 'Asst. Director of Agriculture';
        const isMandalAO = value === 'Mandal Agriculture Officer';
        const wasADA = current.designation === 'Asst. Director of Agriculture';
        const wasMandalAO = current.designation === 'Mandal Agriculture Officer';
        const hasNeverBeenSet = !current.placeManuallyEdited && !current.collectionPlaceManuallyEdited;
        // Auto-populate when switching to ADA or Mandal Agriculture Officer and place has never been set
        if ((isADA && !wasADA || isMandalAO && !wasMandalAO) && hasNeverBeenSet && resolvedMandal) {
          // Auto-populate both place and collectionPlace for both ADA and Mandal Agriculture Officer
          return { ...current, designation: value, place: resolvedMandal, collectionPlace: resolvedMandal };
        }
        return { ...current, designation: value };
      }
      if (key === 'qualification') {
        return { ...current, qualification: value, manualQualification: '' };
      }
      if (key === 'place') {
        // Mark as manually edited when user changes it (even if deleting)
        return { ...current, place: value, placeManuallyEdited: true };
      }
      if (key === 'collectionPlace') {
        // Mark as manually edited when user changes it (even if deleting)
        return { ...current, collectionPlace: value, collectionPlaceManuallyEdited: true };
      }
      if (key === 'date') {
        // Sync collectionDate with date
        return { ...current, date: value, collectionDate: value };
      }
      return { ...current, [key]: value };
    });
    setMessage('');
  };

  const saveDraft = () => {
    const name = draftName.trim();
    if (!name) {
      showInfo('No Draft Name', 'Please enter a draft name to save.');
      return;
    }
    const nextDrafts = upsertSeedDraft(savedDrafts, { name, form, updatedAt: Date.now() });
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setDraftName(name);
    setSavedDrafts(nextDrafts);
    showSaved('Draft Saved Successfully', 'Your draft has been saved successfully.');
  };

  const resetDraft = () => {
    if (!confirm('Reset seed form draft?')) return;
    setForm(initialSeedForm);
    window.localStorage.removeItem(STORAGE_KEY);
    showReset('Draft Reset Successfully', 'All entered data has been cleared successfully.');
  };

  const loadDraft = (name) => {
    const draft = savedDrafts.find((item) => item.name === name);
    if (!draft) return;
    setForm({ ...initialSeedForm, ...draft.form });
    setDraftName(draft.name);
    showLoaded('Draft Loaded Successfully', 'Your saved draft has been loaded successfully.');
  };

  const deleteDraft = () => {
    const name = draftName.trim();
    if (!name) {
      showInfo('No Draft Found', 'There is no saved draft to delete.');
      return;
    }
    if (!confirm(`Delete saved draft "${name}"?`)) return;
    const nextDrafts = savedDrafts.filter((item) => item.name !== name);
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setSavedDrafts(nextDrafts);
    setDraftName('');
    showDeleted('Draft Deleted Successfully', 'The saved draft has been deleted permanently.');
  };

  const buildValidatedPdf = async (kind) => {
    const error = validateSeedForm(form, kind);
    if (error) {
      setMessage(error);
      return null;
    }

    try {
      return await buildSeedPdf(kind, form);
    } catch (error) {
      console.error('Seed PDF generation failed:', error);
      showInfo('PDF Generation Failed', 'Please check the entered details and try again.');
      return null;
    }
  };

  const download = async (kind) => {
    const doc = await buildValidatedPdf(kind);
    if (!doc) return;
    try {
      downloadSeedDoc(doc, seedFileName(kind, form));
      rememberSeedGeneratedData(form);
      showSuccess('PDF Downloaded Successfully', seedFileName(kind, form));
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      const targetWindow = openBlankSeedPdfTab();
      openSeedDocInTab(doc, seedFileName(kind, form), targetWindow);
      rememberSeedGeneratedData(form);
      showInfo('Preview Opened', 'PDF opened in a new tab (download failed).');
    }
  };

  const generate = async (kind) => {
    if (isDuplicateSeedGeneration(form)) {
      setDuplicateAction({ type: 'download', kind });
      return;
    }
    await completeGenerate(kind);
  };

  const completePreview = async (kind) => {
    const targetWindow = openBlankSeedPdfTab();
    const doc = await buildValidatedPdf(kind);
    if (!doc) {
      targetWindow?.close();
      return;
    }
    openSeedDocInTab(doc, seedFileName(kind, form), targetWindow);
    rememberSeedGeneratedData(form);
    showInfo('Preview Opened', 'PDF preview opened in a new tab.');
  };

  const preview = async (kind) => {
    if (isDuplicateSeedGeneration(form)) {
      setDuplicateAction({ type: 'preview', kind });
      return;
    }
    await completePreview(kind);
  };

  const reviewDuplicateDetails = () => {
    setDuplicateAction(null);
    setHighlightDetails(true);
    sampleDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      dealerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 450);
    window.setTimeout(() => setHighlightDetails(false), 3500);
  };

  const downloadAnyway = async () => {
    const action = duplicateAction;
    setDuplicateAction(null);
    if (!action) return;
    if (action.type === 'preview') {
      await completePreview(action.kind);
    } else {
      await completeGenerate(action.kind);
    }
  };

  const resetSampleDetails = () => {
    setForm(prev => ({
      ...prev,
      serialNo: '',
      codeNo: '',
      collectionDate: new Date().toISOString().slice(0, 10),
      collectionPlace: '',
      nature: 'Seed sample',
      natureOther: '',
      crop: 'Paddy',
      cropOther: '',
      variety: '',
      lotNo: '',
      quantityDrawn: '',
      quantityInLot: '',
      seedClass: 'Truthfully Labelled Seed',
      seedClassOther: '',
      packingDate: '',
      sourceOfSupply: '',
      testRequired: 'Germination, Purity & Moisture Test',
      testRequiredOther: '',
      placeManuallyEdited: false,
      collectionPlaceManuallyEdited: false,
      remarks: '',
    }));
    setMessage('Sample details reset successfully.');
  };

  const resetDealerDetails = () => {
    setForm(prev => ({
      ...prev,
      dealerName: '',
      dealerAddress: '',
      premisesLocation: '',
      costDemanded: 'No',
      costPaid: 'Not Applicable',
    }));
    setMessage('Dealer details reset successfully.');
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <section className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex justify-end gap-1">
          <button
            type="button"
            onClick={saveDraft}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-800 bg-emerald-800 px-2.5 py-2 text-xs font-black text-white shadow-md hover:bg-emerald-900 hover:border-emerald-900"
            title="Save draft"
          >
            <Save className="h-4 w-4" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={resetDraft}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 bg-slate-600 px-2.5 py-2 text-xs font-black text-white shadow-md hover:bg-slate-700 hover:border-slate-700"
            title="Reset draft"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
      </div>

      <div className="mb-2 rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50/80 to-rose-50/80 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10">
            <Save className="h-3.5 w-3.5 text-orange-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-700">SAVED DRAFTS</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select
            value={draftName}
            onChange={(event) => loadDraft(event.target.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none backdrop-blur-sm transition-all ${
              draftName
                ? 'border-orange-400 bg-orange-50 text-orange-700 focus:border-orange-500 focus:bg-orange-100 focus:ring-2 focus:ring-orange-100/50'
                : 'border-orange-200 bg-white/90 text-slate-900 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100/50'
            }`}
            title={draftName || 'Load saved draft...'}
          >
            <option value="">Load saved draft...</option>
            {savedDrafts.map((draft) => (
              <option key={draft.name} value={draft.name} className={draftName === draft.name ? 'bg-orange-50 text-orange-700 font-bold' : ''}>
                {draft.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={deleteDraft}
            className="rounded-lg border border-red-200 bg-white/90 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 hover:border-red-300 transition-all backdrop-blur-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-3 rounded-lg border border-red-600 bg-white px-3 py-2 text-sm font-bold text-red-600">
          {message}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="INSPECTOR DETAILS" color="emerald">
          <Input label="INSPECTOR NAME" value={form.officerName} onChange={(value) => setField('officerName', value)} />
          <Select label="Qualification" value={form.qualification} onChange={(value) => setField('qualification', value)} options={QUALIFICATION_OPTIONS} />
          {form.qualification === 'Others' && <Input label="Enter qualification" value={form.manualQualification} onChange={(value) => setField('manualQualification', value)} />}
          <Select label="Designation" value={form.designation} onChange={(value) => setField('designation', value)} options={SEED_DESIGNATION_OPTIONS} />
          <Select label="District" value={form.district} onChange={(value) => setField('district', value)} options={TELANGANA_DISTRICTS.map(toOption)} />
          <Select label={form.designation === 'Asst. Director of Agriculture' ? 'Division' : 'Mandal'} value={form.mandal} onChange={(value) => setField('mandal', value)} options={form.district && form.district !== 'Others' ? getMandalsForDistrict(form.district).map(toOption) : []} />
          {form.district === 'Others' && <Input label="Enter district name" value={form.manualDistrict} onChange={(value) => setField('manualDistrict', value)} />}
          {form.mandal === 'Others' && <Input label="Enter mandal name" value={form.manualMandal} onChange={(value) => setField('manualMandal', value)} />}
          <Input label="Date" type="date" value={form.date} onChange={(value) => setField('date', value)} />
        </Card>

        <Card title="LABORATORY DETAILS" color="blue">
          <Select label="To Address / Laboratory" value={form.labId} onChange={(value) => setField('labId', value)} options={labOptions.map((item) => ({ label: item.label, value: item.id }))} />
          {form.labId === 'other' ? (
            <Input label="Custom laboratory address" value={form.customLabAddress} onChange={(value) => setField('customLabAddress', value)} textarea />
          ) : (
            <p className="whitespace-pre-line rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-600">{resolved.labAddress}</p>
          )}
          <PreviewCard title="Information Slip Logic" lines={resolved.crop === 'Cotton' ? ['Cotton selected: two slips will be generated.', '1. Germination, Purity & Moisture Test', '2. BT Protein Test'] : [`One slip: ${resolved.testRequired}`]} />
        </Card>

        <div ref={sampleDetailsRef} className={highlightDetails ? 'rounded-xl border-4 border-red-500' : ''}>
        <Card title="SAMPLE DETAILS" color="amber" onReset={resetSampleDetails}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Serial No. of sample" value={form.serialNo} onChange={(value) => setField('serialNo', value)} />
            <Input label="Code No. of sample" value={form.codeNo} onChange={(value) => setField('codeNo', value)} />
            <Input label="Date of collection / sampling" type="date" value={form.collectionDate} onChange={(value) => setField('collectionDate', value)} />
            <Input label="Place of collection" value={resolved.collectionPlace} onChange={(value) => setField('collectionPlace', value)} />
          </div>
          <SelectWithOther label="Nature of article submitted" valueKey="nature" otherKey="natureOther" form={form} setField={setField} options={natureOptions} />
          <div className="grid gap-2 sm:grid-cols-2">
            <SelectWithOther label="Crop" valueKey="crop" otherKey="cropOther" form={form} setField={setField} options={cropOptions} />
            <Input label="Variety" value={form.variety} onChange={(value) => setField('variety', value)} />
            <Input label="Lot No. of sample" value={form.lotNo} onChange={(value) => setField('lotNo', value)} />
            <Input label="Quantity of sample drawn" value={form.quantityDrawn} onChange={(value) => setField('quantityDrawn', value)} />
            <Input label="Quantity of sample in lot" value={form.quantityInLot} onChange={(value) => setField('quantityInLot', value)} />
            <SelectWithOther label="Class / Origin of seed" valueKey="seedClass" otherKey="seedClassOther" form={form} setField={setField} options={classOptions} />
            <Input label="Date of packing" type="date" value={form.packingDate} onChange={(value) => setField('packingDate', value)} />
          </div>
          <Input label="Source of supply" value={form.sourceOfSupply} onChange={(value) => setField('sourceOfSupply', value)} />
          <SelectWithOther label="Kind of test required" valueKey="testRequired" otherKey="testRequiredOther" form={form} setField={setField} options={testOptions} />
          <Input label="Remarks" value={form.remarks} onChange={(value) => setField('remarks', value)} textarea />
        </Card>
        </div>

        <div ref={dealerDetailsRef} className={highlightDetails ? 'rounded-xl border-4 border-red-500' : ''}>
        <Card title="DEALER DETAILS" color="maroon" onReset={resetDealerDetails}>
          <Input label="Dealer / Party name" value={form.dealerName} onChange={(value) => setField('dealerName', value)} />
          <label>
            <span className="mb-0.5 block text-[11px] font-black uppercase tracking-wide text-slate-600">Dealer / Party address</span>
            <PopupHintWrapper message="Enter only D.No. and Village/Town; Mandal and District will be auto-populated">
              <textarea rows={2} value={form.dealerAddress} onChange={(event) => setField('dealerAddress', event.target.value)} placeholder="village" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
            </PopupHintWrapper>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select label="Cost of sample demanded" value={form.costDemanded} onChange={(value) => setField('costDemanded', value)} options={['Yes', 'No'].map(toOption)} />
            <Select label="Cost paid" value={form.costPaid} onChange={(value) => setField('costPaid', value)} options={['Paid', 'Not Paid', 'Not Applicable'].map(toOption)} />
          </div>
        </Card>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/80 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-500/10">
            <Download className="h-3.5 w-3.5 text-green-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-green-700">PDF Generation</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {isCottonCrop && <PdfAction label="Form II" onPreview={() => preview('II')} onDownload={() => generate('II')} />}
          <PdfAction label="Form V" onPreview={() => preview('V')} onDownload={() => generate('V')} />
          <PdfAction label="Form VI Notice" onPreview={() => preview('VI')} onDownload={() => generate('VI')} />
          <PdfAction label="Form VIII" onPreview={() => preview('VIII')} onDownload={() => generate('VIII')} />
          <PdfAction label="Information Slip" onPreview={() => preview('SLIP')} onDownload={() => generate('SLIP')} />
          <PdfAction label="All Forms" onPreview={() => preview('ALL')} onDownload={() => generate('ALL')} primary />
        </div>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold leading-4 text-red-700">
          Note: Please update sample details and dealer details before generating a new file.
        </p>
      </div>

      {duplicateAction && (
        <DuplicateDownloadModal onReview={reviewDuplicateDetails} onContinue={downloadAnyway} onClose={() => setDuplicateAction(null)} />
      )}
      <SeedInstructionModal
        isOpen={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
      />
    </section>
    </>
  );
}

function Card({ title, children, color = 'slate', onReset }) {
  const colorStyles = {
    emerald: 'border-emerald-200 bg-emerald-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    maroon: 'border-red-700 bg-red-50/50',
    slate: 'border-slate-200 bg-slate-50/50',
  };
  
  const headerColors = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    maroon: 'text-red-800',
    slate: 'text-slate-700',
  };

  const iconButtonColors = {
    emerald: 'border-emerald-200 text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600',
    blue: 'border-blue-200 text-blue-400 hover:bg-blue-50 hover:text-blue-600',
    amber: 'border-amber-200 text-amber-400 hover:bg-amber-50 hover:text-amber-600',
    maroon: 'border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600',
    slate: 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600',
  };
  
  return (
    <div className={`rounded-lg border ${colorStyles[color]} bg-white p-3 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-black ${headerColors[color]}`}>{title}</h3>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${iconButtonColors[color]}`}
            title={`Reset ${title}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function PreviewCard({ title, lines }) {
  return (
    <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-2.5">
      <p className="text-xs font-black text-emerald-900">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-xs font-semibold text-emerald-800">{line}</p>
      ))}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', textarea = false, placeholder = '' }) {
  const className = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';
  return (
    <label>
      <span className="mb-0.5 block text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</span>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={className} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={className} />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      <span className="mb-0.5 block text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function SelectWithOther({ label, valueKey, otherKey, form, setField, options }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Select label={label} value={form[valueKey]} onChange={(value) => setField(valueKey, value)} options={options.map(toOption)} />
      {form[valueKey] === 'Other' && (
        <Input label={`${label} - Other`} value={form[otherKey]} onChange={(value) => setField(otherKey, value)} />
      )}
    </div>
  );
}

function PdfAction({ label, onPreview, onDownload, primary = false }) {
  return (
    <div className={`rounded-lg border p-2 ${primary ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black text-slate-800">{label}</p>
        {primary && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">All</span>}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={onDownload}
          className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-black ${
            primary ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>
    </div>
  );
}

function toOption(value) {
  return { label: value, value };
}

function resolveSeedValues(form) {
  const lab = labOptions.find((item) => item.id === form.labId) || labOptions[0];
  const fromPlace = String(form.place || '').trim();
  const resolvedMandal = form.mandal === 'Others' ? form.manualMandal : form.mandal;
  const resolvedDistrict = form.district === 'Others' ? form.manualDistrict : form.district;
  const resolvedQualification = form.qualification === 'Others' ? form.manualQualification : form.qualification;
  const officerNameWithQualification = form.officerName && resolvedQualification 
    ? `${form.officerName}, ${resolvedQualification}`
    : form.officerName;
  
  // Check if ADA is selected to determine whether to use Division or Mandal
  const isADA = form.designation === 'Asst. Director of Agriculture';
  const isMandalAO = form.designation === 'Mandal Agriculture Officer';
  const locationLabel = isADA ? 'Division' : 'Mandal';
  
  // When ADA is selected, use collectionPlace for place field (for Forms VI & VIII)
  // When Mandal Agriculture Officer is selected, use mandal value (fromPlace)
  // Otherwise use the auto-populated place value
  const resolvedPlace = isADA ? (form.collectionPlace || fromPlace) : (fromPlace || form.collectionPlace);
  
  return {
    ...form,
    place: resolvedPlace,
    collectionPlace: form.collectionPlace,
    crop: form.crop === 'Other' ? form.cropOther : form.crop,
    nature: form.nature === 'Other' ? form.natureOther : form.nature,
    seedClass: form.seedClass === 'Other' ? form.seedClassOther : form.seedClass,
    testRequired: form.testRequired === 'Other' ? form.testRequiredOther : form.testRequired,
    labAddress: form.labId === 'other' ? form.customLabAddress : lab.value,
    fromAddress: [officerNameWithQualification, form.designation, resolvedMandal ? `${resolvedMandal} ${locationLabel}` : '', resolvedDistrict].filter(Boolean).join('\n'),
    senderAddress: [form.designation, resolvedMandal ? `${resolvedMandal} ${locationLabel}` : '', resolvedDistrict].filter(Boolean).join('\n'),
  };
}

function isCottonSeedForm(form) {
  return resolveSeedValues(form).crop === 'Cotton';
}

function validateSeedForm(form, kind) {
  // Validation removed - users can preview/download PDFs even with empty fields
  return '';
}

async function buildSeedPdf(kind, form) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({ title: `Seed Form ${kind}`, creator: 'Tiryani Agriculture Portal' });

  if (kind === 'ALL') {
    if (isCottonSeedForm(form)) {
      drawSeedFormII(doc, form);
      doc.addPage();
    }
    drawSeedFormV(doc, form);
    doc.addPage();
    drawSeedFormVI(doc, form);
    doc.addPage();
    drawSeedFormVIII(doc, form);
    drawInfoSlips(doc, form, true);
    return doc;
  }

  if (kind === 'II') drawSeedFormII(doc, form);
  if (kind === 'V') drawSeedFormV(doc, form);
  if (kind === 'VI') drawSeedFormVI(doc, form);
  if (kind === 'VIII') drawSeedFormVIII(doc, form);
  if (kind === 'SLIP') drawInfoSlips(doc, form, false);
  return doc;
}

function drawSeedFormII(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'ENVIRONMENT (PROTECTION) RULES, 1986', 'FORM II (SEE RULE 8)', 'MEMORANDUM TO GOVERNMENT ANALYST');
  drawFromTo(doc, p, r);
  para(doc, p, 'The portion of sample described below is sent herewith for analysis under Rule 6 of the Environment (Protection) Rules, 1986.');
  richPara(doc, p, [{ text: 'The portion of sample has been marked by me with the following mark:', bold: true }]);
  details(doc, p, [
    ['1. Serial No. of the sample', r.serialNo],
    ['2. Code No. of the sample', r.codeNo],
    ['3. Date and place of collection', `${fmtDate(r.collectionDate)} - ${r.collectionPlace}`],
    ['4. Nature of article submitted', r.nature],
    ['5. Crop & Variety', `${r.crop} - ${r.variety}`],
    ['6. Lot No. of the sample', r.lotNo],
    ['7. Quantity of sample drawn', FORM_II_COTTON_QUANTITY],
    ['8. Name and designation of the person who sends the sample', r.fromAddress],
  ]);
  footer(doc, p, r, { compact: true });
}

function drawSeedFormV(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'FORM V', '', 'MEMORANDUM TO GOVERNMENT ANALYST');
  drawFromTo(doc, p, r);
  para(doc, p, 'The portion of the sample described below is sent herewith for analysis under Clause (b) of Sub Section (1) of Section 14 and Clauses (b) and (c) of Sub Section (2) of Section 15 of the Seeds Act, 1966.');
  richPara(doc, p, [{ text: 'The portion of the sample has been marked by me with the following mark.', bold: true }]);
  details(doc, p, [
    ['1. Serial No. of the sample', r.serialNo],
    ['2. Code No. of the sample', r.codeNo],
    ['3. Date and place of collection', `${fmtDate(r.collectionDate)} - ${r.collectionPlace}`],
    ['4. Nature of article submitted', r.nature],
    ['5. Crop & Variety', `${r.crop} - ${r.variety}`],
    ['6. Lot No. of the sample', r.lotNo],
    ['7. Quantity of sample drawn', r.quantityDrawn],
    ['8. Name and designation of the person who sends the sample', r.fromAddress],
  ]);
  para(doc, p, 'A copy of this memo and specimen impression of the seal used to seal the packet of samples is being sent separately by post.');
  footer(doc, p, r, { compact: true });
}

function drawSeedFormVI(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(PDF_TITLE_SIZE);
  doc.text('FORM VI', 105, p.y, { align: 'center' });
  p.y += 8;
  doc.setFontSize(PDF_SUBTITLE_SIZE);
  doc.text('FORM OF NOTICE', 105, p.y, { align: 'center' });
  const textWidth = doc.getTextWidth('FORM OF NOTICE');
  doc.line(105 - textWidth / 2, p.y + 2, 105 + textWidth / 2, p.y + 2);
  p.y += 18;

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(PDF_BODY_SIZE);
  doc.text('To', 20, p.y);
  p.y += 7;
  const dealerAddress = [r.dealerName, r.dealerAddress, r.place].filter(Boolean).join('\n');
  doc.text(doc.splitTextToSize(dealerAddress || '.......................................................', 170), 20, p.y);
  doc.setFont(PDF_FONT, 'normal');
  p.y += Math.max(24, doc.splitTextToSize(dealerAddress || '', 170).length * 6 + 8);

  const notice =
    'I hereby give you the notice of my intension to draw sample of Seed from the Stocks available at the above mentioned premises for the purpose of tests or analysis.';
  p.y += 8;
  doc.setFont(PDF_FONT, 'normal');
  doc.text(doc.splitTextToSize(notice, 170), 28, p.y);
  p.y += 38;

  doc.text(`Date : ${fmtDate(r.date) || '____ / ____ / ______'}`, 20, p.y);
  signatureRight(doc, Math.min(p.y + 16, 246), ['Seed Inspector/', 'Mandal Agriculture Officer']);
}

function drawSeedFormVIII(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'FORM VIII', '', 'DETAILS OF SAMPLES TAKEN');
  richPara(doc, p, [
    { text: 'I have this day ' },
    { text: fmtDate(r.collectionDate) || '____ / ____ / ______', bold: true },
    { text: ' taken from the premises of ' },
    { text: [r.dealerName, r.dealerAddress].filter(Boolean).join(', ') || '________________', bold: true },
    { text: ' situated at ' },
    { text: blank(r.place), bold: true },
    { text: ' Samples of Seeds specified below to have same tested / Analyzed by Seed Analyst.' },
  ]);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`Date: ${fmtDate(r.date) || '__________'}`, 28, p.y);
  p.y += 8;
  doc.text('Seed Inspector', 176, p.y, { align: 'right' });
  doc.setFont(PDF_FONT, 'normal');
  p.y += 16;
  details(doc, p, [
    ['1. Serial No. of the sample', r.serialNo],
    ['2. Code No. of the sample', r.codeNo],
    ['3. Date of collection', fmtDate(r.collectionDate)],
    ['4. Place of collection', r.collectionPlace],
    ['5. Nature of article submitted', r.nature],
    ['6. Lot No. of the sample', r.lotNo],
    ['7. Quantity of sample drawn', r.quantityDrawn],
    ['8. Crop', r.crop],
    ['9. Variety', r.variety],
    ['10. Class of Seed', r.seedClass],
    ['11. Date of Packing', fmtDate(r.packingDate)],
    ['12. Stock Position', r.quantityInLot],
    ['13. Source of Supply', r.sourceOfSupply],
  ], 78);
  field(doc, p, 'Whether Cost of Sample Demanded?', r.costDemanded, 78);
  field(doc, p, 'Whether Cost Paid', r.costPaid, 78);
  const signatureY = Math.min(Math.max(p.y + 8, 224), 242);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(['Signature of the party / Dealer', 'from whose premises samples taken', 'and payment made'], 20, signatureY);
  signatureRight(doc, signatureY, ['Seed Inspector/', 'Mandal Agriculture Officer']);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`Place: ${r.place || '__________'}`, 28, signatureY + 24);
  doc.text(`Date: ${fmtDate(r.date) || '__________'}`, 28, signatureY + 32);
}

function drawInfoSlips(doc, form, addPageBefore) {
  const r = resolveSeedValues(form);
  const tests = r.crop === 'Cotton' ? ['Germination, Purity & Moisture Test', 'BT Protein Test'] : [r.testRequired];
  tests.forEach((test, index) => {
    if (addPageBefore || index > 0) doc.addPage();
    drawInformationSlip(doc, {
      ...form,
      testRequired: test,
      testRequiredOther: '',
      quantityDrawn: cottonSlipQuantity(r.crop, test) || form.quantityDrawn,
      quantityInLot: form.quantityInLot,
    });
  });
}

function drawInformationSlip(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'INFORMATION TO ACCOMPANY THE SAMPLE', '', 'INFORMATION SLIP');
  p.y += 4;
  details(doc, p, [
    ['1. Date of sampling', fmtDate(r.collectionDate)],
    ["2. Sender's name", r.officerName],
    ['3. Sender address', r.senderAddress],
    ['4. Name of the Crop', r.crop],
    ['5. Name of the Variety', r.variety],
    ['6. Origin / Class of seed', r.seedClass],
    ['7. Lot No. of Sample', r.lotNo],
    ['8. Code No. of Sample', r.codeNo],
    ['9. Quantity of sample in lot', r.quantityInLot],
    ['10. Kind of test required', r.testRequired],
    ['11. Remarks', r.remarks],
  ]);
  signatureRight(doc, Math.min(p.y + 16, 252), ['Seed Inspector/', 'Mandal Agriculture Officer']);
}

function page(doc) {
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(PDF_BODY_SIZE);
  return { y: 20, margin: 20, width: 170 };
}

function title(doc, p, heading, subheading, titleText) {
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(PDF_TITLE_SIZE);
  doc.text(heading, 105, p.y, { align: 'center' });
  p.y += 8;
  if (subheading) {
    doc.setFontSize(PDF_BODY_SIZE);
    doc.text(subheading, 105, p.y, { align: 'center' });
    p.y += 8;
  }
  doc.setFontSize(PDF_SUBTITLE_SIZE);
  doc.text(titleText, 105, p.y, { align: 'center' });
  const textWidth = doc.getTextWidth(titleText);
  doc.line(105 - textWidth / 2, p.y + 2, 105 + textWidth / 2, p.y + 2);
  p.y += 14;
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(PDF_BODY_SIZE);
}

function drawFromTo(doc, p, r) {
  doc.setFont(PDF_FONT, 'bold');
  doc.text('From:', 20, p.y);
  doc.text('To:', 128, p.y);
  doc.text(doc.splitTextToSize(r.fromAddress || '________________', 78), 20, p.y + 7);
  doc.text(doc.splitTextToSize(r.labAddress || '________________', 78), 128, p.y + 7);
  doc.setFont(PDF_FONT, 'normal');
  p.y += 44;
}

function details(doc, p, rows, labelWidth = 82) {
  rows.forEach(([label, value]) => field(doc, p, label, value, labelWidth));
}

function field(doc, p, label, value, labelWidth = 82) {
  const x = p.margin;
  const valueX = x + labelWidth + 4;
  const width = 190 - valueX;
  const labelLines = doc.splitTextToSize(label, labelWidth);
  const valueLines = doc.splitTextToSize(blank(value), width);
  const lineHeight = 7;
  const height = Math.max(labelLines.length, valueLines.length) * lineHeight + 2;
  if (p.y + height > 250) {
    doc.addPage();
    p.y = 20;
  }
  doc.setFont(PDF_FONT, 'normal');
  doc.text(labelLines, x, p.y);
  doc.text(':', x + labelWidth, p.y);
  doc.text(valueLines, valueX, p.y);
  p.y += height;
}

function para(doc, p, value) {
  const lines = doc.splitTextToSize(value, p.width);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(lines, 20, p.y);
  p.y += lines.length * 7 + 4;
}

function richPara(doc, p, segments) {
  const xStart = 20;
  const maxX = xStart + p.width;
  const lineHeight = 7;
  let x = xStart;
  let y = p.y;

  segments.forEach((segment) => {
    const parts = String(segment.text || '').split(/(\s+)/).filter((part) => part.length > 0);
    doc.setFont(PDF_FONT, segment.bold ? 'bold' : 'normal');

    parts.forEach((part) => {
      const width = doc.getTextWidth(part);
      if (!/^\s+$/.test(part) && x + width > maxX) {
        y += lineHeight;
        x = xStart;
      }
      doc.text(part, x, y);
      x += width;
    });
  });

  doc.setFont(PDF_FONT, 'normal');
  p.y = y + lineHeight + 4;
}

function footer(doc, p, r, options = {}) {
  const y = options.compact ? Math.min(Math.max(p.y + 10, 224), 246) : 250;
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`Date: ${fmtDate(r.date) || '__________'}`, 24, y);
  doc.text(`Place: ${r.place || '__________'}`, 24, y + 8);
  signatureRight(doc, y, ['Seed Inspector/', 'Mandal Agriculture Officer']);
}

function signatureRight(doc, y, label) {
  doc.setFont(PDF_FONT, 'bold');
  const labelLines = Array.isArray(label) ? label : [label];
  doc.text(['Signature', ...labelLines], 162, y, { align: 'center' });
  doc.setFont(PDF_FONT, 'normal');
}

function fmtDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function blank(value) {
  return String(value || '').trim() || '________________';
}

function cottonSlipQuantity(crop, test) {
  if (crop !== 'Cotton') return '';
  if (test === 'BT Protein Test') return '25 grams * 3';
  if (test === 'Germination, Purity & Moisture Test') return '250 grams * 3';
  return '';
}

function openBlankSeedPdfTab() {
  const targetWindow = window.open('', '_blank');
  if (targetWindow) {
    targetWindow.opener = null;
    targetWindow.document.title = 'Preparing PDF...';
    targetWindow.document.body.innerHTML = '<p style="font-family: system-ui; padding: 24px;">Preparing PDF...</p>';
  }
  return targetWindow;
}

function openSeedDocInTab(doc, fileName, targetWindow) {
  const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = blobUrl;
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function downloadSeedDoc(doc, fileName) {
  const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function seedFileName(kind, form) {
  const date = fmtDate(form.date || form.collectionDate).replace(/\//g, '-');
  return `Seed_Form_${kind}_${form.codeNo || 'CodeNo'}_${date || 'Date'}.pdf`;
}

function loadSeedDrafts() {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSeedDraftName(name, form) {
  const fallback = form.officerName || form.codeNo || form.dealerName;
  return (name.trim() || fallback || `Draft ${new Date().toLocaleString('en-IN')}`).slice(0, 80);
}

function upsertSeedDraft(drafts, draft) {
  return [draft, ...drafts.filter((item) => item.name !== draft.name)].slice(0, 30);
}

function seedGenerationSnapshot(form) {
  const resolved = resolveSeedValues(form);
  return stableSeedString({
    serialNo: resolved.serialNo,
    codeNo: resolved.codeNo,
    collectionDate: resolved.collectionDate,
    collectionPlace: resolved.collectionPlace,
    nature: resolved.nature,
    crop: resolved.crop,
    variety: resolved.variety,
    lotNo: resolved.lotNo,
    quantityDrawn: resolved.quantityDrawn,
    quantityInLot: resolved.quantityInLot,
    seedClass: resolved.seedClass,
    packingDate: resolved.packingDate,
    sourceOfSupply: resolved.sourceOfSupply,
    dealerName: resolved.dealerName,
    dealerAddress: resolved.dealerAddress,
    premisesLocation: resolved.premisesLocation,
    costDemanded: resolved.costDemanded,
    costPaid: resolved.costPaid,
  });
}

function isDuplicateSeedGeneration(form) {
  try {
    return window.localStorage.getItem(LAST_GENERATED_KEY) === seedGenerationSnapshot(form);
  } catch {
    return false;
  }
}

function rememberSeedGeneratedData(form) {
  try {
    window.localStorage.setItem(LAST_GENERATED_KEY, seedGenerationSnapshot(form));
  } catch {
    // Duplicate warning is best-effort only.
  }
}

function stableSeedString(value) {
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = String(value[key] ?? '').trim();
        return acc;
      }, {})
  );
}

function DuplicateDownloadModal({ onReview, onContinue, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-5 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-wide text-amber-700">Duplicate details warning</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{DUPLICATE_WARNING_MESSAGE}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onReview} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
            Review/Edit Details
          </button>
          <button type="button" onClick={onContinue} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800">
            Download Anyway
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-red-700 px-3 py-2 text-red-800 hover:bg-red-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default SeedForms;

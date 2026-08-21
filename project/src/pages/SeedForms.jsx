import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, FileText, RotateCcw, Save, X } from 'lucide-react';
import { SeedInstructionModal } from '../components/ui/SeedInstructionModal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { SeedCoveringLetterModal } from '../components/forms/SeedCoveringLetterModal';
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
const COVERING_LETTER_QUEUE_KEY = 'tiryani-seed-covering-letter-queue';
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
const testOptions = ['Purity, Moisture & Germination Test', 'BT Protein Test', 'Genetic Purity Test', 'Seed Health Test', 'Complete Analysis', 'Other'];
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
  producedPackedBy: '',
  testRequired: 'Purity, Moisture & Germination Test',
  testRequiredOther: '',
  remarks: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  costDemanded: 'No',
  costPaid: 'Not Applicable',
  labId: '',
  customLabAddress: '',
  qualification: '',
  manualQualification: '',
  district: '',
  mandal: '',
  manualDistrict: '',
  manualMandal: '',
  pinCode: '',
  placeManuallyEdited: false,
  collectionPlaceManuallyEdited: false,
  sourceOfSupplyManuallyEdited: false,
  // Covering Letter Details
  financialYear: '',
  letterNumber: '',
  letterDate: '',
  authorityType: 'DAO',
  memoNumber: '',
  memoDate: '',
  division: '',
  officerPhone: '',
};

export function SeedForms() {
  const [showInstructionModal, setShowInstructionModal] = useState(true);
  const [showCoveringLetterModal, setShowCoveringLetterModal] = useState(false);
  const [showDownloadAllDialog, setShowDownloadAllDialog] = useState(false);
  const [addToCoveringLetterChecked, setAddToCoveringLetterChecked] = useState(true);
  const [form, setForm] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const loaded = saved ? { ...initialSeedForm, ...JSON.parse(saved) } : initialSeedForm;
      // Ensure manual edit flags are initialized for old saved drafts
      return {
        ...loaded,
        placeManuallyEdited: loaded.placeManuallyEdited ?? false,
        collectionPlaceManuallyEdited: loaded.collectionPlaceManuallyEdited ?? false,
        sourceOfSupplyManuallyEdited: loaded.sourceOfSupplyManuallyEdited ?? false,
      };
    } catch {
      return initialSeedForm;
    }
  });
  const [coveringLetterDetails, setCoveringLetterDetails] = useState(() => {
    try {
      const saved = window.localStorage.getItem('tiryani-seed-covering-letter-details');
      return saved ? JSON.parse(saved) : {
        financialYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
        letterNumber: '',
        letterDate: new Date().toISOString().slice(0, 10),
        authorityType: 'DAO',
        memoNumber: '',
        memoDate: '',
        division: '',
        officerPhone: '',
      };
    } catch {
      return {
        financialYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
        letterNumber: '',
        letterDate: new Date().toISOString().slice(0, 10),
        authorityType: 'DAO',
        memoNumber: '',
        memoDate: '',
        division: '',
        officerPhone: '',
      };
    }
  });
  const [message, setMessage] = useState('');
  const isSavingDraft = useRef(false);
  const [savedDrafts, setSavedDrafts] = useState(() => loadSeedDrafts());
  const [selectedDraftName, setSelectedDraftName] = useState('');
  const sampleDetailsRef = useRef(null);
  const dealerDetailsRef = useRef(null);
  const { toasts, removeToast, showSuccess, showInfo, showReset, showSaved, showDeleted, showLoaded, showQueue } = useToast();

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const resolved = useMemo(() => resolveSeedValues(form), [form]);
  const isCottonCrop = resolved.crop === 'Cotton';

  const setField = (key, value) => {
    setForm((current) => {
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
      if (key === 'sourceOfSupply') {
        // Mark as manually edited when user changes it
        return { ...current, sourceOfSupply: value, sourceOfSupplyManuallyEdited: true };
      }
      if (key === 'producedPackedBy') {
        // Auto-fill sourceOfSupply when producedPackedBy changes (if not manually edited)
        const shouldAutoFill = isCottonCrop && value && !current.sourceOfSupplyManuallyEdited;
        return { 
          ...current, 
          producedPackedBy: value,
          sourceOfSupply: shouldAutoFill ? value : current.sourceOfSupply
        };
      }
      return { ...current, [key]: value };
    });
    setMessage('');
  };

  const saveDraft = () => {
    // Prevent race conditions from rapid clicks
    if (isSavingDraft.current) {
      return;
    }
    
    // Use Inspector Name as the draft identifier
    const name = form.officerName.trim();
    
    if (!name) {
      showInfo('Please enter Inspector Name', 'Inspector Name is required to save draft.', 4000);
      return;
    }
    
    isSavingDraft.current = true;
    try {
      // Exclude covering letter fields from draft - they are independently persisted
      const { financialYear, letterNumber, letterDate, authorityType, memoNumber, memoDate, division, officerPhone, ...draftForm } = form;
      const nextDrafts = upsertSeedDraft(savedDrafts, { name, form: draftForm, updatedAt: Date.now() });
      window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
      setSavedDrafts(nextDrafts);
      showSaved('Draft Saved Successfully', `Draft saved as ${name}`, 4000);
    } finally {
      isSavingDraft.current = false;
    }
  };

  const resetDraft = () => {
    if (!confirm('Reset seed form draft?')) return;
    setForm(initialSeedForm);
    window.localStorage.removeItem(STORAGE_KEY);
    setSelectedDraftName('');
    setMessage('Draft reset successfully.');
  };

  const loadDraft = (name) => {
    // Use case-insensitive comparison for loading
    const draft = savedDrafts.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (!draft) return;
    // Preserve current covering letter details - they are independently persisted
    const { financialYear, letterNumber, letterDate, authorityType, memoNumber, memoDate, division, officerPhone } = form;
    setForm({ 
      ...initialSeedForm, 
      ...draft.form,
      // Restore covering letter details
      financialYear, letterNumber, letterDate, authorityType, memoNumber, memoDate, division, officerPhone 
    });
    setSelectedDraftName(draft.name);
    showLoaded('Draft Loaded Successfully', 'Your saved draft has been loaded successfully.', 4000);
  };

  const deleteDraft = () => {
    const name = form.officerName.trim();
    if (!name) {
      showInfo('No Draft Found', 'There is no saved draft to delete.', 4000);
      return;
    }
    if (!confirm(`Delete saved draft "${name}"?`)) return;
    // Use case-insensitive comparison for deletion
    const nextDrafts = savedDrafts.filter((item) => item.name.trim().toLowerCase() !== name.toLowerCase());
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setSavedDrafts(nextDrafts);
    // Clear auto-save storage to prevent the deleted draft from reappearing
    window.localStorage.removeItem(STORAGE_KEY);
    // Reset ALL draft-owned state to initial values (excluding covering letter details)
    setForm(initialSeedForm);
    setSelectedDraftName('');
    showDeleted('Draft Deleted Successfully', 'The saved draft has been deleted permanently.', 4000);
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
      showInfo('PDF Generation Failed', 'Please check the entered details and try again.', 4000);
      return null;
    }
  };

  const download = async (kind) => {
    const doc = await buildValidatedPdf(kind);
    if (!doc) return;
    try {
      downloadSeedDoc(doc, seedFileName(kind, form));
      rememberSeedGeneratedData(form);
      showSuccess('PDF Downloaded Successfully', seedFileName(kind, form), 4000);
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      const targetWindow = openBlankSeedPdfTab();
      openSeedDocInTab(doc, seedFileName(kind, form), targetWindow);
      rememberSeedGeneratedData(form);
      showInfo('Preview Opened', 'PDF opened in a new tab (download failed).', 4000);
    }
  };

  const completeGenerate = async (kind) => {
    const doc = await buildValidatedPdf(kind);
    if (!doc) return;
    try {
      downloadSeedDoc(doc, seedFileName(kind, form));
      rememberSeedGeneratedData(form);
      showSuccess('PDF Downloaded Successfully', seedFileName(kind, form), 4000);
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      const targetWindow = openBlankSeedPdfTab();
      openSeedDocInTab(doc, seedFileName(kind, form), targetWindow);
      rememberSeedGeneratedData(form);
      showInfo('Preview Opened', 'PDF opened in a new tab (download failed).', 4000);
    }
  };

  const generate = async (kind) => {
    if (kind === 'ALL') {
      setShowDownloadAllDialog(true);
      return;
    }
    await completeGenerate(kind);
  };

  const handleDownloadAllConfirm = async () => {
    setShowDownloadAllDialog(false);
    
    if (addToCoveringLetterChecked) {
      try {
        const queue = JSON.parse(window.localStorage.getItem(COVERING_LETTER_QUEUE_KEY) || '[]');
        
        const existingIndex = queue.findIndex(item => item.sampleCode === form.codeNo.trim());
        const sampleCode = form.codeNo.trim();
        
        if (sampleCode) {
          if (existingIndex === -1) {
            // New sample - add to queue
            const quantityValue = cropQuantityMapping[form.crop] || form.quantityDrawn || '';
            const numericQuantity = quantityValue.match(/^\d+/)?.[0] || quantityValue;
            const newItem = {
              sampleCode: sampleCode,
              seedName: form.crop || '',
              variety: form.variety || '',
              quantity: numericQuantity,
              dateOfSampling: form.collectionDate.trim(),
              isCotton: (form.crop || '').toLowerCase().includes('cotton'),
            };
            queue.push(newItem);
            window.localStorage.setItem(COVERING_LETTER_QUEUE_KEY, JSON.stringify(queue));
            window.dispatchEvent(new Event('local-storage-update'));
            showQueue('Sample added to Covering Letter', `Sample ${sampleCode} added to Sample Queue`, 4000);
          } else {
            // Check if sample details have changed
            const existingItem = queue[existingIndex];
            const quantityValue = cropQuantityMapping[form.crop] || form.quantityDrawn || '';
            const numericQuantity = quantityValue.match(/^\d+/)?.[0] || quantityValue;
            const newItem = {
              sampleCode: sampleCode,
              seedName: form.crop || '',
              variety: form.variety || '',
              quantity: numericQuantity,
              dateOfSampling: form.collectionDate.trim(),
              isCotton: (form.crop || '').toLowerCase().includes('cotton'),
            };
            
            const hasChanged = 
              existingItem.seedName !== newItem.seedName ||
              existingItem.variety !== newItem.variety ||
              existingItem.quantity !== newItem.quantity ||
              existingItem.dateOfSampling !== newItem.dateOfSampling;
            
            if (hasChanged) {
              // Update existing sample
              queue[existingIndex] = newItem;
              window.localStorage.setItem(COVERING_LETTER_QUEUE_KEY, JSON.stringify(queue));
              window.dispatchEvent(new Event('local-storage-update'));
              showQueue('Sample updated in Covering Letter', `Sample ${sampleCode} updated in Sample Queue`, 4000);
            } else {
              // Sample already exists and unchanged
              showQueue('Sample already in Covering Letter', `Sample ${sampleCode} already in Sample Queue`, 4000);
            }
          }
        }
      } catch (error) {
        console.error('Error adding to covering letter queue:', error);
      }
    }
    
    await completeGenerate('ALL');
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
    showInfo('Preview Opened', 'PDF preview opened in a new tab.', 4000);
  };

  const preview = async (kind) => {
    await completePreview(kind);
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
      producedPackedBy: '',
      testRequired: 'Purity, Moisture & Germination Test',
      testRequiredOther: '',
      placeManuallyEdited: false,
      collectionPlaceManuallyEdited: false,
      sourceOfSupplyManuallyEdited: false,
      remarks: '',
    }));
    setSelectedDraftName('');
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
    setSelectedDraftName('');
    setMessage('Dealer details reset successfully.');
  };

  const resetLaboratoryDetails = () => {
    setForm(prev => ({
      ...prev,
      labId: '',
      customLabAddress: '',
    }));
    setSelectedDraftName('');
    setMessage('Laboratory details reset successfully.');
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
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
            value={selectedDraftName}
            onChange={(event) => loadDraft(event.target.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none backdrop-blur-sm transition-all ${
              selectedDraftName
                ? 'border-orange-400 bg-orange-50 text-orange-700 focus:border-orange-500 focus:bg-orange-100 focus:ring-2 focus:ring-orange-100/50'
                : 'border-orange-200 bg-white/90 text-slate-900 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100/50'
            }`}
            title={selectedDraftName || 'Load saved draft...'}
          >
            <option value="">Load saved draft...</option>
            {savedDrafts.map((draft) => (
              <option key={draft.name} value={draft.name} className={selectedDraftName.trim().toLowerCase() === draft.name.trim().toLowerCase() ? 'bg-orange-50 text-orange-700 font-bold' : ''}>
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
          <Select label={form.designation === 'Asst. Director of Agriculture' ? 'Division' : 'Mandal'} value={form.mandal} onChange={(value) => setField('mandal', value)} options={form.district && form.district !== 'Others' ? [...getMandalsForDistrict(form.district).map(toOption), { label: 'Others', value: 'Others' }] : [{ label: 'Others', value: 'Others' }]} />
          {form.district === 'Others' && <Input label="Enter district name" value={form.manualDistrict} onChange={(value) => setField('manualDistrict', value)} />}
          {form.mandal === 'Others' && <Input label="Enter mandal name" value={form.manualMandal} onChange={(value) => setField('manualMandal', value)} />}
          <Input label="PIN CODE" value={form.pinCode} onChange={(value) => setField('pinCode', value)} />
          <Input label="Date" type="date" value={form.date} onChange={(value) => setField('date', value)} />
        </Card>

        <Card title="LABORATORY DETAILS" color="blue" onReset={resetLaboratoryDetails}>
          <Select label="To Address / Laboratory" value={form.labId} onChange={(value) => setField('labId', value)} options={labOptions.map((item) => ({ label: item.label, value: item.id }))} />
          {form.labId === 'other' ? (
            <Input label="Custom laboratory address" value={form.customLabAddress} onChange={(value) => setField('customLabAddress', value)} textarea />
          ) : (
            <p className="whitespace-pre-line rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-600">{resolved.labAddress}</p>
          )}
          <PreviewCard title="Information Slip Logic" lines={resolved.crop === 'Cotton' ? ['Cotton selected: two slips will be generated.', '1. Purity, Moisture & Germination Test', '2. BT Protein Test'] : [`One slip: ${resolved.testRequired}`]} />
        </Card>

        <div ref={sampleDetailsRef}>
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
          {isCottonCrop && <Input label="Produced & Packed by" value={form.producedPackedBy} onChange={(value) => setField('producedPackedBy', value)} placeholder="Enter Producer Details" textarea />}
          <Input label="Source of supply" value={form.sourceOfSupply} onChange={(value) => setField('sourceOfSupply', value)} placeholder="Enter Distributor/ Marketer Details" textarea />
          <SelectWithOther label="Kind of test required" valueKey="testRequired" otherKey="testRequiredOther" form={form} setField={setField} options={testOptions} />
          <Input label="Remarks" value={form.remarks} onChange={(value) => setField('remarks', value)} textarea />
        </Card>
        </div>

        <div ref={dealerDetailsRef}>
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
          {isCottonCrop && <PdfAction label="Form I" onPreview={() => preview('I')} onDownload={() => generate('I')} />}
          {isCottonCrop && <PdfAction label="Form II" onPreview={() => preview('II')} onDownload={() => generate('II')} />}
          <PdfAction label="Form V" onPreview={() => preview('V')} onDownload={() => generate('V')} />
          <PdfAction label="Form VI Notice" onPreview={() => preview('VI')} onDownload={() => generate('VI')} />
          <PdfAction label="Form VIII" onPreview={() => preview('VIII')} onDownload={() => generate('VIII')} />
          <PdfAction label="Information Slip" onPreview={() => preview('SLIP')} onDownload={() => generate('SLIP')} />
          <PdfAction label="All Forms" onPreview={() => preview('ALL')} onDownload={() => generate('ALL')} primary />
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowCoveringLetterModal(true)}
            className="group relative w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 active:scale-95 active:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-500/50 focus:ring-offset-2 min-h-[44px]"
          >
            <FileText className="h-5 w-5" />
            <span>Generate Official Covering Letter</span>
          </button>
        </div>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold leading-4 text-red-700">
          Note: Please update sample details and dealer details before generating a new file.
        </p>
      </div>

      {showDownloadAllDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Download All Forms</h3>
            
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={addToCoveringLetterChecked}
                onChange={(e) => setAddToCoveringLetterChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Add sample details to Covering Letter</span>
            </label>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadAllConfirm}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-bold"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => setShowDownloadAllDialog(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <SeedInstructionModal
        isOpen={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
      />
      <SeedCoveringLetterModal
        isOpen={showCoveringLetterModal}
        onClose={() => setShowCoveringLetterModal(false)}
        officerDetails={{
          officerName: form.officerName,
          qualification: form.qualification,
          manualQualification: form.manualQualification,
          designation: form.designation,
          mandal: form.mandal,
          manualMandal: form.manualMandal,
          district: form.district,
          manualDistrict: form.manualDistrict,
          pinCode: form.pinCode,
          phone: '',
        }}
        coveringLetterDetails={coveringLetterDetails}
        laboratoryAddress={resolved.labAddress}
        onMetadataChange={(metadata) => {
          setCoveringLetterDetails({
            financialYear: metadata.year,
            letterNumber: metadata.letterNumber,
            letterDate: metadata.letterDate,
            authorityType: metadata.authorityType,
            memoNumber: metadata.daoMemoNumber,
            memoDate: metadata.daoMemoDate,
            division: metadata.division,
            officerPhone: metadata.officePhone,
          });
        }}
      />
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
  
  // Format district with PIN code for Form V and Form II
  const districtWithPinCode = form.pinCode 
    ? `${resolvedDistrict} -${form.pinCode}`
    : resolvedDistrict;
  
  return {
    ...form,
    place: resolvedPlace,
    collectionPlace: form.collectionPlace,
    crop: form.crop === 'Other' ? form.cropOther : form.crop,
    nature: form.nature === 'Other' ? form.natureOther : form.nature,
    seedClass: form.seedClass === 'Other' ? form.seedClassOther : form.seedClass,
    testRequired: form.testRequired === 'Other' ? form.testRequiredOther : form.testRequired,
    labAddress: form.labId === 'other' ? form.customLabAddress : (form.labId === '' ? '' : lab.value),
    fromAddress: [officerNameWithQualification, form.designation, resolvedMandal ? `${resolvedMandal} ${locationLabel}` : '', districtWithPinCode].filter(Boolean).join('\n'),
    senderAddress: [form.designation, resolvedMandal ? `${resolvedMandal} ${locationLabel}` : '', districtWithPinCode].filter(Boolean).join('\n'),
    district: resolvedDistrict,
    districtWithPinCode: districtWithPinCode,
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
  doc.setProperties({ title: `Seed Form ${kind}`, creator: 'AGRONIX' });

  // Add watermark to initial page
  await drawWatermark(doc);

  if (kind === 'ALL') {
    if (isCottonSeedForm(form)) {
      drawSeedFormI(doc, form);
      doc.addPage();
      await drawWatermark(doc);
      drawSeedFormII(doc, form);
      doc.addPage();
      await drawWatermark(doc);
    }
    drawSeedFormV(doc, form);
    doc.addPage();
    await drawWatermark(doc);
    drawSeedFormVI(doc, form);
    doc.addPage();
    await drawWatermark(doc);
    drawSeedFormVIII(doc, form);
    await drawInfoSlips(doc, form, true);
    return doc;
  }

  if (kind === 'I') drawSeedFormI(doc, form);
  if (kind === 'II') drawSeedFormII(doc, form);
  if (kind === 'V') drawSeedFormV(doc, form);
  if (kind === 'VI') drawSeedFormVI(doc, form);
  if (kind === 'VIII') drawSeedFormVIII(doc, form);
  if (kind === 'SLIP') await drawInfoSlips(doc, form, false);
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
  // Move bottom section upward by 4 units
  p.y -= 4;
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
  doc.text('To:', 20, p.y);
  p.y += 7;
  const districtWithPin = r.districtWithPinCode ? `${r.districtWithPinCode}` : `${r.district}`;
  const mandalWithText = r.mandal ? `${r.mandal} Mandal` : '';
  // Skip r.place if it's the same as mandal value (without Mandal suffix) to avoid duplication
  const shouldIncludePlace = r.place && r.place !== r.mandal;
  const addressLines = [r.dealerName, r.dealerAddress, ...(shouldIncludePlace ? [r.place] : []), mandalWithText, districtWithPin].filter(Boolean);
  
  // Add punctuation: commas to all lines except last, full stop to last line
  const formattedLines = addressLines.map((line, index) => {
    if (index === addressLines.length - 1) {
      // Last line: add full stop if not already ending with . or ,
      return line.endsWith('.') || line.endsWith(',') ? line : `${line}.`;
    } else {
      // Other lines: add comma if not already ending with , or .
      return line.endsWith(',') || line.endsWith('.') ? line : `${line},`;
    }
  });
  
  const dealerAddress = formattedLines.join('\n');
  doc.text(doc.splitTextToSize(dealerAddress || '.......................................................', 170), 20, p.y);
  doc.setFont(PDF_FONT, 'normal');
  p.y += Math.max(24, doc.splitTextToSize(dealerAddress || '', 170).length * 6 + 8);

  const notice =
    'I hereby give you the notice of my intension to draw sample of Seed from the Stocks available at the above mentioned premises for the purpose of tests or analysis.';
  p.y += 8;
  doc.setFont(PDF_FONT, 'normal');
  // Increase line spacing to 1.5 for notice paragraph
  const originalLineHeightFactor = doc.getLineHeightFactor() || 1.15;
  doc.setLineHeightFactor(1.5);
  doc.text(doc.splitTextToSize(notice, 170), 28, p.y);
  doc.setLineHeightFactor(originalLineHeightFactor);
  // Adjust height calculation for increased line spacing
  const noticeLines = doc.splitTextToSize(notice, 170);
  p.y += noticeLines.length * 7 * 1.5 + 8;

  doc.text(`Date : ${fmtDate(r.date) || '____ / ____ / ______'}`, 20, p.y);
  signatureRight(doc, Math.min(p.y + 16, 246), ['Seed Inspector/', 'Mandal Agriculture Officer']);
}

function drawSeedFormI(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  
  // Title
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(PDF_TITLE_SIZE);
  doc.text('APPENDIX - A', 105, p.y, { align: 'center' });
  p.y += 8;
  doc.text('FORM I', 105, p.y, { align: 'center' });
  p.y += 8;
  doc.setFontSize(PDF_SUBTITLE_SIZE);
  doc.text('NOTICE OF INTENTION TO HAVE SAMPLE ANALYSED', 105, p.y, { align: 'center' });
  const subtitleWidth = doc.getTextWidth('NOTICE OF INTENTION TO HAVE SAMPLE ANALYSED');
  doc.line(105 - subtitleWidth / 2, p.y + 2, 105 + subtitleWidth / 2, p.y + 2);
  p.y += 10;
  doc.setFontSize(PDF_BODY_SIZE);
  doc.setFont(PDF_FONT, 'italic');
  doc.text('(See Rule 7)', 105, p.y, { align: 'center' });
  doc.setFont(PDF_FONT, 'normal');
  p.y += 12;
  
  // To section
  doc.setFont(PDF_FONT, 'bold');
  doc.text('To:', 20, p.y);
  p.y += 7;
  const districtWithPin = r.districtWithPinCode ? `${r.districtWithPinCode}` : `${r.district}`;
  const mandalWithText = r.mandal ? `${r.mandal} Mandal` : '';
  const shouldIncludePlace = r.place && r.place !== r.mandal;
  const addressLines = [r.dealerName, r.dealerAddress, ...(shouldIncludePlace ? [r.place] : []), mandalWithText, districtWithPin].filter(Boolean);
  const formattedLines = addressLines.map((line, index) => {
    if (index === addressLines.length - 1) {
      return line.endsWith('.') || line.endsWith(',') ? line : `${line}.`;
    } else {
      return line.endsWith(',') || line.endsWith('.') ? line : `${line},`;
    }
  });
  const dealerAddress = formattedLines.join('\n');
  doc.text(doc.splitTextToSize(dealerAddress || '.......................................................', 170), 20, p.y);
  p.y += Math.max(6, doc.splitTextToSize(dealerAddress || '', 170).length * 6 + 2);
  
  // Body text as single paragraph
  richPara(doc, p, [
    { text: 'Take notice that it is intended to have analyzed the sample of ' },
    { text: 'Hybrid Bt. Cotton Seed', bold: true },
    { text: ' ' },
    { text: 'Produced & Packed by: ' },
    { text: r.producedPackedBy || '_____________________________________________', bold: true },
    { text: ' and Marketed by: ' },
    { text: r.sourceOfSupply || '_____________________________________________.', bold: true },
  ]);
  p.y += 6;
  
  // Fields
  details(doc, p, [
    ['1. Kind / Variety', r.variety],
    ['2. Lot No.', r.lotNo],
    ['3. BT Protein', r.crop === 'Cotton' ? 'Cry1Ac & Cry2Ab Genes' : ''],
  ]);
  
  // Which has been taken today
  doc.setFont(PDF_FONT, 'normal');
  p.y += 4;
  richPara(doc, p, [
    { text: 'Which has been taken today on, ' },
    { text: fmtDate(r.collectionDate) || '____________________________', bold: true },
  ]);
  p.y += 2;
  
  // From section
  doc.setFont(PDF_FONT, 'bold');
  doc.text('From:', 20, p.y);
  p.y += 7;
  const formattedFromAddress = formatAddressWithCommas(r.fromAddress || '________________');
  doc.text(doc.splitTextToSize(formattedFromAddress, 170), 20, p.y);
  p.y += Math.max(10, doc.splitTextToSize(formattedFromAddress || '', 170).length * 6 + 8);
  
  // Place
  doc.setFont(PDF_FONT, 'bold');
  doc.text('Place:', 20, p.y);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(r.place || '____________________________', 35, p.y);
  p.y += 6;
  
  // Date
  doc.setFont(PDF_FONT, 'bold');
  doc.text('Date:', 20, p.y);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(fmtDate(r.date) || '____________________________', 35, p.y);
  p.y += 6;
  
  // Signature
  signatureRight(doc, p.y, ['Seed Inspector &', 'Mandal Agriculture Officer']);
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

async function drawInfoSlips(doc, form, addPageBefore) {
  const r = resolveSeedValues(form);
  const tests = r.crop === 'Cotton' ? ['Purity, Moisture & Germination Test', 'BT Protein Test'] : [r.testRequired];
  for (const [index, test] of tests.entries()) {
    if (addPageBefore || index > 0) {
      doc.addPage();
    }
    await drawWatermark(doc);
    drawInformationSlip(doc, {
      ...form,
      testRequired: test,
      testRequiredOther: '',
      quantityDrawn: cottonSlipQuantity(r.crop, test) || form.quantityDrawn,
      quantityInLot: form.quantityInLot,
    });
  }
}

function drawInformationSlip(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'INFORMATION TO ACCOMPANY THE SAMPLE', '', '');
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
  const headingWidth = doc.getTextWidth(heading);
  doc.line(105 - headingWidth / 2, p.y + 2, 105 + headingWidth / 2, p.y + 2);
  p.y += 8;
  if (subheading) {
    doc.setFontSize(PDF_BODY_SIZE);
    doc.text(subheading, 105, p.y, { align: 'center' });
    p.y += 8;
  }
  if (titleText) {
    doc.setFontSize(PDF_SUBTITLE_SIZE);
    doc.text(titleText, 105, p.y, { align: 'center' });
    const textWidth = doc.getTextWidth(titleText);
    doc.line(105 - textWidth / 2, p.y + 2, 105 + textWidth / 2, p.y + 2);
    p.y += 14;
  } else {
    p.y += 6;
  }
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(PDF_BODY_SIZE);
}

function formatAddressWithCommas(address) {
  if (!address || !address.trim()) return address;
  const lines = address.split('\n').filter(line => line.trim());
  const formatted = lines.map((line, index) => {
    if (index === lines.length - 1) {
      return line.trim() + '.';
    }
    return line.trim() + ',';
  });
  return formatted.join('\n');
}

function drawFromTo(doc, p, r) {
  doc.setFont(PDF_FONT, 'bold');
  doc.text('From:', 20, p.y);
  doc.text('To:', 128, p.y);
  const formattedFromAddress = formatAddressWithCommas(r.fromAddress || '________________');
  doc.text(doc.splitTextToSize(formattedFromAddress, 78), 20, p.y + 7);
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
  
  // Apply hanging indent for wrapped label lines
  if (labelLines.length > 1) {
    // Draw first line at original position
    doc.text(labelLines[0], x, p.y);
    // Calculate indent based on first space after the number prefix (e.g., "8. ")
    const firstSpaceMatch = labelLines[0].match(/^\d+\.\s+/);
    const indentWidth = firstSpaceMatch ? doc.getTextWidth(firstSpaceMatch[0]) : 8;
    // Draw subsequent lines with hanging indent
    for (let i = 1; i < labelLines.length; i++) {
      doc.text(labelLines[i], x + indentWidth, p.y + i * lineHeight);
    }
  } else {
    doc.text(labelLines, x, p.y);
  }
  
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
  if (test === 'Purity, Moisture & Germination Test') return '250 grams * 3';
  return '';
}

async function drawWatermark(doc) {
  try {
    const response = await fetch('/images/telangana-govt_emblem.webp');
    const blob = await response.blob();
    const reader = new FileReader();
    await new Promise((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = reader.result;
        
        // Large watermark size to show complete emblem (increased by 50% total)
        const watermarkWidth = 156;
        const watermarkHeight = 104; // Maintain aspect ratio (3:2)
        
        // Center the watermark on the page with proper margins
        const watermarkX = (210 - watermarkWidth) / 2;
        const watermarkY = (297 - watermarkHeight) / 2;
        
        // Try to set opacity using GState if available
        try {
          const gState = doc.GState({ opacity: 0.14 });
          doc.setGState(gState);
        } catch (e) {
          // GState not supported, continue without opacity
        }
        
        // Draw watermark
        doc.addImage(dataUrl, 'WEBP', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
        
        // Reset opacity if GState was used
        try {
          doc.setGState(doc.GState({ opacity: 1.0 }));
        } catch (e) {
          // GState not supported, ignore
        }
        
        resolve(null);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading watermark image:', error);
  }
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

function upsertSeedDraft(drafts, draft) {
  // Use case-insensitive comparison to prevent duplicates
  return [draft, ...drafts.filter((item) => item.name.trim().toLowerCase() !== draft.name.trim().toLowerCase())].slice(0, 30);
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

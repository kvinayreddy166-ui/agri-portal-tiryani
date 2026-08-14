import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bug, Download, Eye, FileText, RotateCcw, Save, X } from 'lucide-react';
import { PesticideCoveringLetterModal } from './PesticideCoveringLetterModal';
import {
  generateAllPesticideStatutoryPdf,
  generatePesticideStatutoryPdf,
  getAllPesticidePdfFileName,
  getPesticidePdfFileName,
  initialPesticidePdfValues,
  PesticidePdfValues,
  PesticideStatutoryFormType,
  isCombinationProduct,
  extractIngredientNames,
  ActiveIngredient,
} from '../../lib/statutoryPesticidePdf';
import { PopupHintWrapper } from '../PopupHint';
import { ToastContainer, useToast } from '../ui/Toast';
import {
  QUALIFICATION_OPTIONS,
  TELANGANA_DISTRICTS,
  DESIGNATION_OPTIONS,
  getMandalsForDistrict,
} from '../../data/telanganaDistrictMandalData';

type FieldConfig = {
  key: keyof PesticidePdfValues;
  label: string;
  type?: 'text' | 'date' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  dynamicLabel?: boolean;
};

type SavedPesticideDraft = {
  name: string;
  values: PesticidePdfValues;
  updatedAt: string;
};

const STORAGE_KEY = 'tiryani-pesticide-forms-draft';
const DRAFTS_KEY = 'tiryani-pesticide-forms-named-drafts';
const COVERING_LETTER_QUEUE_KEY = 'tiryani-pesticide-covering-letter-queue';
const PESTICIDE_COVERING_LETTER_DETAILS_KEY = 'tiryani-pesticide-covering-letter-details';


const packingOptions = [
  { label: 'Original sealed', value: 'Original sealed' },
  { label: 'Loose', value: 'Loose' },
  { label: 'Container sealed', value: 'Container sealed' },
];

const formulationTypeOptions = [
  { label: 'AE', value: 'AE' },
  { label: 'BB', value: 'BB' },
  { label: 'BR', value: 'BR' },
  { label: 'CS', value: 'CS' },
  { label: 'D', value: 'D' },
  { label: 'DC', value: 'DC' },
  { label: 'DP', value: 'DP' },
  { label: 'DS', value: 'DS' },
  { label: 'EC', value: 'EC' },
  { label: 'ES', value: 'ES' },
  { label: 'EW', value: 'EW' },
  { label: 'FS', value: 'FS' },
  { label: 'FU', value: 'FU' },
  { label: 'G', value: 'G' },
  { label: 'GL', value: 'GL' },
  { label: 'GR', value: 'GR' },
  { label: 'LS', value: 'LS' },
  { label: 'ME', value: 'ME' },
  { label: 'OD', value: 'OD' },
  { label: 'P', value: 'P' },
  { label: 'PA', value: 'PA' },
  { label: 'RB', value: 'RB' },
  { label: 'SC', value: 'SC' },
  { label: 'SE', value: 'SE' },
  { label: 'SG', value: 'SG' },
  { label: 'SL', value: 'SL' },
  { label: 'SP', value: 'SP' },
  { label: 'TB', value: 'TB' },
  { label: 'TC', value: 'TC' },
  { label: 'TK', value: 'TK' },
  { label: 'ULV', value: 'ULV' },
  { label: 'VP', value: 'VP' },
  { label: 'WDG', value: 'WDG' },
  { label: 'WG', value: 'WG' },
  { label: 'WP', value: 'WP' },
  { label: 'WS', value: 'WS' },
  { label: 'Others', value: 'Others' },
];

const fieldSections: { title: string; fields: FieldConfig[] }[] = [
  {
    title: 'INSPECTOR DETAILS',
    fields: [
      { key: 'officerName', label: 'INSPECTOR NAME' },
      { key: 'qualification', label: 'QUALIFICATION', type: 'select', options: QUALIFICATION_OPTIONS },
      { key: 'manualQualification', label: 'ENTER QUALIFICATION', placeholder: 'Enter qualification' },
      { key: 'designation', label: 'DESIGNATION', type: 'select', options: DESIGNATION_OPTIONS },
      { key: 'district', label: 'DISTRICT', type: 'select', options: TELANGANA_DISTRICTS.map(d => ({ label: d, value: d })) },
      { key: 'mandal', label: 'MANDAL', type: 'select', options: [], dynamicLabel: true },
      { key: 'manualDistrict', label: 'ENTER DISTRICT NAME', placeholder: 'Enter district name' },
      { key: 'manualMandal', label: 'ENTER MANDAL NAME', placeholder: 'Enter mandal name' },
      { key: 'pincode', label: 'PIN CODE' },
      { key: 'sampleDrawnDate', label: 'Date', type: 'date' },
      { key: 'officerEmail', label: 'EMAIL ID' },
    ],
  },
  {
    title: 'PRODUCT DETAILS',
    fields: [
      { key: 'tradeName', label: 'TRADE NAME', placeholder: 'Brand Name Eg: Coragen' },
      { key: 'technicalName', label: 'TECHNICAL NAME', placeholder: 'Eg: Chlorantraniliprole' },
      { key: 'activeIngredient', label: 'ACTIVE INGREDIENT', placeholder: 'Eg: 18.5% only, Dont enter Formulation type' },
      { key: 'formulationType', label: 'FORMULATION TYPE', type: 'select', options: formulationTypeOptions },
      { key: 'manualFormulationType', label: 'ENTER FORMULATION TYPE', placeholder: 'Enter formulation type' },
      { key: 'batchNumber', label: 'BATCH NUMBER', placeholder: 'Enter Batch No as Per Label' },
      { key: 'registrationNumber', label: 'REGISTRATION NUMBER', placeholder: 'CIBRC Number' },
      { key: 'sampleSerialNumber', label: 'CODE NO. OF A.O./A.D.A./D.D.A', placeholder: 'Serial No of Sample' },
      { key: 'cdaCode', label: 'C & DA CODE', placeholder: 'Sticker No' },
      { key: 'packingCondition', label: 'PACKING CONDITION', type: 'select', options: packingOptions },
      { key: 'sampleQuantity', label: 'QUANTITY OF SAMPLE DRAWN', placeholder: 'Eg: 120 Grams * 3' },
      { key: 'stockRegisterFolio', label: 'STOCK REGISTER FOLIO / PAGE NO.' },
      { key: 'invoiceNumber', label: 'INVOICE NO' },
      { key: 'invoiceDate', label: 'INVOICE DATE', type: 'date' },
      { key: 'stockPosition', label: 'STOCK POSITION OF BATCH', type: 'textarea', placeholder: 'Eg: 50 x (120 GMS) / 50 x (120 Ml)' },
      { key: 'otherInformation', label: 'ANY OTHER RELEVANT INFORMATION', type: 'textarea' },
      { key: 'dispatchDate', label: 'Date of Dispatch', type: 'date' },
    ],
  },
  {
    title: 'MANUFACTURER DETAILS',
    fields: [
      { key: 'manufacturedBy', label: 'MANUFACTURED BY', type: 'textarea' },
      { key: 'marketedBy', label: 'MARKETED BY', type: 'textarea' },
      { key: 'distributorName', label: 'DISTRIBUTOR NAME' },
      { key: 'manufacturingLicenseNumber', label: 'MANUFACTURING LICENSE NO.' },
      { key: 'manufactureDate', label: 'DATE OF MANUFACTURE', type: 'date' },
      { key: 'expiryDate', label: 'DATE OF EXPIRY', type: 'date' },
    ],
  },
  {
    title: 'DEALER DETAILS',
    fields: [
      { key: 'dealerName', label: 'DEALER / LICENSEE NAME', placeholder: 'Firm Name' },
      { key: 'dealerAddress', label: 'DEALER ADDRESS', type: 'textarea', placeholder: 'Door NO, Village/ town' },
      { key: 'authorizationLicenseNumber', label: 'AUTHORIZATION/ LICENSE NO' },
      { key: 'licenseDate', label: 'LICENSE DATE', type: 'date' },
    ],
  },
];

export function PesticideStatutoryPdfTool({ onClose }: { onClose: () => void }) {
  const [showCoveringLetterModal, setShowCoveringLetterModal] = useState(false);
  const [values, setValues] = useState<PesticidePdfValues>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialPesticidePdfValues, ...JSON.parse(saved) } : initialPesticidePdfValues;
    } catch {
      return initialPesticidePdfValues;
    }
  });
  const [coveringLetterDetails, setCoveringLetterDetails] = useState(() => {
    try {
      const saved = window.localStorage.getItem(PESTICIDE_COVERING_LETTER_DETAILS_KEY);
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
  const [message, setMessage] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const isSavingDraft = useRef(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedPesticideDraft[]>(() => loadDrafts());
  const [busy, setBusy] = useState(false);
  const [showDownloadAllDialog, setShowDownloadAllDialog] = useState(false);
  const [addToCoveringLetterChecked, setAddToCoveringLetterChecked] = useState(true);
  const { toasts, removeToast, showSuccess, showInfo, showReset, showSaved, showDeleted, showLoaded, showQueue } = useToast();
  const sections = useMemo(() => fieldSections, []);

  const resetDealerDetails = () => {
    setValues(prev => ({
      ...prev,
      dealerName: '',
      dealerAddress: '',
      authorizationLicenseNumber: '',
      licenseDate: '',
    }));
    showReset('Dealer Details Reset', 'Dealer details have been reset successfully.', 4000);
  };

  const resetProductDetails = () => {
    setValues(prev => ({
      ...prev,
      tradeName: '',
      technicalName: '',
      activeIngredient: '',
      activeIngredients: [],
      formulationType: '',
      manualFormulationType: '',
      batchNumber: '',
      registrationNumber: '',
      sampleSerialNumber: '',
      cdaCode: '',
      packingCondition: '',
      sampleQuantity: '',
      stockRegisterFolio: '',
      invoiceNumber: '',
      invoiceDate: '',
      stockPosition: '',
      otherInformation: '',
      dispatchDate: '',
    }));
    showReset('Product Details Reset', 'Product details have been reset successfully.', 4000);
  };

  const resetManufacturerDetails = () => {
    setValues(prev => ({
      ...prev,
      manufacturedBy: '',
      marketedBy: '',
      distributorName: '',
      manufacturingLicenseNumber: '',
      manufactureDate: '',
      expiryDate: '',
    }));
    showReset('Manufacturer Details Reset', 'Manufacturer details have been reset successfully.', 4000);
  };

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const setField = (key: keyof PesticidePdfValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'place') {
        const resolvedPlace = next.mandal === 'Others' ? next.manualMandal : next.mandal;
        next.place = resolvedPlace || value;
        if (!current.premisesLocation || current.premisesLocation === current.place) {
          next.premisesLocation = next.place;
        }
      }
      if (key === 'district') {
        next.mandal = '';
        next.manualDistrict = '';
        next.manualMandal = '';
        next.place = '';
      }
      if (key === 'mandal') {
        next.manualMandal = '';
        const resolvedPlace = value === 'Others' ? next.manualMandal : value;
        next.place = resolvedPlace;
      }
      if (key === 'manualMandal') {
        next.place = value;
      }
      if (key === 'qualification') {
        next.manualQualification = '';
      }
      if (key === 'formulationType') {
        next.manualFormulationType = '';
      }
      if (key === 'technicalName') {
        // Auto-detect combination and update activeIngredients array
        const isCombo = isCombinationProduct(value);
        const ingredientNames = extractIngredientNames(value);
        
        if (isCombo && ingredientNames.length > 0) {
          // Create active ingredient entries for each detected ingredient
          // Preserve existing concentrations if the number of ingredients matches
          const existingConcentrations = current.activeIngredients || [];
          const newActiveIngredients: ActiveIngredient[] = ingredientNames.map((name, index) => ({
            name: name.trim(),
            concentration: existingConcentrations[index]?.concentration || ''
          }));
          next.activeIngredients = newActiveIngredients;
        } else {
          // Single ingredient - reset to single entry
          const existingConcentration = current.activeIngredients?.[0]?.concentration || '';
          next.activeIngredients = [{
            name: '',
            concentration: existingConcentration
          }];
        }
      }
      if (key === 'activeIngredient') {
        // Update the legacy field for backward compatibility
        // Also update the first active ingredient concentration
        if (next.activeIngredients && next.activeIngredients.length > 0) {
          next.activeIngredients[0].concentration = value;
        } else {
          next.activeIngredients = [{ name: '', concentration: value }];
        }
      }
      if (key === 'manufacturedBy') {
        // Auto-populate DISTRIBUTOR NAME and MARKETED BY with MANUFACTURED BY value
        next.distributorName = value;
        next.marketedBy = value;
      }
      if (key === 'sampleDrawnDate') {
        const date = new Date(`${value}T00:00:00`);
        if (!Number.isNaN(date.getTime())) {
          next.sampleDrawnDay = String(date.getDate()).padStart(2, '0');
          next.sampleDrawnMonth = date.toLocaleString('en-IN', { month: 'long' });
          next.sampleDrawnYear = String(date.getFullYear()).slice(-2);
        }
      }
      return next;
    });
    setMessage(null);
    setPreviewError(null);
  };

  const saveDraft = () => {
    // Prevent race conditions from rapid clicks
    if (isSavingDraft.current) {
      return;
    }
    
    // Use Inspector Name as the draft identifier
    const name = values.officerName.trim();
    
    if (!name) {
      showInfo('Please enter Inspector Name', 'Inspector Name is required to save draft.', 4000);
      return;
    }
    
    isSavingDraft.current = true;
    try {
      // Exclude covering letter fields from draft - they are independently persisted
      const { financialYear, letterNumber, letterDate, authorityType, memoNumber, memoDate, division, officerPhone, ...draftValues } = values as any;
      const nextDrafts = upsertDraft(savedDrafts, { name, values: draftValues, updatedAt: String(Date.now()) });
      window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
      setSavedDrafts(nextDrafts);
      showSaved('Draft Saved Successfully', `Draft saved as ${name}`, 4000);
    } finally {
      isSavingDraft.current = false;
    }
  };

  const resetDraft = () => {
    if (!window.confirm('Reset pesticide form draft?')) return;
    setValues(initialPesticidePdfValues);
    window.localStorage.removeItem(STORAGE_KEY);
    setPreviewError(null);
    showReset('Draft Reset Successfully', 'All entered data has been cleared successfully.', 4000);
  };

  const loadDraft = (name: string) => {
    // Use case-insensitive comparison for loading
    const draft = savedDrafts.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (!draft) return;
    // Preserve current covering letter details - they are independently persisted
    const { financialYear, letterNumber, letterDate, authorityType, memoNumber, memoDate, division, officerPhone } = values;
    const loadedValues = { 
      ...initialPesticidePdfValues, 
      ...draft.values,
      // Restore covering letter details
      financialYear, letterNumber, letterDate, authorityType, memoNumber, memoDate, division, officerPhone 
    };
    
    // Reconstruct activeIngredients array based on technical name for combination products
    const isCombo = isCombinationProduct(loadedValues.technicalName);
    if (isCombo) {
      const ingredientNames = extractIngredientNames(loadedValues.technicalName);
      if (ingredientNames.length > 0) {
        // Preserve existing concentrations if available
        const existingConcentrations = loadedValues.activeIngredients || [];
        loadedValues.activeIngredients = ingredientNames.map((name, index) => ({
          name: name.trim(),
          concentration: existingConcentrations[index]?.concentration || ''
        }));
      }
    } else if (!loadedValues.activeIngredients || loadedValues.activeIngredients.length === 0) {
      // Ensure single ingredient has at least one entry
      loadedValues.activeIngredients = [{
        name: '',
        concentration: loadedValues.activeIngredient || ''
      }];
    }
    
    setValues(loadedValues);
    setPreviewError(null);
    showLoaded('Draft Loaded Successfully', 'Your saved draft has been loaded successfully.', 4000);
  };

  const deleteDraft = () => {
    const name = values.officerName.trim();
    if (!name) {
      showInfo('No Draft Found', 'There is no saved draft to delete.', 4000);
      return;
    }
    if (!window.confirm(`Delete saved draft "${name}"?`)) return;
    // Use case-insensitive comparison for deletion
    const nextDrafts = savedDrafts.filter((item) => item.name.trim().toLowerCase() !== name.toLowerCase());
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setSavedDrafts(nextDrafts);
    // Clear auto-save storage to prevent the deleted draft from reappearing
    window.localStorage.removeItem(STORAGE_KEY);
    // Reset ALL draft-owned state to initial values (excluding covering letter details)
    setValues(initialPesticidePdfValues);
    showDeleted('Draft Deleted Successfully', 'The saved draft has been deleted permanently.', 4000);
  };

  const completePreview = async (formType: PesticideStatutoryFormType) => {
    // Validation removed - users can preview PDFs even with empty fields
    const targetWindow = openBlankPdfTab();
    setBusy(true);
    try {
      const doc = await generatePesticideStatutoryPdf(formType, values);
      openDocInTab(doc, getPesticidePdfFileName(formType, values), targetWindow);
      showInfo('Preview Opened', 'PDF preview opened in a new tab.', 4000);
    } catch (error) {
      console.error('Unable to preview pesticide PDF:', error);
      targetWindow?.close();
      setPreviewError('PDF preview could not open. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const preview = async (formType: PesticideStatutoryFormType) => {
    await completePreview(formType);
  };

  const completeDownload = async (formType: PesticideStatutoryFormType) => {
    // Validation removed - users can download PDFs even with empty fields
    setBusy(true);
    try {
      const doc = await generatePesticideStatutoryPdf(formType, values);
      const fileName = getPesticidePdfFileName(formType, values);
      downloadDoc(doc, fileName);
      showSuccess('PDF Downloaded Successfully', fileName, 4000);
    } catch (error) {
      console.error('Unable to download pesticide PDF:', error);
      setPreviewError('PDF could not download. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const download = async (formType: PesticideStatutoryFormType) => {
    await completeDownload(formType);
  };

  const completePreviewAll = async () => {
    // Validation removed - users can preview PDFs even with empty fields
    const targetWindow = openBlankPdfTab();
    setBusy(true);
    try {
      const doc = await generateAllPesticideStatutoryPdf(values);
      openDocInTab(doc, getAllPesticidePdfFileName(values), targetWindow);
      showInfo('All Forms Previewed', 'All pesticide forms preview opened in a new tab.', 4000);
    } catch (error) {
      console.error('Unable to preview all pesticide PDFs:', error);
      targetWindow?.close();
      setPreviewError('Preview All could not open. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const previewAll = async () => {
    await completePreviewAll();
  };

  const completeDownloadAll = async () => {
    // Validation removed - users can download PDFs even with empty fields
    setBusy(true);
    try {
      const doc = await generateAllPesticideStatutoryPdf(values);
      const fileName = getAllPesticidePdfFileName(values);
      downloadDoc(doc, fileName);
      showSuccess('All Forms PDF Downloaded Successfully', fileName, 4000);
    } catch (error) {
      console.error('Unable to download all pesticide PDFs:', error);
      setPreviewError('All forms PDF could not download. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    setShowDownloadAllDialog(true);
  };

  const handleDownloadAllConfirm = async () => {
    setShowDownloadAllDialog(false);
    
    if (addToCoveringLetterChecked) {
      try {
        const queue = JSON.parse(window.localStorage.getItem(COVERING_LETTER_QUEUE_KEY) || '[]');
        
        const existingIndex = queue.findIndex((item: any) => item.sampleCode === values.cdaCode.trim());
        const sampleCode = values.cdaCode.trim();
        
        if (sampleCode) {
          if (existingIndex === -1) {
            // New sample - add to queue
            const newItem = {
              sampleCode: sampleCode,
              tradeName: values.tradeName || '',
              technicalName: values.technicalName || '',
              activeIngredient: values.activeIngredient || '',
              formulationType: values.formulationType === 'Others' ? values.manualFormulationType : values.formulationType || '',
              dateOfSampling: values.sampleDrawnDate.trim(),
            };
            queue.push(newItem);
            window.localStorage.setItem(COVERING_LETTER_QUEUE_KEY, JSON.stringify(queue));
            window.dispatchEvent(new Event('local-storage-update'));
            showQueue('Sample added to Covering Letter', `Sample ${sampleCode} added to Sample Queue`, 4000);
          } else {
            // Check if sample details have changed
            const existingItem = queue[existingIndex];
            const newItem = {
              sampleCode: sampleCode,
              tradeName: values.tradeName || '',
              technicalName: values.technicalName || '',
              activeIngredient: values.activeIngredient || '',
              formulationType: values.formulationType === 'Others' ? values.manualFormulationType : values.formulationType || '',
              dateOfSampling: values.sampleDrawnDate.trim(),
            };
            
            const hasChanged = 
              existingItem.tradeName !== newItem.tradeName ||
              existingItem.technicalName !== newItem.technicalName ||
              existingItem.activeIngredient !== newItem.activeIngredient ||
              existingItem.formulationType !== newItem.formulationType ||
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
    
    await completeDownloadAll();
  };


  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="relative flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-red-100/50 bg-gradient-to-r from-red-50 via-white to-rose-50 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-rose-500/5 to-red-500/5 opacity-50" />
          <div className="relative flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
              <Bug className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600/80">Pesticide sampling</p>
              <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 sm:text-lg">Generate FORM V(C) / V(D) / V(E) / Docket Sheet</h2>
            </div>
          </div>
          <div className="relative flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white/80 text-red-600 shadow-sm backdrop-blur-sm transition-all hover:bg-red-50 hover:border-red-300 hover:shadow-md"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
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

          <div className="mb-2 rounded-xl border border-red-200/50 bg-gradient-to-br from-red-50/80 to-rose-50/80 p-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10">
                <Save className="h-3.5 w-3.5 text-red-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700">SAVED DRAFTS</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={values.officerName}
                onChange={(event) => loadDraft(event.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none backdrop-blur-sm transition-all ${
                  values.officerName
                    ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500 focus:bg-red-100 focus:ring-2 focus:ring-red-100/50'
                    : 'border-red-200 bg-white/90 text-slate-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100/50'
                }`}
                title={values.officerName || 'Load saved draft...'}
              >
                <option value="">Load saved draft...</option>
                {savedDrafts.map((draft) => <option key={draft.name} value={draft.name} className={values.officerName.trim().toLowerCase() === draft.name.trim().toLowerCase() ? 'bg-red-50 text-red-700 font-bold' : ''}>{draft.name}</option>)}
              </select>
              <button type="button" onClick={deleteDraft} className="rounded-lg border border-red-200 bg-white/90 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 hover:border-red-300 transition-all backdrop-blur-sm">Delete</button>
            </div>
          </div>

          {previewError && <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{previewError}</div>}
          {message && <div className="mb-2 rounded-lg border border-red-600 bg-white px-3 py-2 text-xs font-bold text-red-600">{message}</div>}

          <div className="grid gap-3">
            {sections.map((section) => {
              const colorMap: Record<string, 'emerald' | 'blue' | 'amber' | 'slate' | 'purple'> = {
                'INSPECTOR DETAILS': 'emerald',
                'DEALER DETAILS': 'amber',
                'PRODUCT DETAILS': 'purple',
                'MANUFACTURER DETAILS': 'blue',
              };
              const color = colorMap[section.title] || 'slate';
              
              const getResetHandler = (title: string) => {
                if (title === 'DEALER DETAILS') return resetDealerDetails;
                if (title === 'PRODUCT DETAILS') return resetProductDetails;
                if (title === 'MANUFACTURER DETAILS') return resetManufacturerDetails;
                return undefined;
              };
              
              return (
                <div
                  key={section.title}
                >
                  <FieldSection title={section.title} color={color} onReset={getResetHandler(section.title)}>
                    {section.fields.map((field) => {
                      // Hide manual district field unless district is "Others"
                      if (field.key === 'manualDistrict' && values.district !== 'Others') {
                        return null;
                      }
                      // Hide manual mandal field unless mandal is "Others"
                      if (field.key === 'manualMandal' && values.mandal !== 'Others') {
                        return null;
                      }
                      // Hide manual qualification field unless qualification is "Others"
                      if (field.key === 'manualQualification' && values.qualification !== 'Others') {
                        return null;
                      }
                      // Hide manual formulation type field unless formulationType is "Others"
                      if (field.key === 'manualFormulationType' && values.formulationType !== 'Others') {
                        return null;
                      }
                      // Get mandal options based on selected district
                      let fieldOptions = field.options;
                      if (field.key === 'mandal' && values.district && values.district !== 'Others') {
                        fieldOptions = getMandalsForDistrict(values.district).map(m => ({ label: m, value: m }));
                      }
                      
                      // Special handling for active ingredient field to show dynamic inputs
                      if (field.key === 'activeIngredient') {
                        const isCombo = isCombinationProduct(values.technicalName);
                        const ingredientNames = extractIngredientNames(values.technicalName);
                        
                        if (isCombo && ingredientNames.length > 0) {
                          // Show multiple concentration inputs for combination products
                          return (
                            <div key={field.key} className="block">
                              <span className="mb-1 flex items-center justify-between gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                                <span>{field.label}</span>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Combination Product</span>
                              </span>
                              <div className="space-y-2">
                                {values.activeIngredients?.map((ai, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="min-w-[120px] text-xs font-semibold text-slate-600 dark:text-slate-300">
                                      {ai.name || `Ingredient ${index + 1}`}
                                    </span>
                                    <input
                                      type="text"
                                      value={ai.concentration}
                                      onChange={(e) => {
                                        const newActiveIngredients = [...(values.activeIngredients || [])];
                                        newActiveIngredients[index] = { ...newActiveIngredients[index], concentration: e.target.value };
                                        // Also update the legacy activeIngredient field with the full combination string
                                        const combinationString = newActiveIngredients
                                          .map(item => {
                                            const name = item.name?.trim() || '';
                                            const conc = item.concentration?.trim() || '';
                                            return name && conc ? `${name} ${conc}` : (name || conc);
                                          })
                                          .filter(part => part && part.trim() !== '')
                                          .join(' ');
                                        setValues(prev => ({ 
                                          ...prev, 
                                          activeIngredients: newActiveIngredients,
                                          activeIngredient: combinationString 
                                        }));
                                      }}
                                      className="min-h-11 flex-1 rounded-lg border border-amber-200 bg-white/85 px-3 py-2 text-sm font-bold text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100 dark:border-amber-900 dark:bg-slate-950 dark:text-white dark:focus:ring-amber-900/40"
                                      placeholder="Concentration"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        // For single ingredient products, use the first concentration from activeIngredients array
                        const singleConcentration = values.activeIngredients?.[0]?.concentration || values.activeIngredient || '';
                        return (
                          <PdfInput
                            key={field.key}
                            field={field}
                            value={singleConcentration}
                            onChange={(value) => setField(field.key, value)}
                            options={fieldOptions}
                            values={values}
                          />
                        );
                      }
                      
                      // Skip activeIngredients array field - it's handled internally
                      if (field.key === 'activeIngredients') {
                        return null;
                      }
                      
                      // Ensure we only pass string values to PdfInput
                      const fieldValue = values[field.key];
                      if (typeof fieldValue !== 'string') {
                        return null;
                      }
                      
                      return (
                        <PdfInput
                          key={field.key}
                          field={field}
                          value={fieldValue}
                          onChange={(value) => setField(field.key, value)}
                          options={fieldOptions}
                          values={values}
                        />
                      );
                    })}
                  </FieldSection>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50/80 to-rose-50/80 p-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10">
                <Download className="h-3.5 w-3.5 text-red-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700">PDF Generation</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <PesticidePdfAction label="Form V(C)" busy={busy} onPreview={() => preview('VC')} onDownload={() => download('VC')} />
              <PesticidePdfAction label="Form V(D)" busy={busy} onPreview={() => preview('VD')} onDownload={() => download('VD')} />
              <PesticidePdfAction label="Form V(E)" busy={busy} onPreview={() => preview('VE')} onDownload={() => download('VE')} />
              <PesticidePdfAction label="Docket Sheet" busy={busy} onPreview={() => preview('DOCKET')} onDownload={() => download('DOCKET')} />
              <PesticidePdfAction label="All Forms" busy={busy} onPreview={previewAll} onDownload={downloadAll} primary />
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
        </div>
      </section>
      <PesticideCoveringLetterModal
        isOpen={showCoveringLetterModal}
        onClose={() => setShowCoveringLetterModal(false)}
        officerDetails={{
          officerName: values.officerName,
          qualification: values.qualification,
          manualQualification: values.manualQualification,
          designation: values.designation,
          mandal: values.mandal,
          manualMandal: values.manualMandal,
          district: values.district,
          manualDistrict: values.manualDistrict,
          pinCode: values.pincode,
          phone: '',
        }}
        coveringLetterDetails={coveringLetterDetails}
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
    </div>
    </>
  );
}

function FieldSection({ title, children, color = 'slate', onReset }: { title: string; children: React.ReactNode; color?: 'emerald' | 'blue' | 'amber' | 'slate' | 'purple'; onReset?: () => void }) {
  const colorStyles = {
    emerald: 'border-emerald-200 bg-emerald-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    slate: 'border-slate-200 bg-slate-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
  };
  
  const headerColors = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    slate: 'text-slate-700',
    purple: 'text-purple-700',
  };

  const iconButtonColors = {
    emerald: 'border-emerald-300 bg-emerald-100 text-emerald-600 hover:bg-emerald-200',
    blue: 'border-blue-300 bg-blue-100 text-blue-600 hover:bg-blue-200',
    amber: 'border-amber-300 bg-amber-100 text-amber-600 hover:bg-amber-200',
    slate: 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200',
    purple: 'border-purple-300 bg-purple-100 text-purple-600 hover:bg-purple-200',
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
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function PdfInput({ field, value, onChange, options, values }: { field: FieldConfig; value: string; onChange: (value: string) => void; options?: { label: string; value: string }[]; values?: PesticidePdfValues }) {
  const commonClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';
  
  const displayLabel = field.dynamicLabel && values?.designation === 'Asst. Director of Agriculture' && field.key === 'mandal'
    ? 'Division'
    : field.label;
  
  // Handle mandal dropdown with "Others" option
  const selectOptions = field.key === 'mandal' && options 
    ? [...options, { label: 'Others', value: 'Others' }]
    : (options || field.options || []);

  const inputElement = field.type === 'textarea' ? (
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} placeholder={field.placeholder} className={commonClass} />
  ) : field.type === 'select' ? (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={commonClass}>
      <option value="">Select...</option>
      {selectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  ) : (
    <input type={field.type === 'date' ? 'date' : 'text'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={commonClass} />
  );

  return (
    <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <span className="mb-0.5 block text-[11px] font-black tracking-wide text-slate-600">{displayLabel}</span>
      {field.key === 'dealerAddress' ? (
        <PopupHintWrapper message="Enter only D.NO, Village/Town ;Mandal & District will be autopopulated from Inspector Details">
          {inputElement}
        </PopupHintWrapper>
      ) : (
        inputElement
      )}
    </label>
  );
}

function PesticidePdfAction({ label, onPreview, onDownload, busy, primary = false }: { label: string; onPreview: () => void; onDownload: () => void; busy: boolean; primary?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 ${primary ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black text-slate-800">{label}</p>
        {primary && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">All</span>}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" onClick={onPreview} disabled={busy} className="inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button type="button" onClick={onDownload} disabled={busy} className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-black disabled:opacity-60 ${primary ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}

function loadDrafts(): SavedPesticideDraft[] {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function upsertDraft(drafts: SavedPesticideDraft[], draft: SavedPesticideDraft) {
  // Use case-insensitive comparison to prevent duplicates
  return [draft, ...drafts.filter((item) => item.name.trim().toLowerCase() !== draft.name.trim().toLowerCase())].slice(0, 30);
}

function openBlankPdfTab() {
  const targetWindow = window.open('', '_blank');
  if (targetWindow) {
    targetWindow.opener = null;
    targetWindow.document.title = 'Preparing PDF...';
    targetWindow.document.body.innerHTML = '<p style="font-family: system-ui; padding: 24px;">Preparing PDF...</p>';
  }
  return targetWindow;
}

function openDocInTab(doc: { output: (type: 'blob') => Blob }, fileName: string, targetWindow: Window | null) {
  const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  
  if (targetWindow && !targetWindow.closed) {
    try {
      targetWindow.location.href = blobUrl;
      // Add error listener to detect if PDF plugin fails
      targetWindow.onerror = () => {
        console.warn('PDF preview failed, falling back to download');
        targetWindow.close();
        downloadDoc(doc, fileName);
      };
    } catch (error) {
      console.warn('Failed to open PDF in tab, falling back to download:', error);
      targetWindow.close();
      downloadDoc(doc, fileName);
    }
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function downloadDoc(doc: { output: (type: 'blob') => Blob }, fileName: string) {
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
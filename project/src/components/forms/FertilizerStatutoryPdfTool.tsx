import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, FlaskConical, RotateCcw, Save, X /*, FileText */ } from 'lucide-react';
import {
  FertilizerPdfValues,
  FertilizerStatutoryFormType,
  generateAllFertilizerStatutoryPdf,
  generateFertilizerStatutoryPdf,
  getAllFertilizerPdfFileName,
  getFertilizerPdfFileName,
  initialFertilizerPdfValues,
} from '../../lib/statutoryFertilizerPdf';
import { FertilizerInstructionModal } from '../ui/FertilizerInstructionModal';
// import { CoveringLetterModal } from './CoveringLetterModal';
import {
  QUALIFICATION_OPTIONS,
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../../data/telanganaDistrictMandalData';

type FieldConfig = {
  key: keyof FertilizerPdfValues;
  label: string;
  type?: 'text' | 'date' | 'textarea' | 'select' | 'composition-checkboxes';
  options?: { label: string; value: string }[];
  placeholder?: string;
  displayFlag?: string;
  dynamicLabel?: boolean;
};

const STORAGE_KEY = 'tiryani-fertilizer-forms-draft';
const DRAFTS_KEY = 'tiryani-fertilizer-forms-named-drafts';
const LAST_GENERATED_KEY = 'tiryani-fertilizer-forms-last-generated';
// const COVERING_LETTER_QUEUE_KEY = 'tiryani-covering-letter-queue';
const DUPLICATE_WARNING_MESSAGE =
  'You are generating a file with the same previous sample/dealer details. Please verify whether new sample details or dealer details are required before downloading.';

/* type CoveringLetterQueueItem = {
  sampleCode: string;
  fertilizerName: string;
  quantity: string;
  dateOfSampling: string;
}; */

type SavedFertilizerDraft = {
  name: string;
  values: FertilizerPdfValues;
  updatedAt: string;
};

const physicalConditionOptions = [
  { label: 'Granular', value: 'Granular' },
  { label: 'Free flowing', value: 'Free flowing' },
  { label: 'Powder', value: 'Powder' },
  { label: 'Crystals', value: 'Crystals' },
];

const bagSourceOptions = [
  { label: 'Open bags', value: 'Open bags' },
  { label: 'Stitched bags', value: 'Stitched bags' },
  { label: 'Bulk', value: 'Bulk' },
];

const designationOptions = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture', value: 'Asst. Director of Agriculture' },
  { label: 'Fertilizer Inspector', value: 'Fertilizer Inspector' },
];

const compositionFields: FieldConfig[] = [
  { key: 'compositionN', label: 'N %', displayFlag: 'N' },
  { key: 'compositionN_T', label: 'N(T) %', displayFlag: 'N_T' },
  { key: 'compositionP_T', label: 'P(T) %', displayFlag: 'P_T' },
  { key: 'compositionP_WS', label: 'P(WS) %', displayFlag: 'P_WS' },
  { key: 'compositionP_available', label: 'P(available) %', displayFlag: 'P_available' },
  { key: 'compositionP_CS', label: 'P(CS) %', displayFlag: 'P_CS' },
  { key: 'compositionZn', label: 'Zn %', displayFlag: 'Zn' },
  { key: 'compositionP2O5_T', label: 'P2O5(T) %', displayFlag: 'P2O5_T' },
  { key: 'compositionP2O5_WS', label: 'P2O5(WS) %', displayFlag: 'P2O5_WS' },
  { key: 'compositionP2O5_CS', label: 'P2O5(CS) %', displayFlag: 'P2O5_CS' },
  { key: 'compositionK', label: 'K %', displayFlag: 'K' },
  { key: 'compositionK_T', label: 'K(T) %', displayFlag: 'K_T' },
  { key: 'compositionK2O', label: 'K2O %', displayFlag: 'K2O' },
  { key: 'compositionK2O_T', label: 'K2O(T) %', displayFlag: 'K2O_T' },
  { key: 'compositionS', label: 'S %', displayFlag: 'S' },
  { key: 'compositionCa', label: 'Ca %', displayFlag: 'Ca' },
];

const compositionDisplayOptions = [
  { key: 'N', label: 'N', group: 'N' },
  { key: 'N_T', label: 'N(T)', group: 'N' },
  { key: 'P_T', label: 'P(T)', group: 'P' },
  { key: 'P_WS', label: 'P(WS)', group: 'P' },
  { key: 'P_available', label: 'P(available)', group: 'P' },
  { key: 'P_CS', label: 'P(CS)', group: 'P' },
  { key: 'P2O5_T', label: 'P2O5(T)', group: 'P2O5' },
  { key: 'P2O5_WS', label: 'P2O5(WS)', group: 'P2O5' },
  { key: 'P2O5_CS', label: 'P2O5(CS)', group: 'P2O5' },
  { key: 'K', label: 'K', group: 'K' },
  { key: 'K_T', label: 'K(T)', group: 'K' },
  { key: 'K2O', label: 'K2O', group: 'K' },
  { key: 'K2O_T', label: 'K2O(T)', group: 'K' },
  { key: 'Zn', label: 'Zn', group: 'Other' },
  { key: 'S', label: 'S', group: 'Other' },
  { key: 'Ca', label: 'Ca', group: 'Other' },
];

const fertilizerFieldSections: { title: string; fields: FieldConfig[] }[] = [
  {
    title: 'INSPECTOR DETAILS',
    fields: [
      { key: 'officerName', label: 'INSPECTOR NAME' },
      { key: 'qualification', label: 'QUALIFICATION', type: 'select', options: QUALIFICATION_OPTIONS },
      { key: 'manualQualification', label: 'ENTER QUALIFICATION', placeholder: 'Enter qualification' },
      { key: 'designation', label: 'DESIGNATION', type: 'select', options: designationOptions },
      { key: 'district', label: 'DISTRICT', type: 'select', options: TELANGANA_DISTRICTS.map(d => ({ label: d, value: d })) },
      { key: 'mandal', label: 'MANDAL', type: 'select', options: [], dynamicLabel: true },
      { key: 'manualDistrict', label: 'ENTER DISTRICT NAME', placeholder: 'Enter district name' },
      { key: 'manualMandal', label: 'ENTER MANDAL NAME', placeholder: 'Enter mandal name' },
      { key: 'date', label: 'DATE', type: 'date' },
    ],
  },
  {
    title: 'SAMPLE DETAILS',
    fields: [
      { key: 'no', label: 'NO.' },
      { key: 'sampleCode', label: 'CODE NO. OF SAMPLE' },
      { key: 'samplingDate', label: 'DATE OF SAMPLING', type: 'date' },
      { key: 'fertilizerTypeGrade', label: 'TYPE AND GRADE OF FERTILIZER' },
      { key: 'dealerManufacturerImporterName', label: 'NAME OF DEALER/MANUFACTURER/IMPORTER', placeholder: 'company details' },
      { key: 'batchDetails', label: 'BATCH NO. AND DATE OF MANUFACTURE/IMPORT' },
      { key: 'stockReceiptDate', label: 'DATE OF RECEIPT OF STOCK', type: 'date' },
      { key: 'stockPosition', label: 'STOCK POSITION OF LOT' },
      { key: 'physicalCondition', label: 'PHYSICAL CONDITION OF SAMPLE', type: 'select', options: physicalConditionOptions },
      { key: 'bagSource', label: 'SAMPLES DRAWN FROM OPEN BAGS / STITCHED BAGS / BULK', type: 'select', options: bagSourceOptions },
    ],
  },
  {
    title: 'COMPOSITION',
    fields: [
      { key: 'compositionDisplayFlags', label: 'SELECT COMPOSITION AS ON BAG', type: 'composition-checkboxes' },
      ...compositionFields,
      { key: 'composition', label: 'ADDITIONAL COMPOSITION REMARKS', type: 'textarea' },
    ],
  },
  {
    title: 'DEALER DETAILS',
    fields: [
      { key: 'dealerName', label: 'DEALER / PARTY NAME' },
      { key: 'dealerAddress', label: 'DEALER / PARTY ADDRESS', type: 'textarea', placeholder: 'village' },
      { key: 'authorizationNumber', label: 'LETTER OF AUTHORIZATION NUMBER' },
    ],
  },
];

export function FertilizerStatutoryPdfTool({ onClose }: { onClose: () => void }) {
  const [formType, setFormType] = useState<FertilizerStatutoryFormType>('J');
  const [showInstructionModal, setShowInstructionModal] = useState(true);
  // const [showCoveringLetterModal, setShowCoveringLetterModal] = useState(false);
  const [values, setValues] = useState<FertilizerPdfValues>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const loaded = saved ? { ...initialFertilizerPdfValues, ...JSON.parse(saved) } : initialFertilizerPdfValues;
      // Always ensure default compositionDisplayFlags for new form
      loaded.compositionDisplayFlags = 'N,P_T,P_WS,P_CS,K';
      return normalizeFertilizerValues(loaded);
    } catch {
      return initialFertilizerPdfValues;
    }
  });
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<SavedFertilizerDraft[]>(() => loadFertilizerDrafts());
  const [busyAction, setBusyAction] = useState<'preview' | 'download' | 'downloadAll' | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<
    | { type: 'preview'; formType: FertilizerStatutoryFormType }
    | { type: 'download'; formType: FertilizerStatutoryFormType }
    | { type: 'previewAll' }
    | { type: 'downloadAll' }
    | null
  >(null);
  const [highlightDetails, setHighlightDetails] = useState(false);
  const dealerDetailsRef = useRef<HTMLDivElement | null>(null);
  const allFields = useMemo(() => fertilizerFieldSections, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const setField = (key: keyof FertilizerPdfValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'fertilizerTypeGrade' && (!current.nameGrade || current.nameGrade === current.fertilizerTypeGrade)) {
        next.nameGrade = value;
      }
      if (key === 'nameGrade' && (!current.fertilizerTypeGrade || current.fertilizerTypeGrade === current.nameGrade)) {
        next.fertilizerTypeGrade = value;
      }
      if (key === 'sampleCode' && (!current.codeNumber || current.codeNumber === current.sampleCode)) {
        next.codeNumber = value;
      }
      if (key === 'codeNumber' && (!current.sampleCode || current.sampleCode === current.codeNumber)) {
        next.sampleCode = value;
      }
      if (key === 'dealerName' || key === 'dealerAddress') {
        next.dealerNameAddress = buildDealerNameAddress(next);
      }
      if (key === 'officerName' || key === 'designation' || key === 'qualification' || key === 'manualQualification' || key === 'district' || key === 'mandal' || key === 'manualDistrict' || key === 'manualMandal') {
        const resolvedQualification = next.qualification === 'Others' ? next.manualQualification : next.qualification;
        const officerNameWithQualification = next.officerName && resolvedQualification 
          ? `${next.officerName}, ${resolvedQualification}`
          : next.officerName;
        const resolvedMandal = next.mandal === 'Others' ? next.manualMandal : next.mandal;
        const resolvedDistrict = next.district === 'Others' ? next.manualDistrict : next.district;
        const inspectorAddress = [officerNameWithQualification, next.designation, resolvedMandal, resolvedDistrict].filter(Boolean).join('\n');
        next.inspectorNameAddress = inspectorAddress;
        next.fromAddress = inspectorAddress;
        next.forwardReportAddress = inspectorAddress;
      }
      if (key === 'district') {
        next.mandal = '';
        next.manualDistrict = '';
        next.manualMandal = '';
      }
      if (key === 'mandal') {
        next.manualMandal = '';
        // Auto-populate place field with mandal value
        if (value && value !== 'Others') {
          next.place = value;
        }
      }
      if (key === 'manualMandal') {
        // Auto-populate place field with manual mandal value
        if (value) {
          next.place = value;
        }
      }
      if (key === 'officerName') {
        const currentDraftName = draftName.trim();
        const previousOfficerName = current.officerName.trim();
        if (!currentDraftName || currentDraftName === previousOfficerName) {
          setDraftName(value.trim());
        }
      }
      return next;
    });
    setMessage(null);
  };

  const saveDraft = () => {
    const name = buildDraftName(draftName, values);
    const nextDrafts = upsertFertilizerDraft(savedDrafts, {
      name,
      values,
      updatedAt: new Date().toISOString(),
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setDraftName(name);
    setSavedDrafts(nextDrafts);
    setMessage(`Draft saved: ${name}`);
  };

  const resetDraft = () => {
    if (!window.confirm('Reset fertilizer form draft?')) return;
    setValues(initialFertilizerPdfValues);
    window.localStorage.removeItem(STORAGE_KEY);
    setPreviewError(null);
    setMessage('Draft reset.');
  };

  const loadDraft = (name: string) => {
    const draft = savedDrafts.find((item) => item.name === name);
    if (!draft) return;
    setValues(normalizeFertilizerValues({ ...initialFertilizerPdfValues, ...draft.values }));
    setDraftName(draft.name);
    setPreviewError(null);
    setMessage(`Draft loaded: ${draft.name}`);
  };

  const deleteDraft = () => {
    const name = draftName.trim();
    if (!name) {
      setMessage('Select a saved draft to delete.');
      return;
    }
    if (!window.confirm(`Delete saved draft "${name}"?`)) return;
    const nextDrafts = savedDrafts.filter((draft) => draft.name !== name);
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setSavedDrafts(nextDrafts);
    setDraftName('');
    setMessage(`Draft deleted: ${name}`);
  };

  const completePreviewPdf = async (type = formType) => {
    // Validation removed - users can preview PDFs even with empty fields
    const targetWindow = openBlankPdfTab();
    setBusyAction('preview');
    setPreviewError(null);
    try {
      const doc = await generateFertilizerStatutoryPdf(type, values);
      openFertilizerDocInTab(doc, getFertilizerPdfFileName(type, values), targetWindow);
      rememberFertilizerGeneratedData(values);
      setFormType(type);
      setMessage('PDF preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview fertilizer PDF:', error);
      targetWindow?.close();
      setPreviewError('PDF preview could not open. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const previewPdf = async (type = formType) => {
    await completePreviewPdf(type);
  };

  const completePreviewAllPdf = async () => {
    // Validation removed - users can preview PDFs even with empty fields
    const targetWindow = openBlankPdfTab();
    setBusyAction('preview');
    setPreviewError(null);
    try {
      const doc = await generateAllFertilizerStatutoryPdf(values);
      openFertilizerDocInTab(doc, getAllFertilizerPdfFileName(values), targetWindow);
      rememberFertilizerGeneratedData(values);
      setMessage('All forms preview opened in a new tab.');
    } catch (error) {
      console.error('Unable to preview all fertilizer PDFs:', error);
      targetWindow?.close();
      setPreviewError('Preview All could not open. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const previewAllPdf = async () => {
    await completePreviewAllPdf();
  };

  const completeDownloadPdf = async (type = formType) => {
    // Validation removed - users can download PDFs even with empty fields
    setBusyAction('download');
    setPreviewError(null);
    try {
      const doc = await generateFertilizerStatutoryPdf(type, values);
      const fileName = getFertilizerPdfFileName(type, values);
      downloadFertilizerDoc(doc, fileName);
      rememberFertilizerGeneratedData(values);
      setFormType(type);
      setMessage(`PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download fertilizer PDF:', error);
      setPreviewError('PDF could not download. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadPdf = async (type = formType) => {
    if (isDuplicateFertilizerGeneration(values)) {
      setDuplicateAction({ type: 'download', formType: type });
      return;
    }
    await completeDownloadPdf(type);
  };

  const completeDownloadAllPdf = async () => {
    // Validation removed - users can download PDFs even with empty fields
    setBusyAction('downloadAll');
    setPreviewError(null);
    try {
      const doc = await generateAllFertilizerStatutoryPdf(values);
      const fileName = getAllFertilizerPdfFileName(values);
      downloadFertilizerDoc(doc, fileName);
      rememberFertilizerGeneratedData(values);
      setMessage(`All forms PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Unable to download all fertilizer PDFs:', error);
      setPreviewError('All forms PDF could not download. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const downloadAllPdf = async () => {
    if (isDuplicateFertilizerGeneration(values)) {
      setDuplicateAction({ type: 'downloadAll' });
      return;
    }
    await completeDownloadAllPdf();
  };

  const reviewDuplicateDetails = () => {
    setDuplicateAction(null);
    setHighlightDetails(true);
    dealerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      dealerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 450);
    window.setTimeout(() => setHighlightDetails(false), 3500);
  };

  const downloadAnyway = async () => {
    const action = duplicateAction;
    setDuplicateAction(null);
    if (!action) return;
    if (action.type === 'preview') await completePreviewPdf(action.formType);
    if (action.type === 'download') await completeDownloadPdf(action.formType);
    if (action.type === 'previewAll') await completePreviewAllPdf();
    if (action.type === 'downloadAll') await completeDownloadAllPdf();
  };

  const resetSampleDetails = () => {
    setValues(prev => ({
      ...prev,
      no: '',
      sampleCode: '',
      samplingDate: '',
      fertilizerTypeGrade: '',
      dealerManufacturerImporterName: '',
      batchDetails: '',
      stockReceiptDate: '',
      stockPosition: '',
      physicalCondition: '',
      bagSource: '',
    }));
    setMessage('Sample details reset successfully.');
  };

  const resetDealerDetails = () => {
    setValues(prev => ({
      ...prev,
      dealerName: '',
      dealerAddress: '',
      authorizationNumber: '',
    }));
    setMessage('Dealer details reset successfully.');
  };

  const resetComposition = () => {
    setValues(prev => ({
      ...prev,
      compositionDisplayFlags: 'N,P_T,P_WS,P_CS,K',
      composition: '',
      compositionN: '',
      compositionN_T: '',
      compositionP_T: '',
      compositionP_WS: '',
      compositionP_available: '',
      compositionZn: '',
      compositionP_CS: '',
      compositionP2O5_T: '',
      compositionP2O5_WS: '',
      compositionP2O5_CS: '',
      compositionK: '',
      compositionK_T: '',
      compositionK2O: '',
      compositionK2O_T: '',
      compositionS: '',
      compositionCa: '',
    }));
    setMessage('Composition reset successfully.');
  };

  /* const addToCoveringLetter = () => {
    if (!values.sampleCode.trim()) {
      setMessage('Sample Code is required to add to Covering Letter.');
      return;
    }

    try {
      const queue: CoveringLetterQueueItem[] = JSON.parse(window.localStorage.getItem(COVERING_LETTER_QUEUE_KEY) || '[]');
      
      const existingIndex = queue.findIndex(item => item.sampleCode === values.sampleCode.trim());
      if (existingIndex !== -1) {
        setMessage('This sample has already been added to the Covering Letter.');
        return;
      }

      const newItem: CoveringLetterQueueItem = {
        sampleCode: values.sampleCode.trim(),
        fertilizerName: values.fertilizerTypeGrade.trim(),
        quantity: values.stockPosition.trim(),
        dateOfSampling: values.samplingDate.trim(),
      };

      queue.push(newItem);
      window.localStorage.setItem(COVERING_LETTER_QUEUE_KEY, JSON.stringify(queue));
      window.dispatchEvent(new Event('local-storage-update'));
      setMessage('Sample successfully added to Covering Letter.');
    } catch (error) {
      console.error('Error adding to covering letter queue:', error);
      setMessage('Failed to add to Covering Letter. Please try again.');
    }
  }; */

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="relative flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-amber-100/50 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 opacity-50" />
          <div className="relative flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">Fertilizer sampling</p>
              <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 sm:text-lg">Generate FORM J / FORM K / FORM P</h2>
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

            <div className="mb-2 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-3 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10">
                  <Save className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">SAVED DRAFTS</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value=""
                  onChange={(event) => loadDraft(event.target.value)}
                  className="rounded-lg border border-amber-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100/50 backdrop-blur-sm transition-all"
                >
                  <option value="">Load saved draft...</option>
                  {savedDrafts.map((draft) => (
                    <option key={draft.name} value={draft.name}>
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

            {previewError && (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {previewError}
              </div>
            )}

            {message && (
              <div className="mb-2 rounded-lg border border-red-600 bg-white px-3 py-2 text-xs font-bold text-red-600">
                {message}
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              {allFields.map((section) => {
                const colorMap: Record<string, 'emerald' | 'blue' | 'amber' | 'maroon' | 'slate'> = {
                  'INSPECTOR DETAILS': 'emerald',
                  'DEALER DETAILS': 'blue',
                  'SAMPLE DETAILS': 'amber',
                  'COMPOSITION': 'maroon',
                };
                const color = colorMap[section.title] || 'slate';
                const getResetHandler = (title: string) => {
                  if (title === 'SAMPLE DETAILS') return resetSampleDetails;
                  if (title === 'DEALER DETAILS') return resetDealerDetails;
                  if (title === 'COMPOSITION') return resetComposition;
                  return undefined;
                };
                return (
                  <div
                    key={section.title}
                    ref={section.title === 'DEALER DETAILS' ? dealerDetailsRef : section.title === 'SAMPLE DETAILS' ? dealerDetailsRef : undefined}
                    className={highlightDetails && (section.title === 'DEALER DETAILS' || section.title === 'SAMPLE DETAILS') ? 'rounded-xl border-4 border-red-500' : ''}
                  >
                  <FieldSection title={section.title} color={color} onReset={getResetHandler(section.title)}>
                    {section.fields.map((field) => {
                      // Hide composition fields if their display flag is not selected
                      if (field.displayFlag) {
                        const selectedFlags = values.compositionDisplayFlags.split(',').map(f => f.trim());
                        if (!selectedFlags.includes(field.displayFlag)) {
                          return null;
                        }
                      }
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
                      // Get mandal options based on selected district
                      let fieldOptions = field.options;
                      if (field.key === 'mandal' && values.district && values.district !== 'Others') {
                        fieldOptions = getMandalsForDistrict(values.district).map(m => ({ label: m, value: m }));
                      }
                      return (
                        <PdfInput
                          key={field.key}
                          field={field}
                          value={values[field.key]}
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

            <div className="mt-3 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-3 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10">
                  <Download className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">PDF Generation</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <FertilizerPdfAction label="Form J" busy={busyAction !== null} onPreview={() => previewPdf('J')} onDownload={() => downloadPdf('J')} />
                <FertilizerPdfAction label="Form K ADA" busy={busyAction !== null} onPreview={() => previewPdf('K_ADA')} onDownload={() => downloadPdf('K_ADA')} />
                <FertilizerPdfAction label="Form K JDA" busy={busyAction !== null} onPreview={() => previewPdf('K_JDA')} onDownload={() => downloadPdf('K_JDA')} />
                <FertilizerPdfAction label="Form P" busy={busyAction !== null} onPreview={() => previewPdf('P')} onDownload={() => downloadPdf('P')} />
                <FertilizerPdfAction label="All Forms" busy={busyAction !== null} onPreview={previewAllPdf} onDownload={downloadAllPdf} primary />
              </div>
              {/* <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={addToCoveringLetter}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-md hover:bg-blue-700 hover:border-blue-700"
                >
                  <FileText className="h-4 w-4" />
                  <span>Add to Covering Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCoveringLetterModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-md hover:bg-emerald-700 hover:border-emerald-700"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Covering Letter</span>
                </button>
              </div> */}
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold leading-4 text-red-700">
                Note: Please update sample details and dealer details before generating a new file.
              </p>
            </div>

        </div>
      </section>
      <FertilizerInstructionModal
        isOpen={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
      />
      {duplicateAction && (
        <DuplicateDownloadModal onReview={reviewDuplicateDetails} onContinue={downloadAnyway} onClose={() => setDuplicateAction(null)} />
      )}
      {/* <CoveringLetterModal
        isOpen={showCoveringLetterModal}
        onClose={() => setShowCoveringLetterModal(false)}
        officerDetails={{
          mandal: values.mandal || values.manualMandal || '',
          district: values.district || values.manualDistrict || '',
          officerName: values.officerName || '',
          phone: '',
        }}
      /> */}
    </div>
  );
}

function loadFertilizerDrafts(): SavedFertilizerDraft[] {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildDraftName(name: string, values: FertilizerPdfValues) {
  const fallback = values.officerName.trim() || values.sampleCode.trim() || values.no.trim() || values.dealerManufacturerImporterName.trim();
  return (name.trim() || fallback || `Draft ${new Date().toLocaleString('en-IN')}`).slice(0, 80);
}

function upsertFertilizerDraft(drafts: SavedFertilizerDraft[], draft: SavedFertilizerDraft) {
  return [draft, ...drafts.filter((item) => item.name !== draft.name)].slice(0, 30);
}

function normalizeFertilizerValues(values: FertilizerPdfValues): FertilizerPdfValues {
  const normalized = { ...values };
  if (!normalized.dealerName && normalized.dealerNameAddress) {
    const lines = normalized.dealerNameAddress
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    normalized.dealerName = lines[0] || '';
    normalized.dealerAddress = normalized.dealerAddress || lines.slice(1).join('\n');
  }
  normalized.dealerNameAddress = buildDealerNameAddress(normalized);
  // Ensure compositionDisplayFlags has default value if missing
  if (!normalized.compositionDisplayFlags) {
    normalized.compositionDisplayFlags = 'N,P_T,P_WS,P_CS,K';
  }
  // Ensure new fields have default values for backward compatibility
  if (!normalized.qualification) {
    normalized.qualification = '';
  }
  if (!normalized.manualQualification) {
    normalized.manualQualification = '';
  }
  if (!normalized.district) {
    normalized.district = '';
  }
  if (!normalized.mandal) {
    normalized.mandal = '';
  }
  if (!normalized.manualDistrict) {
    normalized.manualDistrict = '';
  }
  if (!normalized.manualMandal) {
    normalized.manualMandal = '';
  }
  return normalized;
}

function buildDealerNameAddress(values: FertilizerPdfValues) {
  return [values.dealerName, values.dealerAddress]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n');
}

function fertilizerGenerationSnapshot(values: FertilizerPdfValues) {
  return stableFertilizerString({
    no: values.no,
    sampleCode: values.sampleCode,
    codeNumber: values.codeNumber,
    samplingDate: values.samplingDate,
    place: values.place,
    dealerNameAddress: values.dealerNameAddress,
    dealerName: values.dealerName,
    dealerAddress: values.dealerAddress,
    premisesLocation: values.premisesLocation,
    authorizationNumber: values.authorizationNumber,
    fertilizerTypeGrade: values.fertilizerTypeGrade,
    dealerManufacturerImporterName: values.dealerManufacturerImporterName,
    batchDetails: values.batchDetails,
    stockReceiptDate: values.stockReceiptDate,
    stockPosition: values.stockPosition,
    physicalCondition: values.physicalCondition,
    bagSource: values.bagSource,
  });
}

function isDuplicateFertilizerGeneration(values: FertilizerPdfValues) {
  try {
    return window.localStorage.getItem(LAST_GENERATED_KEY) === fertilizerGenerationSnapshot(values);
  } catch {
    return false;
  }
}

function rememberFertilizerGeneratedData(values: FertilizerPdfValues) {
  try {
    window.localStorage.setItem(LAST_GENERATED_KEY, fertilizerGenerationSnapshot(values));
  } catch {
    // Duplicate warning is best-effort only.
  }
}

function stableFertilizerString(value: Record<string, string>) {
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = String(value[key] ?? '').trim();
        return acc;
      }, {})
  );
}

function DuplicateDownloadModal({
  onReview,
  onContinue,
  onClose,
}: {
  onReview: () => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
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

function FieldSection({ title, children, color = 'slate', onReset }: { title: string; children: React.ReactNode; color?: 'emerald' | 'blue' | 'amber' | 'maroon' | 'slate'; onReset?: () => void }) {
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

function FertilizerPdfAction({
  label,
  onPreview,
  onDownload,
  busy,
  primary = false,
}: {
  label: string;
  onPreview: () => void;
  onDownload: () => void;
  busy: boolean;
  primary?: boolean;
}) {
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
          disabled={busy}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-black disabled:opacity-60 ${
            primary ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}

function PdfInput({
  field,
  value,
  onChange,
  options,
  values,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  options?: { label: string; value: string }[];
  values?: FertilizerPdfValues;
}) {
  const commonClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';

  const displayLabel = field.dynamicLabel && values?.designation === 'Asst. Director of Agriculture' && field.key === 'mandal'
    ? 'Division'
    : field.label;

  if (field.type === 'composition-checkboxes' || field.key === 'compositionDisplayFlags') {
    const selectedFlags = value.split(',').map(f => f.trim());
    
    const toggleFlag = (key: string) => {
      const newFlags = selectedFlags.includes(key)
        ? selectedFlags.filter(f => f !== key)
        : [...selectedFlags, key];
      onChange(newFlags.join(','));
    };

    return (
      <label className="sm:col-span-2">
        <span className="mb-2 block text-[11px] font-black tracking-wide text-emerald-700">{field.label}</span>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {compositionDisplayOptions.map((option) => (
            <label
              key={option.key}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedFlags.includes(option.key)}
                onChange={() => toggleFlag(option.key)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </label>
    );
  }

  // Handle mandal dropdown with "Others" option
  const selectOptions = field.key === 'mandal' && options 
    ? [...options, { label: 'Others', value: 'Others' }]
    : (options || field.options || []);

  return (
    <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <span className="mb-0.5 block text-[11px] font-black tracking-wide text-slate-600">{displayLabel}</span>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} placeholder={field.placeholder} className={commonClass} />
      ) : field.type === 'select' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={commonClass}>
          <option value="">Select...</option>
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className={commonClass}
        />
      )}
    </label>
  );
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

function openFertilizerDocInTab(
  doc: { output: (type: 'blob') => Blob },
  fileName: string,
  targetWindow: Window | null
) {
  const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = blobUrl;
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function downloadFertilizerDoc(doc: { output: (type: 'blob') => Blob }, fileName: string) {
  try {
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
  } catch (error) {
    console.error('PDF download failed:', error);
    // Fallback: try opening in new tab
    try {
      const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw error;
    }
  }
}

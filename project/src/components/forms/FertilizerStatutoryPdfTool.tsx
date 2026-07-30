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
  type?: 'text' | 'date' | 'textarea' | 'select' | 'composition-checkboxes' | 'micro-nutrient-checkboxes';
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

const fertilizerTypeGradeOptions = [
  { label: 'Ammonium Chloride (25% N)', value: 'Ammonium Chloride (25% N)' },
  { label: 'Ammonium Nitrate Phosphate (23-23-0)', value: 'Ammonium Nitrate Phosphate (23-23-0)' },
  { label: 'Ammonium Phosphate (14-28-0)', value: 'Ammonium Phosphate (14-28-0)' },
  { label: 'Ammonium Phosphate Sulphate (16-20-0-13)', value: 'Ammonium Phosphate Sulphate (16-20-0-13)' },
  { label: 'Ammonium Phosphate Sulphate (18-9-0)', value: 'Ammonium Phosphate Sulphate (18-9-0)' },
  { label: 'Ammonium Phosphate Sulphate (20-20-0-13)', value: 'Ammonium Phosphate Sulphate (20-20-0-13)' },
  { label: 'Ammonium Phosphate Sulphate Nitrate (20-20-0)', value: 'Ammonium Phosphate Sulphate Nitrate (20-20-0)' },
  { label: 'Ammonium Sulphate (20.5% N, 23% S)', value: 'Ammonium Sulphate (20.5% N, 23% S)' },
  { label: 'Ammonium Sulphate (20.6% N, 23% S)', value: 'Ammonium Sulphate (20.6% N, 23% S)' },
  { label: 'Calcium Ammonium Nitrate (25% N)', value: 'Calcium Ammonium Nitrate (25% N)' },
  { label: 'Calcium Ammonium Nitrate (26% N)', value: 'Calcium Ammonium Nitrate (26% N)' },
  { label: 'Diammonium Phosphate (16:44:0)', value: 'Diammonium Phosphate (16:44:0)' },
  { label: 'Diammonium Phosphate (18-46-0)', value: 'Diammonium Phosphate (18-46-0)' },
  { label: 'Mono Ammonium Phosphate (11-52-0)', value: 'Mono Ammonium Phosphate (11-52-0)' },
  { label: 'Mono Potassium Phosphate (0-52-34)', value: 'Mono Potassium Phosphate (0-52-34)' },
  { label: 'Muriate of Potash (60% K)', value: 'Muriate of Potash (60% K)' },
  { label: 'N.P.K (22-22-11)', value: 'N.P.K (22-22-11)' },
  { label: 'N.P.K. (10-26-26)', value: 'N.P.K. (10-26-26)' },
  { label: 'N.P.K. (12-32-16)', value: 'N.P.K. (12-32-16)' },
  { label: 'N.P.K. (14-28-14)', value: 'N.P.K. (14-28-14)' },
  { label: 'N.P.K. (14-35-14)', value: 'N.P.K. (14-35-14)' },
  { label: 'N.P.K. (15:15:15)', value: 'N.P.K. (15:15:15)' },
  { label: 'N.P.K. (16:16:16)', value: 'N.P.K. (16:16:16)' },
  { label: 'N.P.K. (17-17-17)', value: 'N.P.K. (17-17-17)' },
  { label: 'N.P.K. (19-19-19)', value: 'N.P.K. (19-19-19)' },
  { label: 'N.P.K.(20-10-10)', value: 'N.P.K.(20-10-10)' },
  { label: 'Nitro Phosphate (20-20-0)', value: 'Nitro Phosphate (20-20-0)' },
  { label: 'Nitrophosphate (24-24-0)', value: 'Nitrophosphate (24-24-0)' },
  { label: 'Nitrophosphate with Potash (15-15-15)', value: 'Nitrophosphate with Potash (15-15-15)' },
  { label: 'Potassium Sulphate (50% K)', value: 'Potassium Sulphate (50% K)' },
  { label: 'Single Superphosphate (16% P2O5)', value: 'Single Superphosphate (16% P2O5)' },
  { label: 'Triple Superphosphate (46% P2O5)', value: 'Triple Superphosphate (46% P2O5)' },
  { label: 'Urea (46% N)', value: 'Urea (46% N)' },
  { label: 'Urea Ammonium Nitrate (32%N)', value: 'Urea Ammonium Nitrate (32%N)' },
  { label: 'Urea Ammonium Phosphate (20-20-0)', value: 'Urea Ammonium Phosphate (20-20-0)' },
  { label: 'Urea Ammonium Phosphate (24-24-0)', value: 'Urea Ammonium Phosphate (24-24-0)' },
  { label: 'Urea Ammonium Phosphate (28-28-0)', value: 'Urea Ammonium Phosphate (28-28-0)' },
  { label: 'Urea Neemcoated (46% N)', value: 'Urea Neemcoated (46% N)' },
  { label: 'Other', value: 'Other' },
];

const microNutrientTypeGradeOptions = [
  { label: 'Ammonium Molybdate (Mo 52%)', value: 'Ammonium Molybdate (Mo 52%)' },
  { label: 'Borax (Sodium Tetraborate) (B 10.5%)', value: 'Borax (Sodium Tetraborate) (B 10.5%)' },
  { label: 'Boric Acid (B 17%)', value: 'Boric Acid (B 17%)' },
  { label: 'Chelated Iron as Fe-EDTA (Fe 12%)', value: 'Chelated Iron as Fe-EDTA (Fe 12%)' },
  { label: 'Chelated Zinc as Zn-EDTA (Zn 12%)', value: 'Chelated Zinc as Zn-EDTA (Zn 12%)' },
  { label: 'Copper Sulphate (Cu 24%, S 12%)', value: 'Copper Sulphate (Cu 24%, S 12%)' },
  { label: 'Di-Sodium Octa Borate Tetrahydrate (B 20%)', value: 'Di-Sodium Octa Borate Tetrahydrate (B 20%)' },
  { label: 'Di-Sodium Tetra Borate Pentahydrate (B 14.5%)', value: 'Di-Sodium Tetra Borate Pentahydrate (B 14.5%)' },
  { label: 'Di-Sodium Tetra Borate Pentahydrate (B 15%)', value: 'Di-Sodium Tetra Borate Pentahydrate (B 15%)' },
  { label: 'Ferrous Sulphate (Fe 19%, S 10.5%)', value: 'Ferrous Sulphate (Fe 19%, S 10.5%)' },
  { label: 'Magnesium Sulphate (Mg 9.5%, S 12%)', value: 'Magnesium Sulphate (Mg 9.5%, S 12%)' },
  { label: 'Manganese Sulphate (Mn 30.5%, S 17%)', value: 'Manganese Sulphate (Mn 30.5%, S 17%)' },
  { label: 'Zinc Sulphate Heptahydrate (Zn 21%, S 10%)', value: 'Zinc Sulphate Heptahydrate (Zn 21%, S 10%)' },
  { label: 'Zinc Sulphate Monohydrate (Zn 33%, S 15%)', value: 'Zinc Sulphate Monohydrate (Zn 33%, S 15%)' },
  { label: 'Other', value: 'Other' },
];

const microNutrientCompositionMap: Record<string, { Zn?: string; Cu?: string; S?: string; Mn?: string; Mg?: string; B?: string; Fe?: string; Mo?: string; Zn_EDTA?: string; Fe_EDTA?: string; Cd?: string }> = {
  'Ammonium Molybdate (Mo 52%)': { Mo: '52%' },
  'Borax (Sodium Tetraborate) (B 10.5%)': { B: '10.5%' },
  'Boric Acid (B 17%)': { B: '17%' },
  'Chelated Iron as Fe-EDTA (Fe 12%)': { Fe_EDTA: '12%' },
  'Chelated Zinc as Zn-EDTA (Zn 12%)': { Zn_EDTA: '12%' },
  'Copper Sulphate (Cu 24%, S 12%)': { Cu: '24%', S: '12%' },
  'Di-Sodium Octa Borate Tetrahydrate (B 20%)': { B: '20%' },
  'Di-Sodium Tetra Borate Pentahydrate (B 14.5%)': { B: '14.5%' },
  'Di-Sodium Tetra Borate Pentahydrate (B 15%)': { B: '15%' },
  'Ferrous Sulphate (Fe 19%, S 10.5%)': { Fe: '19%', S: '10.5%' },
  'Magnesium Sulphate (Mg 9.5%, S 12%)': { Mg: '9.5%', S: '12%' },
  'Manganese Sulphate (Mn 30.5%, S 17%)': { Mn: '30.5%', S: '17%' },
  'Zinc Sulphate Heptahydrate (Zn 21%, S 10%)': { Zn: '21%', S: '10%' },
  'Zinc Sulphate Monohydrate (Zn 33%, S 15%)': { Zn: '33%', S: '15%' },
};

const fertilizerCategoryOptions = [
  { label: 'Macro Nutrient Fertilizers', value: 'Macro Nutrient Fertilizers' },
  { label: 'Micro Nutrient Fertilizers', value: 'Micro Nutrient Fertilizers' },
  { label: 'Water Soluble Fertilizers', value: 'Water Soluble Fertilizers' },
];

const waterSolubleTypeGradeOptions = [
  { label: 'Calcium Nitrate (N 15.5%, Ca 18.8%)', value: 'Calcium Nitrate (N 15.5%, Ca 18.8%)' },
  { label: 'Mono Ammonium Phosphate (12:61:0)', value: 'Mono Ammonium Phosphate (12:61:0)' },
  { label: 'Mono Potassium Phosphate (0:52:34)', value: 'Mono Potassium Phosphate (0:52:34)' },
  { label: 'NPK 12:30:15', value: 'NPK 12:30:15' },
  { label: 'NPK 12:32:14', value: 'NPK 12:32:14' },
  { label: 'NPK 13:5:26', value: 'NPK 13:5:26' },
  { label: 'NPK 13:40:13', value: 'NPK 13:40:13' },
  { label: 'NPK 18:18:18', value: 'NPK 18:18:18' },
  { label: 'NPK 19:19:19', value: 'NPK 19:19:19' },
  { label: 'NPK 20:20:20', value: 'NPK 20:20:20' },
  { label: 'NPK 6:12:36', value: 'NPK 6:12:36' },
  { label: 'NPK 7.6:23.5:7.6:3.5 (Zn)', value: 'NPK 7.6:23.5:7.6:3.5 (Zn)' },
  { label: 'Potassium Magnesium Sulphate (K₂O 22%, MgO 18%, S 20%)', value: 'Potassium Magnesium Sulphate (K₂O 22%, MgO 18%, S 20%)' },
  { label: 'Potassium Nitrate (13:0:45)', value: 'Potassium Nitrate (13:0:45)' },
  { label: 'Urea Phosphate (17:44:0)', value: 'Urea Phosphate (17:44:0)' },
  { label: 'Urea Phosphate with SOP (18:18:18)', value: 'Urea Phosphate with SOP (18:18:18)' },
  { label: 'Other', value: 'Other' },
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

const microNutrientCompositionFields: FieldConfig[] = [
  { key: 'microZn', label: 'Zn %' },
  { key: 'microCu', label: 'Cu %' },
  { key: 'microS', label: 'S %' },
  { key: 'microMn', label: 'Mn %' },
  { key: 'microMg', label: 'Mg %' },
  { key: 'microB', label: 'B %' },
  { key: 'microFe', label: 'Fe %' },
  { key: 'microMo', label: 'Mo %' },
  { key: 'microZn_EDTA', label: 'Zn-EDTA %' },
  { key: 'microFe_EDTA', label: 'Fe-EDTA %' },
  { key: 'microCd', label: 'Cd %' },
];

const microNutrientCheckboxOptions = [
  { key: 'Zn', label: 'Zn' },
  { key: 'Cu', label: 'Cu' },
  { key: 'S', label: 'S' },
  { key: 'Mn', label: 'Mn' },
  { key: 'Mg', label: 'Mg' },
  { key: 'B', label: 'B' },
  { key: 'Fe', label: 'Fe' },
  { key: 'Mo', label: 'Mo' },
  { key: 'Zn_EDTA', label: 'Zn-EDTA' },
  { key: 'Fe_EDTA', label: 'Fe-EDTA' },
  { key: 'Cd', label: 'Cd' },
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
      { key: 'fertilizerCategory', label: 'FERTILIZER CATEGORY', type: 'select', options: fertilizerCategoryOptions },
      { key: 'fertilizerTypeGrade', label: 'NAME AND GRADE OF FERTILIZER', type: 'select', options: fertilizerTypeGradeOptions },
      { key: 'manualFertilizerTypeGrade', label: 'ENTER FERTILIZER TYPE AND GRADE', placeholder: 'Enter fertilizer type and grade' },
      { key: 'microNutrientTypeGrade', label: 'NAME AND GRADE OF MICRO NUTRIENT', type: 'select', options: microNutrientTypeGradeOptions },
      { key: 'manualMicroNutrientTypeGrade', label: 'ENTER MICRO NUTRIENT TYPE AND GRADE', placeholder: 'Enter micro nutrient type and grade' },
      { key: 'waterSolubleTypeGrade', label: 'NAME AND GRADE OF WATER SOLUBLE FERTILIZER', type: 'select', options: waterSolubleTypeGradeOptions },
      { key: 'manualWaterSolubleTypeGrade', label: 'ENTER WATER SOLUBLE FERTILIZER TYPE AND GRADE', placeholder: 'Enter water soluble fertilizer type and grade' },
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
      { key: 'microNutrientCheckboxes', label: 'MICRO NUTRIENT COMPOSITION', type: 'micro-nutrient-checkboxes' },
      ...microNutrientCompositionFields,
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
        const inspectorAddress = [officerNameWithQualification, next.designation, resolvedMandal ? `${resolvedMandal} Mandal` : '', resolvedDistrict].filter(Boolean).join('\n');
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
      if (key === 'date') {
        // Auto-populate samplingDate from date field
        if (value && (!current.samplingDate || current.samplingDate === current.date)) {
          next.samplingDate = value;
        }
      }
      if (key === 'fertilizerTypeGrade') {
        // Clear manual field when switching from Other
        if (value !== 'Other') {
          next.manualFertilizerTypeGrade = '';
        }
      }
      if (key === 'microNutrientTypeGrade') {
        // Clear manual field when switching from Other
        if (value !== 'Other') {
          next.manualMicroNutrientTypeGrade = '';
        }
        // Clear all micro nutrient composition fields first
        next.microZn = '';
        next.microCu = '';
        next.microS = '';
        next.microMn = '';
        next.microMg = '';
        next.microB = '';
        next.microFe = '';
        next.microMo = '';
        next.microZn_EDTA = '';
        next.microFe_EDTA = '';
        next.microCd = '';
        // Auto-populate only relevant micro nutrient composition from selected fertilizer
        if (value && microNutrientCompositionMap[value]) {
          const composition = microNutrientCompositionMap[value];
          if (composition.Zn) next.microZn = composition.Zn;
          if (composition.Cu) next.microCu = composition.Cu;
          if (composition.S) next.microS = composition.S;
          if (composition.Mn) next.microMn = composition.Mn;
          if (composition.Mg) next.microMg = composition.Mg;
          if (composition.B) next.microB = composition.B;
          if (composition.Fe) next.microFe = composition.Fe;
          if (composition.Mo) next.microMo = composition.Mo;
          if (composition.Zn_EDTA) next.microZn_EDTA = composition.Zn_EDTA;
          if (composition.Fe_EDTA) next.microFe_EDTA = composition.Fe_EDTA;
          if (composition.Cd) next.microCd = composition.Cd;
          // Auto-tick relevant micro nutrient checkboxes
          const checkedNutrients: string[] = [];
          if (composition.Zn) checkedNutrients.push('Zn');
          if (composition.Cu) checkedNutrients.push('Cu');
          if (composition.S) checkedNutrients.push('S');
          if (composition.Mn) checkedNutrients.push('Mn');
          if (composition.Mg) checkedNutrients.push('Mg');
          if (composition.B) checkedNutrients.push('B');
          if (composition.Fe) checkedNutrients.push('Fe');
          if (composition.Mo) checkedNutrients.push('Mo');
          if (composition.Zn_EDTA) checkedNutrients.push('Zn_EDTA');
          if (composition.Fe_EDTA) checkedNutrients.push('Fe_EDTA');
          if (composition.Cd) checkedNutrients.push('Cd');
          next.microNutrientCheckboxes = checkedNutrients.join(',');
        } else {
          // Clear checkboxes when Other is selected
          next.microNutrientCheckboxes = '';
        }
      }
      if (key === 'fertilizerCategory') {
        // Clear fertilizer type/grade fields when switching categories
        next.fertilizerTypeGrade = '';
        next.manualFertilizerTypeGrade = '';
        next.microNutrientTypeGrade = '';
        next.manualMicroNutrientTypeGrade = '';
        next.waterSolubleTypeGrade = '';
        next.manualWaterSolubleTypeGrade = '';
      }
      if (key === 'waterSolubleTypeGrade') {
        // Clear manual field when switching from Other
        if (value !== 'Other') {
          next.manualWaterSolubleTypeGrade = '';
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
      fertilizerCategory: '',
      fertilizerTypeGrade: '',
      manualFertilizerTypeGrade: '',
      microNutrientTypeGrade: '',
      manualMicroNutrientTypeGrade: '',
      waterSolubleTypeGrade: '',
      manualWaterSolubleTypeGrade: '',
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
      microZn: '',
      microCu: '',
      microS: '',
      microMn: '',
      microMg: '',
      microB: '',
      microFe: '',
      microMo: '',
      microZn_EDTA: '',
      microFe_EDTA: '',
      microCd: '',
      microNutrientCheckboxes: '',
    }));
    setMessage('Composition details reset successfully.');
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
                      // Hide manual fertilizer type/grade field unless fertilizerTypeGrade is "Other"
                      if (field.key === 'manualFertilizerTypeGrade' && values.fertilizerTypeGrade !== 'Other') {
                        return null;
                      }
                      // Hide manual micro nutrient type/grade field unless microNutrientTypeGrade is "Other"
                      if (field.key === 'manualMicroNutrientTypeGrade' && values.microNutrientTypeGrade !== 'Other') {
                        return null;
                      }
                      // Hide macro nutrient dropdown unless category is "Macro Nutrient Fertilizers"
                      if (field.key === 'fertilizerTypeGrade' && values.fertilizerCategory !== 'Macro Nutrient Fertilizers') {
                        return null;
                      }
                      // Hide micro nutrient dropdown unless category is "Micro Nutrient Fertilizers"
                      if (field.key === 'microNutrientTypeGrade' && values.fertilizerCategory !== 'Micro Nutrient Fertilizers') {
                        return null;
                      }
                      // Hide manual water soluble field unless waterSolubleTypeGrade is "Other"
                      if (field.key === 'manualWaterSolubleTypeGrade' && values.waterSolubleTypeGrade !== 'Other') {
                        return null;
                      }
                      // Hide water soluble dropdown unless category is "Water Soluble Fertilizers"
                      if (field.key === 'waterSolubleTypeGrade' && values.fertilizerCategory !== 'Water Soluble Fertilizers') {
                        return null;
                      }
                      // Hide regular composition fields when category is "Micro Nutrient Fertilizers"
                      if (values.fertilizerCategory === 'Micro Nutrient Fertilizers' && compositionFields.some(f => f.key === field.key)) {
                        return null;
                      }
                      // Hide micro nutrient composition fields unless category is "Micro Nutrient Fertilizers"
                      if (values.fertilizerCategory !== 'Micro Nutrient Fertilizers' && microNutrientCompositionFields.some(f => f.key === field.key)) {
                        return null;
                      }
                      // Show micro nutrient composition fields based on checked checkboxes
                      if (values.fertilizerCategory === 'Micro Nutrient Fertilizers' && microNutrientCompositionFields.some(f => f.key === field.key)) {
                        const checkedNutrients = values.microNutrientCheckboxes.split(',').map(n => n.trim()).filter(Boolean);
                        const fieldToCompositionKey: Record<string, string> = {
                          microZn: 'Zn',
                          microCu: 'Cu',
                          microS: 'S',
                          microMn: 'Mn',
                          microMg: 'Mg',
                          microB: 'B',
                          microFe: 'Fe',
                          microMo: 'Mo',
                          microZn_EDTA: 'Zn_EDTA',
                          microFe_EDTA: 'Fe_EDTA',
                          microCd: 'Cd',
                        };
                        const compositionKey = fieldToCompositionKey[field.key];
                        if (compositionKey && !checkedNutrients.includes(compositionKey)) {
                          return null;
                        }
                      }
                      // Hide composition display flags when category is "Micro Nutrient Fertilizers"
                      if (field.key === 'compositionDisplayFlags' && values.fertilizerCategory === 'Micro Nutrient Fertilizers') {
                        return null;
                      }
                      // Hide micro nutrient checkboxes unless category is "Micro Nutrient Fertilizers"
                      if (field.key === 'microNutrientCheckboxes' && values.fertilizerCategory !== 'Micro Nutrient Fertilizers') {
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
  
  // Resolve fertilizer type/grade based on category and Other selection
  if (normalized.fertilizerCategory === 'Micro Nutrient Fertilizers') {
    if (normalized.microNutrientTypeGrade === 'Other') {
      normalized.fertilizerTypeGrade = normalized.manualMicroNutrientTypeGrade;
    } else {
      normalized.fertilizerTypeGrade = normalized.microNutrientTypeGrade;
    }
  } else if (normalized.fertilizerCategory === 'Water Soluble Fertilizers') {
    if (normalized.waterSolubleTypeGrade === 'Other') {
      normalized.fertilizerTypeGrade = normalized.manualWaterSolubleTypeGrade;
    } else {
      normalized.fertilizerTypeGrade = normalized.waterSolubleTypeGrade;
    }
  } else {
    if (normalized.fertilizerTypeGrade === 'Other') {
      normalized.fertilizerTypeGrade = normalized.manualFertilizerTypeGrade;
    }
  }
  
  // Rebuild inspector address with Mandal suffix
  const resolvedQualification = normalized.qualification === 'Others' ? normalized.manualQualification : normalized.qualification;
  const officerNameWithQualification = normalized.officerName && resolvedQualification 
    ? `${normalized.officerName}, ${resolvedQualification}`
    : normalized.officerName;
  const resolvedMandal = normalized.mandal === 'Others' ? normalized.manualMandal : normalized.mandal;
  const resolvedDistrict = normalized.district === 'Others' ? normalized.manualDistrict : normalized.district;
  const inspectorAddress = [officerNameWithQualification, normalized.designation, resolvedMandal ? `${resolvedMandal} Mandal` : '', resolvedDistrict].filter(Boolean).join('\n');
  normalized.inspectorNameAddress = inspectorAddress;
  normalized.fromAddress = inspectorAddress;
  normalized.forwardReportAddress = inspectorAddress;
  
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
  if (!normalized.manualFertilizerTypeGrade) {
    normalized.manualFertilizerTypeGrade = '';
  }
  if (!normalized.fertilizerCategory) {
    normalized.fertilizerCategory = '';
  }
  if (!normalized.microNutrientTypeGrade) {
    normalized.microNutrientTypeGrade = '';
  }
  if (!normalized.manualMicroNutrientTypeGrade) {
    normalized.manualMicroNutrientTypeGrade = '';
  }
  if (!normalized.waterSolubleTypeGrade) {
    normalized.waterSolubleTypeGrade = '';
  }
  if (!normalized.manualWaterSolubleTypeGrade) {
    normalized.manualWaterSolubleTypeGrade = '';
  }
  if (!normalized.microZn) {
    normalized.microZn = '';
  }
  if (!normalized.microCu) {
    normalized.microCu = '';
  }
  if (!normalized.microS) {
    normalized.microS = '';
  }
  if (!normalized.microMn) {
    normalized.microMn = '';
  }
  if (!normalized.microMg) {
    normalized.microMg = '';
  }
  if (!normalized.microB) {
    normalized.microB = '';
  }
  if (!normalized.microFe) {
    normalized.microFe = '';
  }
  if (!normalized.microMo) {
    normalized.microMo = '';
  }
  if (!normalized.microZn_EDTA) {
    normalized.microZn_EDTA = '';
  }
  if (!normalized.microFe_EDTA) {
    normalized.microFe_EDTA = '';
  }
  if (!normalized.microCd) {
    normalized.microCd = '';
  }
  if (!normalized.microNutrientCheckboxes) {
    normalized.microNutrientCheckboxes = '';
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
  let resolvedFertilizerTypeGrade = '';
  if (values.fertilizerCategory === 'Micro Nutrient Fertilizers') {
    resolvedFertilizerTypeGrade = values.microNutrientTypeGrade === 'Other' ? values.manualMicroNutrientTypeGrade : values.microNutrientTypeGrade;
  } else if (values.fertilizerCategory === 'Water Soluble Fertilizers') {
    resolvedFertilizerTypeGrade = values.waterSolubleTypeGrade === 'Other' ? values.manualWaterSolubleTypeGrade : values.waterSolubleTypeGrade;
  } else {
    resolvedFertilizerTypeGrade = values.fertilizerTypeGrade === 'Other' ? values.manualFertilizerTypeGrade : values.fertilizerTypeGrade;
  }
  
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
    fertilizerTypeGrade: resolvedFertilizerTypeGrade,
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

  if (field.type === 'micro-nutrient-checkboxes' || field.key === 'microNutrientCheckboxes') {
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
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2">
          {microNutrientCheckboxOptions.map((option) => (
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

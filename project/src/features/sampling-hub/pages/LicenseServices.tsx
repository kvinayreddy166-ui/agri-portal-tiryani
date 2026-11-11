import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { FileText, ChevronRight, CheckCircle, ExternalLink, Copy, BadgeCheck, MapPin, KeyRound, Landmark, IndianRupee, Info, Store, ClipboardList, Sprout, ArrowUpRight, FileCheck, ReceiptText, FlaskConical, Bug, SlidersHorizontal } from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { TELANGANA_DISTRICTS, getDivisionsForDistrict } from '../../../shared/data/telanganaDistrictMandalData';

// DDO Code mapping for Districts and Divisions
const DISTRICT_DDO_CODES: Record<string, string> = {
  'Adilabad': '01010102001',
  'Bhadradri Kothagudem': '09010102006',
  'Hanumakonda': '12010102007',
  'Hanamkonda': '12010102007',
  'Jagtial': '06010102005',
  'Jangaon': '19010102017',
  'Jayashankar Bhupalpally': '08010102001',
  'Jogulamba Gadwal': '26010102003',
  'Kamareddy': '15010102003',
  'Karimnagar': '13010102001',
  'Khammam': '31010102002',
  'Kumurambheem Asifabad': '02010102003',
  'Kumrambheem Asifabad': '02010102003',
  'Mahabubabad': '10010102001',
  'Mahabubnagar': '22010102001',
  'Mancherial': '3010102004',
  'Medak': '17010102002',
  'Medchal–Malkajgiri': '21010102003',
  'Mulugu': '35010102002',
  'Nagarkurnool': '28010102003',
  'Nalgonda': '29010102004',
  'Narayanpet': '34010102001',
  'Nirmal': '04010102002',
  'Nizamabad': '05010102001',
  'Peddapalli': '07010102002',
  'Rajanna Sircilla': '14010102003',
  'Ranga Reddy': '23010102004',
  'Sangareddy': '16010102002',
  'Siddipet': '18010102003',
  'Suryapet': '30010102002',
  'Vikarabad': '24010102005',
  'Wanaparthy': '27010102003',
  'Warangal': '11010102001',
  'Yadadri Bhuvanagiri': '20010102004',
};

const DIVISION_DDO_CODES: Record<string, Record<string, string>> = {
  'Mahabubnagar': {
    'Mahabubnagar Rural': '22010102002',
  },
  'Jayashankar Bhupalpally': {
    'Mahadevpur': '08030102001',
    'Bhupalpally': '08010102020',
  },
  'Kumurambheem Asifabad': {
    'Asifabad': '02010102001',
    'Kagaznagar': '02020102001',
    'Sirpur U': '02010102002',
  },
  'Kumrambheem Asifabad': {
    'Asifabad': '02010102001',
    'Kagaznagar': '02020102001',
    'Sirpur U': '02010102002',
  },
  'Mancherial': {
    'Mancherial': '03010102001',
    'Chennur': '03030102001',
  },
};

type LicenseType = 'fertilizer' | 'seed' | 'insecticide';
type ApplicationType = 'fresh' | 'renewal' | 'renewal_grace_period' | 'amendment' | 'duplicate' | 'pc_inclusion';
type DealerType = 'wholesaler' | 'retailer' | 'coop_societies' | 'manufacturing_license';
type AreaType = 'municipal' | 'rural' | 'manufacturing_license';

type FertilizerAmendmentType =
  | 'change_of_address'
  | 'change_of_name'
  | 'addition_of_godown'
  | 'deletion_of_godown'
  | 'addition_of_person'
  | 'deletion_of_person'
  | 'inclusion_of_form_o';

type SeedAmendmentType =
  | 'change_in_address'
  | 'change_in_name'
  | 'inclusion_of_storage'
  | 'deletion_of_storage'
  | 'change_of_salepoint'
  | 'change_of_person'
  | 'inclusion_of_certificate'
  | 'deletion_of_certificate';

type InsecticideAmendmentType =
  | 'change_of_firm_name'
  | 'change_in_address_salepoint'
  | 'transfer_of_license'
  | 'inclusion_of_storage'
  | 'deletion_of_storage'
  | 'change_of_expert_staff'
  | 'deletion_of_expert_staff'
  | 'change_of_person_responsible'
  | 'inclusion_of_insecticides'
  | 'extension_of_lease';

const FERTILIZER_AMENDMENT_TYPES: Record<FertilizerAmendmentType, string> = {
  change_of_address: 'Change of Address of the Sale Point',
  change_of_name: 'Change in Name of the Office / Salepoint',
  addition_of_godown: 'Addition of Godown',
  deletion_of_godown: 'Deletion of Godown',
  addition_of_person: 'Addition of Person Responsible',
  deletion_of_person: 'Deletion of Person Responsible',
  inclusion_of_form_o: 'Inclusion of Form-O',
};

const SEED_AMENDMENT_TYPES: Record<SeedAmendmentType, string> = {
  change_in_address: 'Change in Address of the Office',
  change_in_name: 'Change in Name of Office',
  inclusion_of_storage: 'Inclusion of Storage',
  deletion_of_storage: 'Deletion of Storage',
  change_of_salepoint: 'Change of Salepoint',
  change_of_person: 'Change of Person Responsible',
  inclusion_of_certificate: 'Inclusion of Certificate of Source of Seeds / Principal Certificate',
  deletion_of_certificate: 'Deletion of Certificate of Source of Seeds / Principal Certificate',
};

const INSECTICIDE_AMENDMENT_TYPES: Record<InsecticideAmendmentType, string> = {
  change_of_firm_name: 'Change of Firm Name',
  change_in_address_salepoint: 'Change in Address of the Salepoint',
  transfer_of_license: 'Transfer Of License',
  inclusion_of_storage: 'Inclusion of Storage premises',
  deletion_of_storage: 'Deletion of Storage premises',
  change_of_expert_staff: 'Change of Expert Staff',
  deletion_of_expert_staff: 'Deletion of Expert Staff',
  change_of_person_responsible: 'Change of Person Responsible For Legal Correspondence',
  inclusion_of_insecticides: 'Inclusion of Insecticides',
  extension_of_lease: 'Extension of Lease Agreement',
};

const LICENSE_CATEGORIES = [
  {
    id: 'fertilizer' as const,
    label: 'Fertilizer',
    telugu: 'ఎరువులు',
    subtext: 'Retail / Wholesale / Mfg',
    subtextTelugu: 'రిటైల్ / హోల్‌సేల్ / తయారీ',
    icon: FlaskConical,
    tone: 'sky',
  },
  {
    id: 'seed' as const,
    label: 'Seed',
    telugu: 'విత్తనాలు',
    subtext: 'Fresh / Renewal / Amendment',
    subtextTelugu: 'కొత్తది / పునరుద్ధరణ / సవరణ',
    icon: Sprout,
    tone: 'emerald',
  },
  {
    id: 'insecticide' as const,
    label: 'Pesticide',
    telugu: 'పురుగుమందులు',
    subtext: 'Urban / Rural / Mfg / PC',
    subtextTelugu: 'అర్బన్ / రూరల్ / తయారీ / PC',
    icon: Bug,
    tone: 'amber',
  },
] as const;

export function LicenseServices() {
  const { user, isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const isLoginUser = Boolean(user) || isAdminUser || isTestUser || isOfficerUser;
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [licenseType, setLicenseType] = useState<LicenseType | ''>('');
  const [applicationType, setApplicationType] = useState<ApplicationType | ''>('');
  const [dealerType, setDealerType] = useState<DealerType | ''>('');
  const [areaType, setAreaType] = useState<AreaType | ''>('');
  const [numberOfProducts, setNumberOfProducts] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [division, setDivision] = useState<string>('');
  const [customDivision, setCustomDivision] = useState<string>('');
  const resolvedDivision = division === 'Others' ? customDivision.trim() : division;
  const [ddoCode, setDdoCode] = useState<string>('');
  const [fertilizerAmendmentType, setFertilizerAmendmentType] = useState<FertilizerAmendmentType | ''>('');
  const [seedAmendmentType, setSeedAmendmentType] = useState<SeedAmendmentType | ''>('');
  const [insecticideAmendmentType, setInsecticideAmendmentType] = useState<InsecticideAmendmentType | ''>('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Reset application type when license type changes
  React.useEffect(() => {
    setApplicationType('');
    setDealerType('');
    setAreaType('');
    setNumberOfProducts('');
    setDistrict('');
    setDivision('');
    setCustomDivision('');
    setDdoCode('');
    setFertilizerAmendmentType('');
    setSeedAmendmentType('');
    setInsecticideAmendmentType('');
  }, [licenseType]);

  // Reset amendment type when application type changes
  React.useEffect(() => {
    setFertilizerAmendmentType('');
    setSeedAmendmentType('');
    setInsecticideAmendmentType('');
  }, [applicationType]);

  // Reset division when district changes
  React.useEffect(() => {
    setDivision('');
    setCustomDivision('');
  }, [district]);

  // Auto-fill DDO code based on district and division
  React.useEffect(() => {
    if (resolvedDivision && district) {
      const divisionDdoCode = DIVISION_DDO_CODES[district]?.[resolvedDivision];
      // Show only the division's own DDO code - never fall back to the district code for unmapped divisions
      setDdoCode(divisionDdoCode || '');
    } else if (district) {
      const districtDdoCode = DISTRICT_DDO_CODES[district];
      if (districtDdoCode) {
        setDdoCode(districtDdoCode);
      } else {
        setDdoCode(''); // Clear if no code found
      }
    } else {
      setDdoCode(''); // Clear when district is cleared
    }
  }, [district, resolvedDivision]);

  const showFertilizerAmendmentType = licenseType === 'fertilizer' && applicationType === 'amendment';
  const showSeedAmendmentType = licenseType === 'seed' && applicationType === 'amendment';
  const showInsecticideAmendmentType = licenseType === 'insecticide' && applicationType === 'amendment';
  const showDealerType = licenseType === 'fertilizer';
  const showAreaType = licenseType === 'insecticide';
  const showNumberOfProducts = licenseType === 'insecticide' && areaType !== '' && 
    (applicationType === 'pc_inclusion' || areaType === 'manufacturing_license');
  const showDivision = licenseType === 'fertilizer' && (dealerType === 'retailer' || dealerType === 'coop_societies');
  const showChallanDetails = applicationType !== '' && district !== '' &&
    (showDivision ? resolvedDivision !== '' : true) &&
    (licenseType === 'fertilizer' ? dealerType !== '' : true) &&
    (licenseType === 'insecticide' && (applicationType === 'pc_inclusion' || areaType === 'manufacturing_license') ? areaType !== '' && numberOfProducts !== '' : true) &&
    (licenseType === 'insecticide' && applicationType !== 'pc_inclusion' && areaType !== 'manufacturing_license' ? areaType !== '' : true);
  const getAmount = () => {
    const isFertilizerWholesaler = licenseType === 'fertilizer' && dealerType === 'wholesaler';
    const isFertilizerCoopSocieties = licenseType === 'fertilizer' && dealerType === 'coop_societies';
    const isFertilizerManufacturingLicense = licenseType === 'fertilizer' && dealerType === 'manufacturing_license';
    
    if (licenseType === 'seed') {
      if (applicationType === 'fresh') return 1000;
      if (applicationType === 'renewal') return 500;
      if (applicationType === 'renewal_grace_period') return 1000;
      if (applicationType === 'amendment') return 50;
      if (applicationType === 'duplicate') return 50;
    }
    
    if (licenseType === 'insecticide') {
      const isMunicipal = areaType === 'municipal';
      const isManufacturingLicense = areaType === 'manufacturing_license';
      
      // Manufacturing License fee structure
      if (isManufacturingLicense) {
        const productCount = numberOfProducts === '10+' ? 10 : parseInt(numberOfProducts) || 0;
        const calculatedAmount = Math.min(productCount * 2000, 20000); // ₹2,000 per product, max ₹20,000
        
        if (applicationType === 'fresh') return calculatedAmount;
        if (applicationType === 'pc_inclusion') return calculatedAmount;
      }
      
      // Existing Urban/Rural fee structure
      const productCount = numberOfProducts === '15+' ? 15 : parseInt(numberOfProducts) || 0;
      
      // Rural areas: 100 per product, 15+ = 1500
      // Municipal areas: 500 per product, 15+ = 7500
      const baseRate = isMunicipal ? 500 : 100;
      const thresholdAmount = isMunicipal ? 7500 : 1500;
      
      if (productCount >= 15) {
        return thresholdAmount;
      }
      
      const calculatedAmount = productCount * baseRate;
      
      if (applicationType === 'fresh') return isMunicipal ? 7500 : 1500;
      if (applicationType === 'renewal') return isMunicipal ? 7500 : 1500;
      if (applicationType === 'amendment') {
        if (insecticideAmendmentType === 'inclusion_of_insecticides') return 1500;
        return 1500;
      }
      if (applicationType === 'pc_inclusion') return calculatedAmount;
      if (applicationType === 'duplicate') return 100;
    }
    
    if (licenseType === 'fertilizer') {
      // Coop. Societies fee structure
      if (isFertilizerCoopSocieties) {
        if (applicationType === 'fresh') return 500;
        if (applicationType === 'renewal') return 500;
        if (applicationType === 'renewal_grace_period') return 1500;
        if (applicationType === 'amendment') return 500;
        if (applicationType === 'duplicate') return 250;
      }
      
      // Manufacturing License fee structure
      if (isFertilizerManufacturingLicense) {
        if (applicationType === 'fresh') return 5000;
        if (applicationType === 'renewal') return 5000;
        if (applicationType === 'renewal_grace_period') return 6000;
        if (applicationType === 'amendment') return 1000;
        if (applicationType === 'duplicate') return 500;
      }
      
      // Existing Wholesaler and Retailer fee structure
      if (applicationType === 'fresh') return isFertilizerWholesaler ? 4500 : 2500;
      if (applicationType === 'renewal') return isFertilizerWholesaler ? 4500 : 2500;
      if (applicationType === 'renewal_grace_period') return isFertilizerWholesaler ? 5500 : 3500;
      if (applicationType === 'amendment') return isFertilizerWholesaler ? 1000 : 500;
      if (applicationType === 'duplicate') return isFertilizerWholesaler ? 500 : 250;
    }
    
    return 0;
  };

  const getChallanHeads = () => {
    if (licenseType === 'insecticide') {
      return {
        majorHead: '0401 (Crop Husbandry)',
        subMajorHead: '00 (Not Applicable)',
        minorHead: '107 (Receipts from Plant Protection Services)',
        groupSubHead: '00 (Not Applicable)',
        subHead: '01 (Receipts from Plant Protection Services)',
      };
    }
    return {
      majorHead: '0401 (Crop Husbandry)',
      subMajorHead: '00',
      minorHead: '800 (Other Receipts)',
      groupSubHead: '00',
      subHead: '81 (Other Receipts)',
    };
  };

  const getChallanCode = () => {
    if (licenseType === 'insecticide') {
      return '0401001070001000000NVN - Receipts from Plant Protection Services';
    }
    return '0401008000081000000NVN - Other Receipts';
  };

  const getChallanCodeOnly = () => {
    const fullCode = getChallanCode();
    return fullCode.split(' - ')[0];
  };

  const handleLicenseTypeChange = (type: LicenseType) => {
    setLicenseType(type);
  };

  const handleApplicationTypeChange = (type: ApplicationType) => {
    setApplicationType(type);
  };

  const handleDealerTypeChange = (type: DealerType) => {
    setDealerType(type);
    if (type !== 'retailer') {
      setDivision(''); // Reset division when not retailer
      setCustomDivision('');
    }
  };

  const handleAreaTypeChange = (type: AreaType) => {
    setAreaType(type);
    setNumberOfProducts(''); // Reset number of products when area type changes
  };

  const handleNumberOfProductsChange = (value: string) => {
    setNumberOfProducts(value);
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
  };

  const handleDivisionChange = (value: string) => {
    setDivision(value);
    if (value !== 'Others') {
      setCustomDivision('');
    }
  };

  const handleFertilizerAmendmentTypeChange = (type: FertilizerAmendmentType) => {
    setFertilizerAmendmentType(type);
  };

  const handleSeedAmendmentTypeChange = (type: SeedAmendmentType) => {
    setSeedAmendmentType(type);
  };

  const handleInsecticideAmendmentTypeChange = (type: InsecticideAmendmentType) => {
    setInsecticideAmendmentType(type);
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`${fieldName} copied successfully`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceedToChallan = () => {
    setShowModal(true);
  };

  const handleConfirmProceed = () => {
    setShowModal(false);
    // Open external portal - preserve existing functionality
    window.open('https://ifmis.telangana.gov.in/manual_challan_entry', '_blank');
  };

  // Authenticated Officer / Test / Admin view — impeccable AGRONIX styling
  if (isLoginUser) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        {/* Module Header */}
        <ModulePageHeader
          title={t('License Services', 'లైసెన్స్ సేవలు')}
          subtitle={t('Statutory Treasury Challan Details & DDO Code Directory', 'చట్టబద్ధమైన ట్రెజరీ చలాన్ వివరాలు & DDO కోడ్ డైరెక్టరీ')}
          icon={ReceiptText}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-slate-900">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              {toast.message}
            </div>
          </div>
        )}

        {/* Category selector */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {t('Select Category', 'వర్గాన్ని ఎంచుకోండి')}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('Choose statutory category to calculate treasury challan fees & DDO codes', 'ట్రెజరీ చలాన్ ఫీజులు మరియు DDO కోడ్‌లను లెక్కించడానికి వర్గాన్ని ఎంచుకోండి')}
              </p>
            </div>
            {licenseType && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
                {licenseType === 'fertilizer' ? t('Fertilizer', 'ఎరువులు') : licenseType === 'seed' ? t('Seed', 'విత్తనాలు') : t('Pesticide', 'పురుగుమందులు')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            {LICENSE_CATEGORIES.map((cat) => {
              const isSelected = licenseType === cat.id;
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleLicenseTypeChange(cat.id as LicenseType)}
                  className={`group relative flex min-h-[58px] items-center justify-between overflow-hidden rounded-xl border p-3 sm:p-3.5 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-700 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white shadow-md shadow-emerald-950/20'
                      : 'border-slate-200/90 bg-slate-50/60 text-slate-800 shadow-2xs hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {isSelected && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400" />
                  )}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                        isSelected
                          ? 'bg-white/15 text-white ring-1 ring-white/20'
                          : cat.tone === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/50'
                          : cat.tone === 'sky'
                          ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/50'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/50'
                      }`}
                    >
                      <CatIcon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-black font-[var(--font-heading)]">
                        {language === 'te' ? cat.telugu : cat.label}
                      </span>
                      <span className={`block text-[11px] font-semibold ${isSelected ? 'text-emerald-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        {language === 'te' ? cat.subtextTelugu : cat.subtext}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="shrink-0 text-xs font-black text-gold-300">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Parameters Card */}
        {licenseType ? (
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/50">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white font-[var(--font-heading)]">
                    {t('License Parameters', 'లైసెన్స్ పారామితులు')}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('Select dealership classification, application type and jurisdiction', 'డీలర్‌షిప్ వర్గీకరణ, దరఖాస్తు రకం మరియు అధికార పరిధిని ఎంచుకోండి')}
                  </p>
                </div>
              </div>
            </div>

            {/* Dealer Type (for Fertilizer) */}
            {showDealerType && (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t('Dealer Type', 'డీలర్ రకం')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'retailer', label: 'Retailer', telugu: 'రిటైలర్' },
                    { value: 'wholesaler', label: 'Wholesaler', telugu: 'హోల్‌సేలర్' },
                    { value: 'coop_societies', label: 'Coop. Societies', telugu: 'సహకార సంఘాలు' },
                    { value: 'manufacturing_license', label: 'Manufacturing', telugu: 'తయారీ లైసెన్స్' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleDealerTypeChange(opt.value as DealerType)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-150 ${
                        dealerType === opt.value
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-200/90 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Store className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{language === 'te' ? opt.telugu : opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Area Type (for Insecticide) */}
            {showAreaType && (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t('Area Classification', 'ప్రాంత వర్గీకరణ')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'municipal', label: 'Urban Areas', telugu: 'పట్టణ ప్రాంతాలు (Urban)' },
                    { value: 'rural', label: 'Rural Areas', telugu: 'గ్రామీణ ప్రాంతాలు (Rural)' },
                    { value: 'manufacturing_license', label: 'Manufacturing License', telugu: 'తయారీ లైసెన్స్ (Mfg)' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAreaTypeChange(opt.value as AreaType)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-150 ${
                        areaType === opt.value
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-200/90 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{language === 'te' ? opt.telugu : opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Application Type */}
            {licenseType && (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t('Application Type', 'దరఖాస్తు రకం')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { value: 'fresh', label: 'Fresh', telugu: 'కొత్తది' },
                    { value: 'renewal', label: 'Renewal', telugu: 'పునరుద్ధరణ' },
                    { value: 'renewal_grace_period', label: 'Grace Period', telugu: 'గ్రేస్ పీరియడ్' },
                    { value: 'amendment', label: 'Amendment', telugu: 'సవరణ' },
                    { value: 'duplicate', label: 'Duplicate', telugu: 'డూప్లికేట్' },
                    { value: 'pc_inclusion', label: 'PC Inclusion', telugu: 'PC చేరిక' },
                  ].filter(opt => {
                    if (licenseType === 'insecticide') {
                      return ['fresh', 'renewal', 'renewal_grace_period', 'amendment', 'duplicate', 'pc_inclusion'].includes(opt.value);
                    }
                    return ['fresh', 'renewal', 'renewal_grace_period', 'amendment', 'duplicate'].includes(opt.value);
                  }).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleApplicationTypeChange(opt.value as ApplicationType)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-150 ${
                        applicationType === opt.value
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-200/90 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{language === 'te' ? opt.telugu : opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amendment Dropdowns */}
            {showFertilizerAmendmentType && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 dark:border-emerald-800/60 dark:bg-emerald-950/20">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('Fertilizer Amendment Type', 'ఎరువుల సవరణ రకం')}
                </label>
                <select
                  value={fertilizerAmendmentType}
                  onChange={(e) => handleFertilizerAmendmentTypeChange(e.target.value as FertilizerAmendmentType)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white py-2 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">{t('Select Amendment Type', 'సవరణ రకాన్ని ఎంచుకోండి')}</option>
                  {Object.entries(FERTILIZER_AMENDMENT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {showSeedAmendmentType && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 dark:border-emerald-800/60 dark:bg-emerald-950/20">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('Seed Amendment Type', 'విత్తన సవరణ రకం')}
                </label>
                <select
                  value={seedAmendmentType}
                  onChange={(e) => handleSeedAmendmentTypeChange(e.target.value as SeedAmendmentType)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white py-2 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">{t('Select Amendment Type', 'సవరణ రకాన్ని ఎంచుకోండి')}</option>
                  {Object.entries(SEED_AMENDMENT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {showInsecticideAmendmentType && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 dark:border-emerald-800/60 dark:bg-emerald-950/20">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('Insecticide Amendment Type', 'పురుగుమందుల సవరణ రకం')}
                </label>
                <select
                  value={insecticideAmendmentType}
                  onChange={(e) => handleInsecticideAmendmentTypeChange(e.target.value as InsecticideAmendmentType)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white py-2 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">{t('Select Amendment Type', 'సవరణ రకాన్ని ఎంచుకోండి')}</option>
                  {Object.entries(INSECTICIDE_AMENDMENT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* District & Division */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* District */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t('District', 'జిల్లా')}
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">{t('Select District', 'జిల్లాను ఎంచుకోండి')}</option>
                    {TELANGANA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                </div>
              </div>

              {/* Division / Product count */}
              {showDivision ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t('Division', 'డివిజన్')}
                  </label>
                  <div className="relative">
                    <select
                      value={division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      disabled={!district}
                      className="w-full appearance-none rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">{t('Select Division', 'డివిజన్ ఎంచుకోండి')}</option>
                      {getDivisionsForDistrict(district).map((div) => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                      <option value="Others">{t('Others', 'ఇతరులు')}</option>
                    </select>
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                  </div>
                  {division === 'Others' && (
                    <input
                      type="text"
                      value={customDivision}
                      onChange={(e) => setCustomDivision(e.target.value)}
                      placeholder={t('Enter division name', 'డివిజన్ పేరు నమోదు చేయండి')}
                      className="mt-2 w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  )}
                </div>
              ) : showNumberOfProducts ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t('Number of Products', 'ఉత్పత్తుల సంఖ్య')}
                  </label>
                  <input
                    type="number"
                    value={numberOfProducts}
                    onChange={(e) => handleNumberOfProductsChange(e.target.value)}
                    min="1"
                    placeholder={t('Enter product count', 'ఉత్పత్తుల సంఖ్య నమోదు చేయండి')}
                    className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Empty State Prompt */}
        {!showChallanDetails && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 sm:p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-[var(--font-heading)]">
              {licenseType ? t('Complete License Parameters', 'లైసెన్స్ పారామితులను పూర్తి చేయండి') : t('Select a License Category Above', 'పైన లైసెన్స్ వర్గాన్ని ఎంచుకోండి')}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {licenseType
                ? t('Choose dealer classification, application type and jurisdiction to view Treasury Challan details and fee breakdown.', 'ట్రెజరీ చలాన్ వివరాలు మరియు రుసుమును చూడటానికి డీలర్ వర్గీకరణ, దరఖాస్తు రకం మరియు జిల్లాను ఎంచుకోండి.')
                : t('Select Fertilizer, Seed, or Pesticide above to get started with automated challan computation.', 'ఆటోమేటెడ్ చలాన్ లెక్కింపును ప్రారంభించడానికి పైన ఎరువులు, విత్తనాలు లేదా పురుగుమందులను ఎంచుకోండి.')}
            </p>
          </div>
        )}

        {/* Challan Details */}
        {showChallanDetails && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/50">
                  <ReceiptText className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white font-[var(--font-heading)]">
                    {t('Treasury Challan Details', 'ట్రెజరీ చలాన్ వివరాలు')}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('IFMIS Treasury portal entry parameters & auto-computed statutory fee', 'IFMIS ట్రెజరీ పోర్టల్ పారామితులు మరియు చట్టబద్ధమైన రుసుము')}
                  </p>
                </div>
              </div>
            </div>

            {/* Challan Code & DDO Code Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Challan Code */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t('Challan Code', 'చలాన్ కోడ్')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(getChallanCodeOnly(), 'Challan Code')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {copiedField === 'Challan Code' ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">{t('Copied', 'కాపీ చేయబడింది')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>{t('Copy Code', 'కాపీ చేయండి')}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-words">
                  {getChallanCode()}
                </p>
              </div>

              {/* DDO Code */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t('DDO Code', 'DDO కోడ్')} {resolvedDivision ? `(${resolvedDivision})` : district ? `(${district})` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(ddoCode, 'DDO Code')}
                    disabled={!ddoCode}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50"
                  >
                    {copiedField === 'DDO Code' ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">{t('Copied', 'కాపీ చేయబడింది')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>{t('Copy DDO', 'కాపీ చేయండి')}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-wider">
                  {ddoCode || (
                    <span className="font-sans text-xs font-medium text-slate-400">
                      {resolvedDivision ? t('DDO code not available for this division', 'ఈ డివిజన్‌కు DDO కోడ్ అందుబాటులో లేదు') : t('Select district/division', 'జిల్లా/డివిజన్ ఎంచుకోండి')}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Accounting Heads */}
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <Landmark className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {t('Treasury Accounting Heads', 'ట్రెజరీ అకౌంటింగ్ హెడ్స్')}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { label: 'Major Head', val: getChallanHeads().majorHead.split(' ')[0], sub: getChallanHeads().majorHead.split(' ').slice(1).join(' ') },
                  { label: 'Sub Major Head', val: getChallanHeads().subMajorHead },
                  { label: 'Minor Head', val: getChallanHeads().minorHead.split(' ')[0], sub: getChallanHeads().minorHead.split(' ').slice(1).join(' ') },
                  { label: 'Group Sub Head', val: getChallanHeads().groupSubHead },
                  { label: 'Sub Head', val: getChallanHeads().subHead.split(' ')[0], sub: getChallanHeads().subHead.split(' ').slice(1).join(' ') },
                  { label: 'Detailed Head', val: '000' },
                  { label: 'Sub Detailed Head', val: '000' },
                  { label: 'Non-Plan/Plan', val: 'N' },
                  { label: 'Voted/Charged', val: 'V' },
                  { label: 'Non-Contingency', val: 'N' },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>
                    <p className="mt-0.5 text-sm font-black text-slate-900 dark:text-white font-mono">
                      {item.val}
                    </p>
                    {item.sub && (
                      <p className="text-[10px] font-medium text-slate-400 truncate" title={item.sub}>
                        {item.sub}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Applicable Fee Section */}
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 p-4 sm:p-5 dark:border-emerald-800/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    <IndianRupee className="h-4 w-4" />
                    <span>{t('Statutory Treasury Fee', 'చట్టబద్ధమైన ట్రెజరీ ఫీజు')}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300 font-[var(--font-heading)]">
                      ₹ {getAmount().toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200/70 bg-white/80 p-2.5 text-xs dark:border-emerald-800/50 dark:bg-slate-800/70 sm:text-right">
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {licenseType === 'fertilizer' ? t('Fertilizer', 'ఎరువులు') : licenseType === 'seed' ? t('Seed', 'విత్తనాలు') : t('Pesticide', 'పురుగుమందులు')}
                    {dealerType ? ` • ${dealerType.replace(/_/g, ' ')}` : ''}
                    {applicationType ? ` • ${applicationType.replace(/_/g, ' ')}` : ''}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Standard government challan fee for selected parameters', 'ఎంచుకున్న పారామితులకు వర్తించే ప్రభుత్వ చలాన్ రుసుము')}
                  </p>
                </div>
              </div>
            </div>

            {/* Proceed CTA */}
            <button
              type="button"
              onClick={handleProceedToChallan}
              className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 px-6 py-3.5 text-sm font-bold text-white shadow-xs transition hover:from-emerald-800 hover:to-emerald-900 hover:shadow-sm dark:from-emerald-600 dark:to-emerald-700"
            >
              <ExternalLink className="h-[18px] w-[18px]" />
              <span>{t('Proceed to Treasury Portal (IFMIS)', 'ట్రెజరీ పోర్టల్‌కు వెళ్లండి (IFMIS)')}</span>
            </button>

            {/* Info Message */}
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
              <p>
                {t(
                  'You will be redirected to the Telangana IFMIS Treasury portal. Please keep the Challan Code and DDO Code copied above for input into the treasury portal form.',
                  'మీరు తెలంగాణ IFMIS ట్రెజరీ పోర్టల్‌కు మళ్లించబడతారు. పోర్టల్ ఫారమ్‌లో నమోదు చేయడానికి పైన కాపీ చేసిన చలాన్ కోడ్ మరియు DDO కోడ్‌ను సిద్ధంగా ఉంచుకోండి.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800/50">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white font-[var(--font-heading)]">
                    {t('Proceed to Challan Entry?', 'చలాన్ ఎంట్రీకి వెళ్లాలా?')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('External Government Portal', 'బాహ్య ప్రభుత్వ పోర్టల్')}
                  </p>
                </div>
              </div>
              <p className="mb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t(
                  'You will be redirected to the external IFMIS treasury portal in a new tab. Please use the challan and DDO codes displayed on this page.',
                  'మీరు కొత్త ట్యాబ్‌లో బాహ్య IFMIS ట్రెజరీ పోర్టల్‌కు మళ్లించబడతారు. దయచేసి ఈ పేజీలో ప్రదర్శించబడిన చలాన్ మరియు DDO కోడ్‌లను ఉపయోగించండి.'
                )}
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                >
                  {t('Cancel', 'రద్దు')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmProceed}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>{t('Proceed', 'కొనసాగించు')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Public Guest view — preserves original toolkit header and layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4 pb-28 sm:p-6 sm:pb-24">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <ModulePageHeader
          className="mb-4"
          title={t('License Services', 'లైసెన్స్ సేవలు')}
          subtitle={t('Challan Details', 'చలాన్ వివరాలు')}
          icon={FileCheck}
          onBack={() => navigate('/officer-toolkit')}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-slate-900">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              {toast.message}
            </div>
          </div>
        )}

        {/* License Details Card */}
        <div className="mb-6 rounded-2xl border border-slate-200/50 bg-white/95 p-5 shadow-xl dark:border-slate-800/50 dark:bg-slate-900/95">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                License Details
              </h2>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Select license type, dealer type, application type and district
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* License Type */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                License Type
              </label>
              <div className="relative">
                <select
                  value={licenseType}
                  onChange={(e) => handleLicenseTypeChange(e.target.value as LicenseType)}
                  className="w-full appearance-none rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 pl-11 text-sm text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                >
                  <option value="">Select License Type</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="seed">Seed</option>
                  <option value="insecticide">Pesticide</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <Sprout className="h-5 w-5" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Dealer Type - Segmented Control */}
            {showDealerType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dealer Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'retailer', label: 'Retailer' },
                    { value: 'wholesaler', label: 'Wholesaler' },
                    { value: 'coop_societies', label: 'Coop. Societies' },
                    { value: 'manufacturing_license', label: 'Manufacturing License' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDealerTypeChange(option.value as DealerType)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                        dealerType === option.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Store className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Application Type - Segmented Control */}
            {licenseType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Application Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'fresh', label: 'Fresh' },
                    { value: 'renewal', label: 'Renewal' },
                    { value: 'renewal_grace_period', label: 'Renewal (Grace Period)' },
                    { value: 'amendment', label: 'Amendment' },
                    { value: 'duplicate', label: 'Duplicate' },
                    { value: 'pc_inclusion', label: 'PC Inclusion' }
                  ].filter(option => {
                    // Filter options based on license type
                    if (licenseType === 'insecticide') {
                      return ['fresh', 'renewal', 'renewal_grace_period', 'amendment', 'duplicate', 'pc_inclusion'].includes(option.value);
                    }
                    return ['fresh', 'renewal', 'renewal_grace_period', 'amendment', 'duplicate'].includes(option.value);
                  }).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleApplicationTypeChange(option.value as ApplicationType)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                        applicationType === option.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                      }`}
                    >
                      <ClipboardList className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Area Type - Segmented Control for Insecticide */}
            {showAreaType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Area Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'municipal', label: 'Urban Areas' },
                    { value: 'rural', label: 'Rural Areas' },
                    { value: 'manufacturing_license', label: 'Manufacturing License' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAreaTypeChange(option.value as AreaType)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                        areaType === option.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* District */}
            {licenseType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  District
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 pl-11 text-sm text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                  >
                    <option value="">Select District</option>
                    {TELANGANA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>
            )}

            {/* Division */}
            {showDivision && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Division
                </label>
                <div className="relative">
                  <select
                    value={division}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 pl-11 text-sm text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                  >
                    <option value="">Select Division</option>
                    {getDivisionsForDistrict(district).map((div) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
                {division === 'Others' && (
                  <input
                    type="text"
                    value={customDivision}
                    onChange={(e) => setCustomDivision(e.target.value)}
                    placeholder="Enter division name"
                    className="mt-2 w-full rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                  />
                )}
              </div>
            )}

            {/* Number of Products for Insecticide */}
            {showNumberOfProducts && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Number of Products
                </label>
                <input
                  type="number"
                  value={numberOfProducts}
                  onChange={(e) => handleNumberOfProductsChange(e.target.value)}
                  min="1"
                  className="w-full rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                  placeholder="Enter number of products"
                />
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!showChallanDetails && (
          <div className="mb-6 rounded-2xl border border-slate-200/50 bg-white/95 p-8 text-center shadow-xl dark:border-slate-800/50 dark:bg-slate-900/95">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <ClipboardList className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              Select License Details
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Choose the required license details to view the applicable challan information.
            </p>
          </div>
        )}

        {/* Challan Details Section */}
        {showChallanDetails && (
          <div className="mb-6 rounded-2xl border border-slate-200/50 bg-white/95 p-5 shadow-xl dark:border-slate-800/50 dark:bg-slate-900/95">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #5B7DBF 0%, #6879C4 50%, #806BC4 100%)' }}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Challan Details
                  </h2>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Use the following details for challan entry in the treasury portal
                  </p>
                </div>
              </div>
            </div>

            {/* Challan Code Card */}
            <div className="mb-4 rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-800/50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="mb-2 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Challan Code
                </h3>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {getChallanCode()}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(getChallanCodeOnly(), 'Challan Code')}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200/50 bg-white/80 px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 dark:border-blue-800/50 dark:bg-slate-800/80 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  {copiedField === 'Challan Code' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DDO Code Card */}
            <div className="mb-6 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  DDO Code
                </h3>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {ddoCode ? (
                    <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                      {ddoCode}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {resolvedDivision
                        ? 'DDO code not available for this division'
                        : district
                          ? 'DDO code not available for this district'
                          : 'Select a district'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(ddoCode, 'DDO Code')}
                  disabled={!ddoCode}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200/50 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  {copiedField === 'DDO Code' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Accounting Details */}
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Accounting Details
                </h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Major Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().majorHead.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {getChallanHeads().majorHead.split(' ').slice(1).join(' ')}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sub Major Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().subMajorHead}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Minor Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().minorHead.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {getChallanHeads().minorHead.split(' ').slice(1).join(' ')}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Group Sub Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().groupSubHead}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sub Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().subHead.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {getChallanHeads().subHead.split(' ').slice(1).join(' ')}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Detailed Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    000
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sub Detailed Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    000
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Non-Plan/Plan</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    N
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Voted/Charged</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    V
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Non-Contingency/Contingency</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    N
                  </p>
                </div>
              </div>
            </div>

            {/* Applicable Fee Section */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Applicable Fee
                </h3>
              </div>
              <p className="mb-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                Fee automatically calculated based on your selection
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-sm dark:border-emerald-800/50 dark:from-emerald-950/30 dark:to-green-950/30">
                  <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    Amount (₹)
                  </p>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                    ₹ {getAmount().toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/50 bg-white p-5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    Fee Details
                  </p>
                  <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
                    {licenseType === 'fertilizer' ? 'Fertilizer' : licenseType === 'seed' ? 'Seed' : 'Pesticide'}
                    {showDealerType && dealerType && ` • ${dealerType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                    {applicationType && ` • ${applicationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    The above fee is applicable for your selected license type, dealer type and application type.
                  </p>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToChallan}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg transition duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
              style={{ minHeight: '52px' }}
            >
              <ExternalLink className="h-5 w-5" />
              <span>Proceed to Challan Entry</span>
            </button>

            {/* Info Message */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200/50 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
              <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                You will be redirected to the external Challan Entry Portal. Please use the challan details displayed above while entering the information.
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-6 shadow-2xl dark:border-slate-800/50 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <ExternalLink className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Proceed to Challan Entry?
                </h3>
              </div>
              <p className="mb-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                You will be redirected to the external portal. Please use the challan details displayed above while entering the information.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200/50 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:border-slate-800/50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmProceed}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Proceed</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Amendment Type Selections - Hidden for now */}
        {showFertilizerAmendmentType && (
          <div className={`mb-4 transition duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Fertilizer Amendment Type
              </h3>
            </div>
            <div className="w-full max-w-md">
              <select
                value={fertilizerAmendmentType}
                onChange={(e) => handleFertilizerAmendmentTypeChange(e.target.value as FertilizerAmendmentType)}
                className="w-full rounded-2xl border border-emerald-200/50 bg-white/80 px-4 py-3 text-base text-slate-900 outline-none transition duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-emerald-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(FERTILIZER_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Seed Amendment Type Selection - Hidden for now */}
        {showSeedAmendmentType && (
          <div className={`mb-4 transition duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Seed Amendment Type
              </h3>
            </div>
            <div className="w-full max-w-md">
              <select
                value={seedAmendmentType}
                onChange={(e) => handleSeedAmendmentTypeChange(e.target.value as SeedAmendmentType)}
                className="w-full rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 text-base text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(SEED_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Insecticide Amendment Type Selection - Hidden for now */}
        {showInsecticideAmendmentType && (
          <div className={`mb-4 transition duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Insecticide Amendment Type
              </h3>
            </div>
            <div className="w-full max-w-md">
              <select
                value={insecticideAmendmentType}
                onChange={(e) => handleInsecticideAmendmentTypeChange(e.target.value as InsecticideAmendmentType)}
                className="w-full rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 text-base text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(INSECTICIDE_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
